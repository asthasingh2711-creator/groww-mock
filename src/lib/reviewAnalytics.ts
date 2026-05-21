import analytics from "@/data/review_analytics.json";

export type ReviewPlatform = "all" | "android" | "ios";

export type ReviewThemeCard = {
  id: string;
  title: string;
  pct: number;
  description: string;
  reviews: number;
  priority: "High" | "Critical";
  lowPct: number;
  wowDelta: number;
  sparkline: number[];
};

export type ReviewRadarItem = {
  title: string;
  count: number;
  icon: string;
  severity: "critical" | "warn";
  description: string;
};

export type ReviewUserVoice = {
  quote: string;
  source: string;
  stars: number;
};

export type ReviewAnalyticsSlice = {
  weekCode: string;
  weekLabel: string;
  period: string;
  reviewCount: number;
  wordCount: number;
  wordLimit: number;
  avgRating: number;
  avgRatingDelta: number;
  sentimentScore: number;
  sentimentDelta: number;
  wowReviewDelta: number;
  volumeLabels: string[];
  weeklyVolume: number[];
  ratingDistribution: number[];
  sentimentSplit: { positive: number; negative: number; neutral: number };
  trendAlert: string;
  keywords: string[];
  themeCards: ReviewThemeCard[];
  pmRadar: {
    highImpact: ReviewRadarItem[];
    highFrequency: ReviewRadarItem[];
    monitor: ReviewRadarItem[];
  };
  userVoices: ReviewUserVoice[];
  weeklyNote: {
    summary: string;
    themes: string[];
    tracking: string;
    quotes: string[];
    actions: string[];
  };
  emailDraft: { to: string; subject: string; body: string };
  executiveSummary: string;
};

const DATA = analytics as Record<ReviewPlatform, ReviewAnalyticsSlice>;

export function getReviewAnalytics(platform: string): ReviewAnalyticsSlice {
  const key = platform as ReviewPlatform;
  return DATA[key] ?? DATA.all;
}

export function storeLabel(platform: ReviewPlatform | string): string {
  if (platform === "ios") return "App Store";
  if (platform === "android") return "Play Store";
  return "App Store + Play Store";
}

function scaleCount(n: number, scale: number): number {
  return Math.max(0, Math.round(n * scale));
}

function replaceFirstCount(text: string, from: number, to: number): string {
  if (from === to) return text;
  const re = new RegExp(`\\b${from}\\b`);
  return re.test(text) ? text.replace(re, String(to)) : text;
}

/** Apply time-range filter consistently across tabs and exports. */
export function applyTimeRangeScale(
  stats: ReviewAnalyticsSlice,
  scale: number,
  rangeLabel?: string,
): ReviewAnalyticsSlice {
  if (scale >= 0.999) return stats;

  const reviewCount = scaleCount(stats.reviewCount, scale);
  const windowNote = rangeLabel ? ` · ${rangeLabel} window` : "";

  const themeCards = stats.themeCards.map((t) => {
    const reviews = scaleCount(t.reviews, scale);
    return {
      ...t,
      reviews,
      sparkline: t.sparkline.map((v) => scaleCount(v, scale)),
      pct: reviewCount > 0 ? Math.round((reviews / reviewCount) * 100) : t.pct,
    };
  });

  const scaleRadar = (items: ReviewRadarItem[]) =>
    items.map((i) => ({ ...i, count: scaleCount(i.count, scale) }));

  const weeklyNote = {
    ...stats.weeklyNote,
    summary: `${replaceFirstCount(stats.weeklyNote.summary, stats.reviewCount, reviewCount)}${windowNote}`,
    themes: stats.weeklyNote.themes.map((line) =>
      line.replace(/\((\d+) reviews/g, (_, n) =>
        `(${scaleCount(parseInt(n, 10), scale)} reviews`,
      ),
    ),
    tracking: `${stats.weeklyNote.tracking}${windowNote}`,
  };

  const emailBody = stats.emailDraft.body.replace(
    /^Groww public review pulse \([^)]+\): \d+ reviews/,
    `Groww public review pulse (${stats.weekCode}): ${reviewCount} reviews${windowNote}`,
  );

  const voiceLimit = Math.max(1, Math.ceil(stats.userVoices.length * scale));

  return {
    ...stats,
    reviewCount,
    weeklyVolume: stats.weeklyVolume.map((v) => scaleCount(v, scale)),
    ratingDistribution: stats.ratingDistribution.map((c) => scaleCount(c, scale)),
    themeCards,
    pmRadar: {
      highImpact: scaleRadar(stats.pmRadar.highImpact),
      highFrequency: scaleRadar(stats.pmRadar.highFrequency),
      monitor: scaleRadar(stats.pmRadar.monitor),
    },
    userVoices: stats.userVoices.slice(0, voiceLimit),
    weeklyNote,
    executiveSummary: `${replaceFirstCount(stats.executiveSummary, stats.reviewCount, reviewCount)}${windowNote}`,
    emailDraft: { ...stats.emailDraft, body: emailBody },
    period: `${stats.period}${windowNote}`,
  };
}
