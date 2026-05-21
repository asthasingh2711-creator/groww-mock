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
