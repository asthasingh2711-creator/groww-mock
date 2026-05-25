#!/usr/bin/env python3
"""Aggregate review CSVs into src/data/review_analytics.json for the analytics UI."""

from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "review_analytics.json"

SOURCES = {
    "all": ROOT / "outputs" / "groww_reviews_combined.csv",
    "ios": ROOT / "outputs" / "groww_reviews_app_store.csv",
    "android": ROOT / "outputs" / "groww_reviews_play_store.csv",
}

STOPWORDS = {
    "that", "this", "with", "from", "have", "your", "very", "been", "they",
    "what", "when", "will", "also", "just", "like", "about", "more", "than",
    "into", "only", "good", "best", "groww", "grow", "application", "using",
}

THEME_DEFS = [
    ("brokerage", "High Brokerage Charges", ["brokerage", "charge", "charges", "fees", "commission"]),
    ("support", "Poor Customer Support", ["support", "customer", "response", "helpline", "call"]),
    ("withdrawal", "Withdrawal Issues", ["withdrawal", "withdraw", "payout", "money", "transfer"]),
    ("glitches", "Technical Glitches", ["crash", "glitch", "bug", "freeze", "slow", "hang"]),
    ("orders", "Order Execution Problems", ["order", "execution", "sell", "fno", "options", "market"]),
]

STORE_LABEL = {"app_store": "App Store", "play_store": "Play Store"}


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def parse_row(r: dict[str, str]) -> dict:
    rating = int(float(r["rating"]))
    dt = datetime.fromisoformat(r["date"].replace("Z", "+00:00"))
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    text = f"{r.get('title') or ''} {r.get('content') or ''}".lower()
    return {
        "rating": rating,
        "date": dt,
        "week": dt.strftime("%G-W%V"),
        "text": text,
        "content": (r.get("content") or r.get("title") or "").strip(),
        "store": r.get("store", ""),
        "author": r.get("author", "User"),
    }


def build_volume_series(
    parsed: list[dict], range_id: str, anchor: date
) -> tuple[list[str], list[int], str, str]:
    """Volume buckets aligned to calendar time range (fixed slot count per filter)."""
    if not parsed:
        return [], [], "daily", "No reviews in selected window"

    day_counts: Counter[date] = Counter(r["date"].date() for r in parsed)

    if range_id == "today":
        labels = [anchor.strftime("%b %d")]
        values = [len(parsed)]
        return labels, values, "daily", f"Reviews on latest day · {anchor.strftime('%b %d, %Y')}"

    if range_id == "7d":
        days = [anchor - timedelta(days=i) for i in range(6, -1, -1)]
        labels = [d.strftime("%a %d") for d in days]
        values = [day_counts.get(d, 0) for d in days]
        return labels, values, "daily", "Daily volume · last 7 calendar days"

    if range_id == "30d":
        bucket_days = 5
        range_start = anchor - timedelta(days=29)
        labels = []
        values = []
        for b in range(6):
            bucket_start = range_start + timedelta(days=b * bucket_days)
            bucket_end = range_start + timedelta(
                days=min(b * bucket_days + bucket_days - 1, 29)
            )
            total = sum(
                day_counts.get(range_start + timedelta(days=offset), 0)
                for offset in range(b * bucket_days, min(b * bucket_days + bucket_days, 30))
            )
            if bucket_start == bucket_end:
                labels.append(bucket_start.strftime("%b %d"))
            else:
                labels.append(
                    f"{bucket_start.strftime('%b %d')} – {bucket_end.strftime('%b %d')}"
                )
            values.append(total)
        return labels, values, "daily", "Volume in 5-day buckets · last 30 calendar days"

    # 8–12 weeks: weekly buckets (only weeks that overlap the window)
    week_counts: Counter[str] = Counter(r["week"] for r in parsed)
    week_keys = sorted(week_counts.keys())[-12:]
    labels = [f"W{int(w.split('-W')[1])}" for w in week_keys]
    values = [week_counts[w] for w in week_keys]
    start = anchor - timedelta(days=83)
    return (
        labels,
        values,
        "weekly",
        f"Weekly volume · {start.strftime('%b %d')} – {anchor.strftime('%b %d')}",
    )


def ordered_days_for_range(parsed: list[dict], range_id: str, anchor: date) -> list[date]:
    if not parsed:
        return []
    if range_id == "today":
        return [anchor]
    if range_id == "7d":
        return [anchor - timedelta(days=i) for i in range(6, -1, -1)]
    if range_id == "30d":
        return [anchor - timedelta(days=i) for i in range(29, -1, -1)]
    return sorted({r["date"].date() for r in parsed})


def pct_change(curr: float, prev: float) -> float:
    if prev <= 0:
        return round(curr * 100, 1) if curr > 0 else 0.0
    return round(((curr - prev) / prev) * 100, 1)


def match_themes(text: str) -> list[str]:
    hits = []
    for tid, _, keys in THEME_DEFS:
        if any(k in text for k in keys):
            hits.append(tid)
    return hits


def extract_keywords(rows: list[dict], limit: int = 12) -> list[str]:
    words: Counter[str] = Counter()
    for row in rows:
        for w in re.findall(r"[a-z]{4,}", row["text"]):
            if w not in STOPWORDS:
                words[w] += 1
    return [w for w, _ in words.most_common(limit)]


def build_keyword_hits(
    parsed: list[dict], keywords: list[str], per_keyword: int = 5
) -> list[dict]:
    """Sample reviews per trending keyword for in-app highlighting."""
    hits: list[dict] = []
    for kw in keywords:
        count = sum(1 for row in parsed if kw in row["text"])
        samples: list[dict] = []
        # Prefer low-rated reviews first (more actionable), then recent
        candidates = sorted(
            [r for r in parsed if kw in r["text"]],
            key=lambda r: (r["rating"] > 2, -r["date"].timestamp()),
        )
        for row in candidates:
            if len(samples) >= per_keyword:
                break
            quote = row["content"][:240].strip()
            if len(quote) < 10:
                continue
            samples.append(
                {
                    "quote": quote,
                    "source": STORE_LABEL.get(row["store"], "Store"),
                    "stars": row["rating"],
                }
            )
        hits.append({"keyword": kw, "count": count, "reviews": samples})
    return hits


RANGE_CONFIG: list[tuple[str, int | None, str]] = [
    ("today", 1, "Today"),
    ("7d", 7, "7 Days"),
    ("30d", 30, "30 Days"),
    ("8-12w", None, "8-12 Weeks"),
]


def filter_by_range(parsed: list[dict], range_id: str, anchor: date) -> list[dict]:
    """Filter reviews to calendar windows ending on anchor (latest review day)."""
    if not parsed:
        return []
    if range_id == "today":
        return [r for r in parsed if r["date"].date() == anchor]
    if range_id == "7d":
        start = anchor - timedelta(days=6)
        return [r for r in parsed if start <= r["date"].date() <= anchor]
    if range_id == "30d":
        start = anchor - timedelta(days=29)
        return [r for r in parsed if start <= r["date"].date() <= anchor]
    if range_id == "8-12w":
        start = anchor - timedelta(days=83)
        return [r for r in parsed if r["date"].date() >= start]
    return parsed


def build_from_parsed(
    parsed: list[dict],
    range_label: str = "",
    range_id: str = "8-12w",
    anchor: date | None = None,
    data_through: str = "",
) -> dict:
    if not parsed:
        return empty_payload()

    anchor = anchor or max(r["date"].date() for r in parsed)
    ratings: Counter[int] = Counter(r["rating"] for r in parsed)
    weeks: Counter[str] = Counter(r["week"] for r in parsed)
    latest_week = sorted(weeks.keys())[-1]
    volume_labels, volume_values, volume_granularity, volume_subtitle = (
        build_volume_series(parsed, range_id, anchor)
    )
    chart_days = ordered_days_for_range(parsed, range_id, anchor)

    total = len(parsed)
    pos = sum(ratings[k] for k in ratings if k >= 4)
    neg = sum(ratings[k] for k in ratings if k <= 2)
    neu = ratings.get(3, 0)
    avg_rating = round(sum(k * ratings[k] for k in ratings) / total, 2)

    # Period-over-period metrics (daily for short windows, weekly fallback)
    prev_week = sorted(weeks.keys())[-2] if len(weeks) >= 2 else sorted(weeks.keys())[-1]
    last_week = sorted(weeks.keys())[-1]
    last_rows = [r for r in parsed if r["week"] == last_week]
    prev_rows = [r for r in parsed if r["week"] == prev_week]

    def positive_pct(rs: list[dict]) -> float:
        if not rs:
            return 0.0
        return 100 * sum(1 for r in rs if r["rating"] >= 4) / len(rs)

    def avg_for(rs: list[dict]) -> float:
        if not rs:
            return avg_rating
        return round(sum(r["rating"] for r in rs) / len(rs), 2)

    sentiment_score = round(100 * pos / total)
    sentiment_delta = round(positive_pct(last_rows) - positive_pct(prev_rows), 1)
    avg_rating_delta = round(avg_for(last_rows) - avg_for(prev_rows), 2)
    if len(volume_values) >= 2:
        wow_review_delta = pct_change(volume_values[-1], volume_values[-2])
    else:
        wow_review_delta = pct_change(weeks.get(last_week, 0), weeks.get(prev_week, 0))

    # Theme aggregation
    theme_week_counts: dict[str, Counter[str]] = {
        tid: Counter() for tid, _, _ in THEME_DEFS
    }
    theme_reviews: dict[str, list[dict]] = {tid: [] for tid, _, _ in THEME_DEFS}

    for row in parsed:
        for tid in match_themes(row["text"]):
            theme_week_counts[tid][row["week"]] += 1
            theme_reviews[tid].append(row)

    theme_stats = []
    for tid, title, _ in THEME_DEFS:
        matched = theme_reviews[tid]
        count = len(matched)
        if count == 0:
            continue
        low = sum(1 for r in matched if r["rating"] <= 2)
        day_theme = Counter(
            r["date"].date() for r in matched if r["date"].date() in set(chart_days)
        )
        spark = [day_theme.get(d, 0) for d in chart_days]
        last_c = theme_week_counts[tid].get(last_week, 0)
        prev_c = theme_week_counts[tid].get(prev_week, 0)
        theme_stats.append({
            "id": tid,
            "title": title,
            "count": count,
            "pct": round(100 * count / total),
            "lowPct": round(100 * low / count) if count else 0,
            "wowDelta": max(0, round(pct_change(last_c, prev_c))),
            "sparkline": spark,
            "reviews": count,
            "priority": "Critical" if low / count > 0.5 else "High",
            "description": describe_theme(tid, count, low, total),
        })

    theme_stats.sort(key=lambda t: t["count"], reverse=True)
    theme_cards = theme_stats[:5]

    # Trend alert from top WoW theme or volume spike
    top_theme = max(theme_stats, key=lambda t: t["wowDelta"], default=None)
    if top_theme and top_theme["wowDelta"] >= 10:
        trend_alert = (
            f"{top_theme['title']} mentions up +{top_theme['wowDelta']}% week-over-week"
        )
    elif wow_review_delta >= 15:
        trend_alert = f"Review volume up +{wow_review_delta}% in the latest week"
    else:
        trend_alert = (
            f"Negative reviews at {round(100 * neg / total)}% of "
            f"{total} public store samples"
        )

    keywords = extract_keywords(parsed)
    keyword_hits = build_keyword_hits(parsed, keywords)
    user_voices = pick_quotes(parsed)
    pm_radar = build_pm_radar(theme_stats)
    weekly_note = build_weekly_note(
        parsed, theme_cards, user_voices, avg_rating, sentiment_score, total
    )
    y, w = map(int, latest_week.split("-W"))
    week_code = f"{y}-W{w}"
    period_end = max(r["date"] for r in parsed).strftime("%Y-%m-%d")
    period_start = min(r["date"] for r in parsed).strftime("%Y-%m-%d")
    period = f"{period_start} → {period_end}"
    if range_label:
        period = f"{period} · {range_label}"
    if data_through:
        period = f"{period} · through {data_through}"

    executive = (
        f"Analysis of {total} public App Store & Play reviews ({period_start} → "
        f"{period_end}): average {avg_rating}★ with {sentiment_score}% positive "
        f"sentiment. Top friction: "
        + ", ".join(t["title"] for t in theme_cards[:3])
        + "."
    )

    email_body = build_email_body(week_code, theme_cards, user_voices, avg_rating, total)

    return {
        "weekCode": week_code,
        "weekLabel": f"Week {w}, {y}",
        "period": period,
        "reviewCount": total,
        "wordCount": len(weekly_note["summary"].split()),
        "wordLimit": 250,
        "avgRating": avg_rating,
        "avgRatingDelta": avg_rating_delta,
        "sentimentScore": sentiment_score,
        "sentimentDelta": sentiment_delta,
        "wowReviewDelta": wow_review_delta,
        "weeklyVolume": volume_values,
        "volumeLabels": volume_labels,
        "volumeGranularity": volume_granularity,
        "volumeSubtitle": volume_subtitle,
        "ratingDistribution": [ratings.get(i, 0) for i in range(1, 6)],
        "sentimentSplit": {
            "positive": round(100 * pos / total),
            "negative": round(100 * neg / total),
            "neutral": round(100 * neu / total),
        },
        "trendAlert": trend_alert,
        "keywords": keywords,
        "keywordHits": keyword_hits,
        "themeCards": theme_cards,
        "pmRadar": pm_radar,
        "userVoices": user_voices,
        "weeklyNote": weekly_note,
        "emailDraft": {
            "to": "team@groww.in",
            "subject": "Groww Weekly Review Pulse",
            "body": email_body,
        },
        "executiveSummary": executive,
        "dataThrough": data_through or period_end,
    }


def describe_theme(tid: str, count: int, low: int, total: int) -> str:
    pct = round(100 * count / total)
    low_pct = round(100 * low / count) if count else 0
    templates = {
        "brokerage": f"Mentioned in {pct}% of sample reviews; {low_pct}% are 1–2★ charge complaints.",
        "support": f"Support friction in {count} reviews ({low_pct}% low-rated).",
        "withdrawal": f"Payout / withdrawal language in {count} reviews — trust-sensitive.",
        "glitches": f"Stability issues cited in {count} reviews during peak usage.",
        "orders": f"Order flow complaints in {count} reviews across F&O and cash segments.",
    }
    return templates.get(tid, f"Clustered theme across {count} reviews.")


def pick_quotes(rows: list[dict], limit: int = 6) -> list[dict]:
    low = sorted([r for r in rows if r["rating"] <= 2], key=lambda r: len(r["content"]), reverse=True)
    high = sorted([r for r in rows if r["rating"] >= 4], key=lambda r: len(r["content"]), reverse=True)
    picks = []
    for bucket in (low, high):
        for row in bucket:
            if len(picks) >= limit:
                break
            quote = row["content"][:160].strip()
            if len(quote) < 12:
                continue
            picks.append({
                "quote": quote,
                "source": STORE_LABEL.get(row["store"], "Store"),
                "stars": row["rating"],
            })
    return picks[:limit]


def build_pm_radar(theme_stats: list[dict]) -> dict:
    if not theme_stats:
        return {"highImpact": [], "highFrequency": [], "monitor": []}

    icons = {
        "withdrawal": "🔥",
        "support": "📞",
        "brokerage": "💰",
        "glitches": "⚡",
        "orders": "📉",
    }

    def item(t: dict, severity: str) -> dict:
        return {
            "title": t["title"],
            "count": t["count"],
            "icon": icons.get(t["id"], "⚠"),
            "severity": severity,
            "description": t["description"],
        }

    by_low = sorted(theme_stats, key=lambda t: t["lowPct"], reverse=True)
    by_vol = sorted(theme_stats, key=lambda t: t["count"], reverse=True)

    high_impact = [
        item(t, "critical" if t["lowPct"] >= 55 else "warn")
        for t in by_low[:2]
    ]
    high_freq = [item(t, "warn") for t in by_vol[:2]]
    monitor = [item(t, "warn") for t in theme_stats[2:4]]

    return {
        "highImpact": high_impact,
        "highFrequency": high_freq,
        "monitor": monitor,
    }


def build_weekly_note(
    rows: list[dict],
    themes: list[dict],
    voices: list[dict],
    avg_rating: float,
    sentiment: int,
    total: int,
) -> dict:
    top3 = themes[:3]
    theme_lines = [
        f"{t['title']} — {t['pct']}% of corpus ({t['reviews']} reviews, ↑{t['wowDelta']}% WoW)"
        for t in top3
    ]
    quotes = [f"• {v['quote']}" for v in voices[:3]]
    actions = [
        f"Address {top3[0]['title'].lower()} with a product + comms fix this sprint",
        "Publish fee / withdrawal SLAs in-app before money movement",
        "Route 1–2★ tickets to expedited support within 24h",
    ] if top3 else ["Continue monitoring public review velocity"]

    summary = (
        f"Weekly pulse from {total} extracted public reviews: {avg_rating}★ average, "
        f"{sentiment}% positive sentiment. "
        + (top3[0]["title"] + " leads negative mentions." if top3 else "")
    )

    return {
        "summary": summary,
        "themes": theme_lines,
        "tracking": "WoW deltas computed from ISO week buckets in App Store & Play CSV exports.",
        "quotes": quotes,
        "actions": actions[:3],
    }


def build_email_body(
    week_code: str,
    themes: list[dict],
    voices: list[dict],
    avg_rating: float,
    total: int,
) -> str:
    lines = [
        f"Groww public review pulse ({week_code}): {total} reviews, {avg_rating}★ average.",
        "",
        "TOP THEMES:",
    ]
    for i, t in enumerate(themes[:3], 1):
        lines.append(f"{i}. {t['title']} — {t['pct']}% of sample (↑{t['wowDelta']}% WoW)")
    lines.extend(["", "USER QUOTES:"])
    lines.extend(v["quote"][:100] for v in voices[:3])
    lines.extend([
        "",
        "ACTION IDEAS:",
        "1. Clarify fees before order confirm",
        "2. Withdrawal status + SLA in app",
        "3. Escalate payout-related support tickets",
    ])
    return "\n".join(lines)


def empty_payload() -> dict:
    return {
        "weekCode": "2026-W20",
        "weekLabel": "Week 20, 2026",
        "period": "—",
        "reviewCount": 0,
        "wordCount": 0,
        "wordLimit": 250,
        "avgRating": 0,
        "avgRatingDelta": 0,
        "sentimentScore": 0,
        "sentimentDelta": 0,
        "wowReviewDelta": 0,
        "weeklyVolume": [],
        "volumeLabels": [],
        "volumeGranularity": "daily",
        "volumeSubtitle": "No reviews in selected window",
        "ratingDistribution": [0, 0, 0, 0, 0],
        "sentimentSplit": {"positive": 0, "negative": 0, "neutral": 0},
        "trendAlert": "No reviews in export",
        "keywords": [],
        "keywordHits": [],
        "themeCards": [],
        "pmRadar": {"highImpact": [], "highFrequency": [], "monitor": []},
        "userVoices": [],
        "weeklyNote": {
            "summary": "",
            "themes": [],
            "tracking": "",
            "quotes": [],
            "actions": [],
        },
        "emailDraft": {"to": "team@groww.in", "subject": "Groww Weekly Review Pulse", "body": ""},
        "executiveSummary": "",
        "dataThrough": "",
    }


def main() -> None:
    synced_at = datetime.now().isoformat(timespec="seconds")
    payload: dict = {"syncedAt": synced_at}
    for key, path in SOURCES.items():
        parsed_all = [parse_row(r) for r in load_rows(path)]
        anchor = (
            max(r["date"].date() for r in parsed_all)
            if parsed_all
            else date.today()
        )
        data_through = anchor.isoformat()
        payload[key] = {"_anchor": data_through}
        for range_id, _, label in RANGE_CONFIG:
            subset = filter_by_range(parsed_all, range_id, anchor)
            payload[key][range_id] = build_from_parsed(
                subset, label, range_id, anchor, data_through
            )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} (synced {synced_at})")


if __name__ == "__main__":
    main()
