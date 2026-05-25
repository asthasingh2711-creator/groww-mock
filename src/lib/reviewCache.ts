import type { ReviewAnalyticsFile } from "@/lib/reviewAnalyticsTypes";

let liveCache: ReviewAnalyticsFile | null = null;

export function setReviewAnalyticsCache(data: ReviewAnalyticsFile) {
  liveCache = data;
}

export function getReviewAnalyticsCache(): ReviewAnalyticsFile | null {
  return liveCache;
}

export function clearReviewAnalyticsCache() {
  liveCache = null;
}
