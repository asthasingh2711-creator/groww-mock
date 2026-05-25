import { readFileSync, existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getReviewAnalyticsFromData } from "@/lib/reviewAnalytics";
import { getReviewAnalyticsCache } from "@/lib/reviewCache";
import type { ReviewAnalyticsFile } from "@/lib/reviewAnalyticsTypes";

function loadAnalyticsFile(): ReviewAnalyticsFile {
  const cached = getReviewAnalyticsCache();
  if (cached) return cached;

  const jsonPath = path.join(process.cwd(), "src/data/review_analytics.json");
  if (!existsSync(jsonPath)) {
    throw new Error("review_analytics.json not found");
  }
  return JSON.parse(readFileSync(jsonPath, "utf-8")) as ReviewAnalyticsFile;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform") ?? "all";
  const range = searchParams.get("range") ?? "8-12w";

  try {
    const data = loadAnalyticsFile();
    const stats = getReviewAnalyticsFromData(data, platform, range);
    return NextResponse.json({
      syncedAt: data.syncedAt ?? null,
      dataThrough: stats.dataThrough,
      stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
