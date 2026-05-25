import type {
  KeywordHit,
  ReviewAnalyticsFile,
  ReviewAnalyticsSlice,
  ReviewPlatform,
  ReviewRadarItem,
  ReviewThemeCard,
  ReviewUserVoice,
  TimeRange,
} from "@/lib/reviewAnalyticsTypes";
import type { RawReviewRow } from "@/lib/reviewExtract";

export type ParsedReview = {
  rating: number;
  date: Date;
  week: string;
  text: string;
  content: string;
  store: string;
};

const STOPWORDS = new Set([
  "that", "this", "with", "from", "have", "your", "very", "been", "they",
  "what", "when", "will", "also", "just", "like", "about", "more", "than",
  "into", "only", "good", "best", "groww", "grow", "application", "using",
]);

const THEME_DEFS: [string, string, string[]][] = [
  ["brokerage", "High Brokerage Charges", ["brokerage", "charge", "charges", "fees", "commission"]],
  ["support", "Poor Customer Support", ["support", "customer", "response", "helpline", "call"]],
  ["withdrawal", "Withdrawal Issues", ["withdrawal", "withdraw", "payout", "money", "transfer"]],
  ["glitches", "Technical Glitches", ["crash", "glitch", "bug", "freeze", "slow", "hang"]],
  ["orders", "Order Execution Problems", ["order", "execution", "sell", "fno", "options", "market"]],
];

const STORE_LABEL: Record<string, string> = {
  app_store: "App Store",
  play_store: "Play Store",
};

const RANGES: { id: TimeRange; days: number | null; label: string }[] = [
  { id: "today", days: 1, label: "Today" },
  { id: "7d", days: 7, label: "7 Days" },
  { id: "30d", days: 30, label: "30 Days" },
  { id: "8-12w", days: null, label: "8-12 Weeks" },
];

function parseRow(r: RawReviewRow): ParsedReview | null {
  const rating = parseInt(r.rating, 10);
  if (Number.isNaN(rating)) return null;
  const date = new Date(r.date);
  if (Number.isNaN(date.getTime())) return null;
  const text = `${r.title || ""} ${r.content || ""}`.toLowerCase();
  return {
    rating,
    date,
    week: isoWeek(date),
    text,
    content: (r.content || r.title || "").trim(),
    store: r.store,
  };
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function pctChange(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? Math.round(curr * 1000) / 10 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function filterByRange(parsed: ParsedReview[], rangeId: TimeRange, anchor: Date): ParsedReview[] {
  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (rangeId === "today") {
    return parsed.filter(
      (r) =>
        r.date.getFullYear() === a.getFullYear() &&
        r.date.getMonth() === a.getMonth() &&
        r.date.getDate() === a.getDate(),
    );
  }
  if (rangeId === "7d") {
    const start = addDays(a, -6);
    return parsed.filter((r) => {
      const rd = new Date(r.date.getFullYear(), r.date.getMonth(), r.date.getDate());
      return rd >= start && rd <= a;
    });
  }
  if (rangeId === "30d") {
    const start = addDays(a, -29);
    return parsed.filter((r) => {
      const rd = new Date(r.date.getFullYear(), r.date.getMonth(), r.date.getDate());
      return rd >= start && rd <= a;
    });
  }
  const start = addDays(a, -83);
  return parsed.filter((r) => {
    const rd = new Date(r.date.getFullYear(), r.date.getMonth(), r.date.getDate());
    return rd >= start && rd <= a;
  });
}

function buildVolumeSeries(
  parsed: ParsedReview[],
  rangeId: TimeRange,
  anchor: Date,
): [string[], number[], "daily" | "weekly", string] {
  if (!parsed.length) return [[], [], "daily", "No reviews in selected window"];

  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const dayCounts = new Map<string, number>();
  for (const r of parsed) {
    const k = dateOnly(r.date);
    dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
  }

  if (rangeId === "today") {
    const label = a.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return [[label], [parsed.length], "daily", `Reviews on latest day · ${label}`];
  }

  if (rangeId === "7d") {
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(a, -i);
      const k = dateOnly(d);
      labels.push(d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }));
      values.push(dayCounts.get(k) ?? 0);
    }
    return [labels, values, "daily", "Daily volume · last 7 calendar days"];
  }

  if (rangeId === "30d") {
    const labels: string[] = [];
    const values: number[] = [];
    const bucketDays = 5;
    const rangeStart = addDays(a, -29);
    const numBuckets = Math.ceil(30 / bucketDays);
    for (let b = 0; b < numBuckets; b++) {
      const bucketStart = addDays(rangeStart, b * bucketDays);
      const bucketEnd = addDays(rangeStart, Math.min(b * bucketDays + bucketDays - 1, 29));
      let sum = 0;
      for (let d = new Date(bucketStart); d <= bucketEnd; d = addDays(d, 1)) {
        sum += dayCounts.get(dateOnly(d)) ?? 0;
      }
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      labels.push(
        bucketStart.getTime() === bucketEnd.getTime()
          ? fmt(bucketStart)
          : `${fmt(bucketStart)} – ${fmt(bucketEnd)}`,
      );
      values.push(sum);
    }
    return [labels, values, "daily", "Volume in 5-day buckets · last 30 calendar days"];
  }

  const weekCounts = new Map<string, number>();
  for (const r of parsed) weekCounts.set(r.week, (weekCounts.get(r.week) ?? 0) + 1);
  const weekKeys = [...weekCounts.keys()].sort().slice(-12);
  const labels = weekKeys.map((w) => `W${w.split("-W")[1]}`);
  const values = weekKeys.map((w) => weekCounts.get(w) ?? 0);
  const start = addDays(a, -83);
  return [
    labels,
    values,
    "weekly",
    `Weekly volume · ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${a.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
  ];
}

function orderedDays(parsed: ParsedReview[], rangeId: TimeRange, anchor: Date): string[] {
  const a = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (rangeId === "today") return [dateOnly(a)];
  if (rangeId === "7d") {
    return Array.from({ length: 7 }, (_, i) => dateOnly(addDays(a, i - 6)));
  }
  if (rangeId === "30d") {
    return Array.from({ length: 30 }, (_, i) => dateOnly(addDays(a, i - 29)));
  }
  return [...new Set(parsed.map((r) => dateOnly(r.date)))].sort();
}

function matchThemes(text: string): string[] {
  const hits: string[] = [];
  for (const [tid, , keys] of THEME_DEFS) {
    if (keys.some((k) => text.includes(k))) hits.push(tid);
  }
  return hits;
}

function emptySlice(): ReviewAnalyticsSlice {
  return {
    weekCode: "2026-W20",
    weekLabel: "Week 20, 2026",
    period: "—",
    reviewCount: 0,
    wordCount: 0,
    wordLimit: 250,
    avgRating: 0,
    avgRatingDelta: 0,
    sentimentScore: 0,
    sentimentDelta: 0,
    wowReviewDelta: 0,
    weeklyVolume: [],
    volumeLabels: [],
    volumeGranularity: "daily",
    volumeSubtitle: "No reviews in selected window",
    ratingDistribution: [0, 0, 0, 0, 0],
    sentimentSplit: { positive: 0, negative: 0, neutral: 0 },
    trendAlert: "No reviews in export",
    keywords: [],
    keywordHits: [],
    themeCards: [],
    pmRadar: { highImpact: [], highFrequency: [], monitor: [] },
    userVoices: [],
    weeklyNote: { summary: "", themes: [], tracking: "", quotes: [], actions: [] },
    emailDraft: { to: "team@groww.in", subject: "Groww Weekly Review Pulse", body: "" },
    executiveSummary: "",
    dataThrough: "",
  };
}

function buildSlice(
  parsed: ParsedReview[],
  rangeLabel: string,
  rangeId: TimeRange,
  anchor: Date,
  dataThrough: string,
): ReviewAnalyticsSlice {
  if (!parsed.length) return emptySlice();

  const ratings = [0, 0, 0, 0, 0];
  for (const r of parsed) if (r.rating >= 1 && r.rating <= 5) ratings[r.rating - 1]++;

  const weeks = new Map<string, number>();
  for (const r of parsed) weeks.set(r.week, (weeks.get(r.week) ?? 0) + 1);
  const weekKeys = [...weeks.keys()].sort();
  const latestWeek = weekKeys[weekKeys.length - 1] ?? "2026-W20";
  const [y, w] = latestWeek.split("-W").map(Number);

  const [volumeLabels, volumeValues, volumeGranularity, volumeSubtitle] =
    buildVolumeSeries(parsed, rangeId, anchor);
  const chartDayKeys = orderedDays(parsed, rangeId, anchor);

  const total = parsed.length;
  const pos = parsed.filter((r) => r.rating >= 4).length;
  const neg = parsed.filter((r) => r.rating <= 2).length;
  const neu = parsed.filter((r) => r.rating === 3).length;
  const avgRating = Math.round((parsed.reduce((s, r) => s + r.rating, 0) / total) * 100) / 100;

  const prevWeek = weekKeys[weekKeys.length - 2] ?? latestWeek;
  const lastRows = parsed.filter((r) => r.week === latestWeek);
  const prevRows = parsed.filter((r) => r.week === prevWeek);
  const posPct = (rs: ParsedReview[]) =>
    rs.length ? (100 * rs.filter((r) => r.rating >= 4).length) / rs.length : 0;
  const avgFor = (rs: ParsedReview[]) =>
    rs.length
      ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 100) / 100
      : avgRating;

  const sentimentScore = Math.round((100 * pos) / total);
  const sentimentDelta = Math.round((posPct(lastRows) - posPct(prevRows)) * 10) / 10;
  const avgRatingDelta = Math.round((avgFor(lastRows) - avgFor(prevRows)) * 100) / 100;
  const wowReviewDelta =
    volumeValues.length >= 2
      ? pctChange(volumeValues[volumeValues.length - 1], volumeValues[volumeValues.length - 2])
      : pctChange(weeks.get(latestWeek) ?? 0, weeks.get(prevWeek) ?? 0);

  const themeWeekCounts = new Map<string, Map<string, number>>();
  const themeReviews = new Map<string, ParsedReview[]>();
  for (const [tid] of THEME_DEFS) {
    themeWeekCounts.set(tid, new Map());
    themeReviews.set(tid, []);
  }
  for (const row of parsed) {
    for (const tid of matchThemes(row.text)) {
      themeReviews.get(tid)!.push(row);
      const wm = themeWeekCounts.get(tid)!;
      wm.set(row.week, (wm.get(row.week) ?? 0) + 1);
    }
  }

  const themeStats: {
    id: string;
    title: string;
    count: number;
    pct: number;
    lowPct: number;
    wowDelta: number;
    sparkline: number[];
    reviews: number;
    priority: "High" | "Critical";
    description: string;
  }[] = [];

  for (const [tid, title] of THEME_DEFS.map((t) => [t[0], t[1]] as const)) {
    const matched = themeReviews.get(tid) ?? [];
    const count = matched.length;
    if (!count) continue;
    const low = matched.filter((r) => r.rating <= 2).length;
    const tw = themeWeekCounts.get(tid)!;
    const spark = chartDayKeys.map((dk) => {
      let c = 0;
      for (const r of matched) if (dateOnly(r.date) === dk) c++;
      return c;
    });
    themeStats.push({
      id: tid,
      title,
      count,
      pct: Math.round((100 * count) / total),
      lowPct: Math.round((100 * low) / count),
      wowDelta: Math.max(
        0,
        Math.round(
          pctChange(tw.get(latestWeek) ?? 0, tw.get(prevWeek) ?? 0),
        ),
      ),
      sparkline: spark,
      reviews: count,
      priority: low / count > 0.5 ? "Critical" : "High",
      description: describeTheme(tid, count, low, total),
    });
  }
  themeStats.sort((a, b) => b.count - a.count);
  const themeCards: ReviewThemeCard[] = themeStats.slice(0, 5);

  const topTheme = themeStats.reduce(
    (best, t) => (t.wowDelta > (best?.wowDelta ?? 0) ? t : best),
    null as (typeof themeStats)[0] | null,
  );
  let trendAlert: string;
  if (topTheme && topTheme.wowDelta >= 10) {
    trendAlert = `${topTheme.title} mentions up +${topTheme.wowDelta}% week-over-week`;
  } else if (wowReviewDelta >= 15) {
    trendAlert = `Review volume up +${wowReviewDelta}% in the latest period`;
  } else {
    trendAlert = `Negative reviews at ${Math.round((100 * neg) / total)}% of ${total} public store samples`;
  }

  const keywords = extractKeywords(parsed);
  const keywordHits = buildKeywordHits(parsed, keywords);
  const userVoices = pickQuotes(parsed);
  const pmRadar = buildPmRadar(themeStats);
  const weeklyNote = buildWeeklyNote(themeCards, userVoices, avgRating, sentimentScore, total);

  const periodEnd = dateOnly(
    parsed.reduce((m, r) => (r.date > m ? r.date : m), parsed[0].date),
  );
  const periodStart = dateOnly(
    parsed.reduce((m, r) => (r.date < m ? r.date : m), parsed[0].date),
  );
  let period = `${periodStart} → ${periodEnd}`;
  if (rangeLabel) period += ` · ${rangeLabel}`;
  if (dataThrough) period += ` · through ${dataThrough}`;

  return {
    weekCode: `${y}-W${w}`,
    weekLabel: `Week ${w}, ${y}`,
    period,
    reviewCount: total,
    wordCount: weeklyNote.summary.split(/\s+/).length,
    wordLimit: 250,
    avgRating,
    avgRatingDelta,
    sentimentScore,
    sentimentDelta,
    wowReviewDelta,
    weeklyVolume: volumeValues,
    volumeLabels,
    volumeGranularity,
    volumeSubtitle,
    ratingDistribution: ratings,
    sentimentSplit: {
      positive: Math.round((100 * pos) / total),
      negative: Math.round((100 * neg) / total),
      neutral: Math.round((100 * neu) / total),
    },
    trendAlert,
    keywords,
    keywordHits,
    themeCards,
    pmRadar,
    userVoices,
    weeklyNote,
    emailDraft: {
      to: "team@groww.in",
      subject: "Groww Weekly Review Pulse",
      body: buildEmailBody(`${y}-W${w}`, themeCards, userVoices, avgRating, total),
    },
    executiveSummary: `Analysis of ${total} public App Store & Play reviews (${periodStart} → ${periodEnd}): average ${avgRating}★ with ${sentimentScore}% positive sentiment. Top friction: ${themeCards
      .slice(0, 3)
      .map((t) => t.title)
      .join(", ")}.`,
    dataThrough: dataThrough || periodEnd,
  };
}

function describeTheme(tid: string, count: number, low: number, total: number): string {
  const pct = Math.round((100 * count) / total);
  const lowPct = Math.round((100 * low) / count);
  const t: Record<string, string> = {
    brokerage: `Mentioned in ${pct}% of sample reviews; ${lowPct}% are 1–2★ charge complaints.`,
    support: `Support friction in ${count} reviews (${lowPct}% low-rated).`,
    withdrawal: `Payout / withdrawal language in ${count} reviews — trust-sensitive.`,
    glitches: `Stability issues cited in ${count} reviews during peak usage.`,
    orders: `Order flow complaints in ${count} reviews across F&O and cash segments.`,
  };
  return t[tid] ?? `Clustered theme across ${count} reviews.`;
}

function extractKeywords(parsed: ParsedReview[], limit = 12): string[] {
  const words = new Map<string, number>();
  for (const row of parsed) {
    const matches = row.text.match(/[a-z]{4,}/g) ?? [];
    for (const w of matches) {
      if (!STOPWORDS.has(w)) words.set(w, (words.get(w) ?? 0) + 1);
    }
  }
  return [...words.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

function buildKeywordHits(parsed: ParsedReview[], keywords: string[]): KeywordHit[] {
  return keywords.map((kw) => {
    const matching = parsed.filter((r) => r.text.includes(kw));
    const candidates = [...matching].sort(
      (a, b) =>
        (a.rating > 2 ? 1 : 0) - (b.rating > 2 ? 1 : 0) ||
        b.date.getTime() - a.date.getTime(),
    );
    const reviews: ReviewUserVoice[] = [];
    for (const row of candidates) {
      if (reviews.length >= 5) break;
      const quote = row.content.slice(0, 240).trim();
      if (quote.length < 10) continue;
      reviews.push({
        quote,
        source: STORE_LABEL[row.store] ?? "Store",
        stars: row.rating,
      });
    }
    return { keyword: kw, count: matching.length, reviews };
  });
}

function pickQuotes(parsed: ParsedReview[]): ReviewUserVoice[] {
  const low = [...parsed.filter((r) => r.rating <= 2)].sort(
    (a, b) => b.content.length - a.content.length,
  );
  const high = [...parsed.filter((r) => r.rating >= 4)].sort(
    (a, b) => b.content.length - a.content.length,
  );
  const picks: ReviewUserVoice[] = [];
  for (const bucket of [low, high]) {
    for (const row of bucket) {
      if (picks.length >= 6) break;
      const quote = row.content.slice(0, 160).trim();
      if (quote.length < 12) continue;
      picks.push({
        quote,
        source: STORE_LABEL[row.store] ?? "Store",
        stars: row.rating,
      });
    }
  }
  return picks.slice(0, 6);
}

function buildPmRadar(
  themeStats: { id: string; title: string; count: number; lowPct: number; description: string }[],
): ReviewAnalyticsSlice["pmRadar"] {
  const icons: Record<string, string> = {
    withdrawal: "🔥",
    support: "📞",
    brokerage: "💰",
    glitches: "⚡",
    orders: "📉",
  };
  const item = (
    t: (typeof themeStats)[0],
    severity: "critical" | "warn",
  ): ReviewRadarItem => ({
    title: t.title,
    count: t.count,
    icon: icons[t.id] ?? "⚠",
    severity,
    description: t.description,
  });
  const byLow = [...themeStats].sort((a, b) => b.lowPct - a.lowPct);
  const byVol = [...themeStats].sort((a, b) => b.count - a.count);
  return {
    highImpact: byLow.slice(0, 2).map((t) => item(t, t.lowPct >= 55 ? "critical" : "warn")),
    highFrequency: byVol.slice(0, 2).map((t) => item(t, "warn")),
    monitor: themeStats.slice(2, 4).map((t) => item(t, "warn")),
  };
}

function buildWeeklyNote(
  themes: ReviewThemeCard[],
  voices: ReviewUserVoice[],
  avgRating: number,
  sentiment: number,
  total: number,
): ReviewAnalyticsSlice["weeklyNote"] {
  const top3 = themes.slice(0, 3);
  return {
    summary: `Weekly pulse from ${total} extracted public reviews: ${avgRating}★ average, ${sentiment}% positive sentiment.${top3[0] ? ` ${top3[0].title} leads negative mentions.` : ""}`,
    themes: top3.map(
      (t) =>
        `${t.title} — ${t.pct}% of corpus (${t.reviews} reviews, ↑${t.wowDelta}% WoW)`,
    ),
    tracking: "WoW deltas computed from review dates in App Store & Play exports.",
    quotes: voices.slice(0, 3).map((v) => `• ${v.quote}`),
    actions: top3.length
      ? [
          `Address ${top3[0].title.toLowerCase()} with a product + comms fix this sprint`,
          "Publish fee / withdrawal SLAs in-app before money movement",
          "Route 1–2★ tickets to expedited support within 24h",
        ]
      : ["Continue monitoring public review velocity"],
  };
}

function buildEmailBody(
  weekCode: string,
  themes: ReviewThemeCard[],
  voices: ReviewUserVoice[],
  avgRating: number,
  total: number,
): string {
  const lines = [
    `Groww public review pulse (${weekCode}): ${total} reviews, ${avgRating}★ average.`,
    "",
    "TOP THEMES:",
    ...themes.slice(0, 3).map(
      (t, i) => `${i + 1}. ${t.title} — ${t.pct}% of sample (↑${t.wowDelta}% WoW)`,
    ),
    "",
    "USER QUOTES:",
    ...voices.slice(0, 3).map((v) => v.quote.slice(0, 100)),
    "",
    "ACTION IDEAS:",
    "1. Clarify fees before order confirm",
    "2. Withdrawal status + SLA in app",
    "3. Escalate payout-related support tickets",
  ];
  return lines.join("\n");
}

export function buildAnalyticsForRows(rows: RawReviewRow[]): ReviewAnalyticsFile {
  const parsed = rows.map(parseRow).filter((r): r is ParsedReview => r !== null);
  const syncedAt = new Date().toISOString();
  const file = { syncedAt } as ReviewAnalyticsFile;

  const platforms: { key: ReviewPlatform; rows: RawReviewRow[] }[] = [
    { key: "all", rows },
    { key: "ios", rows: rows.filter((r) => r.store === "app_store") },
    { key: "android", rows: rows.filter((r) => r.store === "play_store") },
  ];

  for (const { key, rows: platformRows } of platforms) {
    const parsedPlatform = platformRows
      .map(parseRow)
      .filter((r): r is ParsedReview => r !== null);
    const anchor =
      parsedPlatform.length > 0
        ? parsedPlatform.reduce((m, r) => (r.date > m.date ? r : m), parsedPlatform[0])
            .date
        : new Date();
    const dataThrough = dateOnly(anchor);
    const platformData = { _anchor: dataThrough } as ReviewAnalyticsFile[ReviewPlatform] & {
      _anchor?: string;
    };
    for (const { id, label } of RANGES) {
      const subset = filterByRange(parsedPlatform, id, anchor);
      platformData[id] = buildSlice(subset, label, id, anchor, dataThrough);
    }
    file[key] = platformData as ReviewAnalyticsFile[ReviewPlatform];
  }

  return file;
}
