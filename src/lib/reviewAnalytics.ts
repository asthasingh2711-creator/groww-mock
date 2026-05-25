import analytics from "@/data/review_analytics.json";

export type ReviewPlatform = "all" | "android" | "ios";
export type TimeRange = "today" | "7d" | "30d" | "8-12w";

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
  volumeGranularity: "daily" | "weekly";
  volumeSubtitle: string;
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

type PlatformAnalytics = Record<TimeRange, ReviewAnalyticsSlice>;

const DATA = analytics as Record<ReviewPlatform, PlatformAnalytics>;

const RANGES: TimeRange[] = ["today", "7d", "30d", "8-12w"];

export function sentimentFromDistribution(
  dist: number[],
): { positive: number; negative: number; neutral: number } {
  const [one = 0, two = 0, three = 0, four = 0, five = 0] = dist;
  const total = one + two + three + four + five;
  if (total === 0) return { positive: 0, negative: 0, neutral: 0 };
  const pos = four + five;
  const neg = one + two;
  const neu = three;
  return {
    positive: Math.round((100 * pos) / total),
    negative: Math.round((100 * neg) / total),
    neutral: Math.round((100 * neu) / total),
  };
}

export function getReviewAnalytics(
  platform: string,
  range: string = "8-12w",
): ReviewAnalyticsSlice {
  const p = (platform in DATA ? platform : "all") as ReviewPlatform;
  const r = (RANGES.includes(range as TimeRange) ? range : "8-12w") as TimeRange;
  const slice = DATA[p]?.[r] ?? DATA.all["8-12w"];
  const split = sentimentFromDistribution(slice.ratingDistribution);
  return {
    ...slice,
    sentimentSplit: split,
    sentimentScore: split.positive,
  };
}

export function storeLabel(platform: ReviewPlatform | string): string {
  if (platform === "ios") return "App Store";
  if (platform === "android") return "Play Store";
  return "App Store + Play Store";
}
