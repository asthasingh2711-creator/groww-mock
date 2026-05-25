import staticAnalytics from "@/data/review_analytics.json";
import type { ReviewAnalyticsSlice } from "@/lib/reviewAnalyticsTypes";

export type {
  ReviewPlatform,
  TimeRange,
  ReviewAnalyticsSlice,
  ReviewAnalyticsFile,
} from "@/lib/reviewAnalyticsTypes";

export {
  sentimentFromDistribution,
  storeLabel,
} from "@/lib/reviewAnalyticsTypes";

import type { ReviewAnalyticsFile, ReviewPlatform, TimeRange } from "@/lib/reviewAnalyticsTypes";
import { sentimentFromDistribution } from "@/lib/reviewAnalyticsTypes";

const RANGES: TimeRange[] = ["today", "7d", "30d", "8-12w"];

const FALLBACK = staticAnalytics as ReviewAnalyticsFile;

export function getReviewAnalyticsFromData(
  data: ReviewAnalyticsFile,
  platform: string,
  range: string = "8-12w",
): ReviewAnalyticsSlice {
  const platforms: ReviewPlatform[] = ["all", "ios", "android"];
  const p = platforms.includes(platform as ReviewPlatform)
    ? (platform as ReviewPlatform)
    : "all";
  const r = (RANGES.includes(range as TimeRange) ? range : "8-12w") as TimeRange;
  const platformData = data[p];
  if (!platformData || typeof platformData !== "object") {
    return enrichSlice(FALLBACK.all["8-12w"]);
  }
  const slice = platformData[r] ?? FALLBACK.all["8-12w"];
  return enrichSlice(slice);
}

function enrichSlice(slice: ReviewAnalyticsSlice): ReviewAnalyticsSlice {
  const split = sentimentFromDistribution(slice.ratingDistribution);
  return {
    ...slice,
    keywordHits: slice.keywordHits ?? [],
    sentimentSplit: split,
    sentimentScore: split.positive,
  };
}

/** Client fallback when API unavailable (build-time JSON). */
export function getReviewAnalytics(
  platform: string,
  range: string = "8-12w",
): ReviewAnalyticsSlice {
  return getReviewAnalyticsFromData(FALLBACK, platform, range);
}
