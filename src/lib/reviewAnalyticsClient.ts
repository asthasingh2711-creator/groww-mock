import type { ReviewAnalyticsFile, ReviewAnalyticsSlice } from "@/lib/reviewAnalyticsTypes";
import { getReviewAnalyticsFromData } from "@/lib/reviewAnalytics";

const STORAGE_KEY = "growwReviewAnalytics";

export function saveAnalyticsToSession(data: ReviewAnalyticsFile): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function loadAnalyticsFromSession(): ReviewAnalyticsFile | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReviewAnalyticsFile;
  } catch {
    return null;
  }
}

export function getStatsFromFile(
  file: ReviewAnalyticsFile,
  platform: string,
  range: string,
): ReviewAnalyticsSlice {
  return getReviewAnalyticsFromData(file, platform, range);
}

export function formatSyncTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
