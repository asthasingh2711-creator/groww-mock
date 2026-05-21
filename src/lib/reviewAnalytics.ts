import analytics from "@/data/review_analytics.json";

export type ReviewPlatform = "all" | "android" | "ios";

export type ReviewAnalyticsSlice = {
  reviewCount: number;
  volumeLabels: string[];
  weeklyVolume: number[];
  ratingDistribution: number[];
  sentimentSplit: { positive: number; negative: number; neutral: number };
  avgRating: number;
};

const DATA = analytics as Record<ReviewPlatform, ReviewAnalyticsSlice>;

export function getReviewAnalytics(platform: string): ReviewAnalyticsSlice {
  const key = platform as ReviewPlatform;
  return DATA[key] ?? DATA.all;
}
