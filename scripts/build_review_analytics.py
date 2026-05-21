#!/usr/bin/env python3
"""Aggregate review CSVs into src/data/review_analytics.json for the analytics UI."""

from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "review_analytics.json"

SOURCES = {
    "all": ROOT / "outputs" / "groww_reviews_combined.csv",
    "ios": ROOT / "outputs" / "groww_reviews_app_store.csv",
    "android": ROOT / "outputs" / "groww_reviews_play_store.csv",
}


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def week_key(date_str: str) -> str:
    from datetime import datetime

    return datetime.fromisoformat(date_str).strftime("%G-W%V")


def last_n_week_labels(end_label: str, n: int = 5) -> tuple[list[str], list[str]]:
    y, w = map(int, end_label.split("-W"))
    d = date.fromisocalendar(y, w, 1)
    iso_keys: list[str] = []
    short: list[str] = []
    for i in range(n - 1, -1, -1):
        dd = d - timedelta(weeks=i)
        iso_keys.append(dd.strftime("%G-W%V"))
        short.append(f"W{dd.isocalendar().week}")
    return iso_keys, short


def build(rows: list[dict[str, str]]) -> dict:
    weeks: Counter[str] = Counter()
    ratings: Counter[int] = Counter()
    for r in rows:
        rating = int(float(r["rating"]))
        ratings[rating] += 1
        weeks[week_key(r["date"])] += 1

    if not weeks:
        return {
            "reviewCount": 0,
            "volumeLabels": [],
            "weeklyVolume": [],
            "ratingDistribution": [0, 0, 0, 0, 0],
            "sentimentSplit": {"positive": 0, "negative": 0, "neutral": 0},
            "avgRating": 0,
        }

    latest = sorted(weeks.keys())[-1]
    iso_keys, short = last_n_week_labels(latest, 5)
    vol = [weeks.get(k, 0) for k in iso_keys]
    total = sum(ratings.values())
    pos = sum(ratings[k] for k in ratings if k >= 4)
    neg = sum(ratings[k] for k in ratings if k <= 2)
    neu = ratings.get(3, 0)

    return {
        "reviewCount": total,
        "volumeLabels": short,
        "weeklyVolume": vol,
        "ratingDistribution": [ratings.get(i, 0) for i in range(1, 6)],
        "sentimentSplit": {
            "positive": round(100 * pos / total),
            "negative": round(100 * neg / total),
            "neutral": round(100 * neu / total),
        },
        "avgRating": round(sum(k * ratings[k] for k in ratings) / total, 2),
    }


def main() -> None:
    payload = {key: build(load_rows(path)) for key, path in SOURCES.items()}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
