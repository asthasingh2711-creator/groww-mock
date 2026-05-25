import { writeFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { buildAnalyticsForRows } from "@/lib/reviewAnalyticsCompute";
import { fetchAllPublicReviews } from "@/lib/reviewExtract";
import { setReviewAnalyticsCache } from "@/lib/reviewCache";

export const maxDuration = 60;

export async function POST() {
  try {
    const { app, play, combined } = await fetchAllPublicReviews();

    if (!combined.length) {
      return NextResponse.json(
        { error: "No reviews fetched from App Store or Play Store." },
        { status: 502 },
      );
    }

    const data = buildAnalyticsForRows(combined);
    setReviewAnalyticsCache(data);

    const jsonPath = path.join(process.cwd(), "src/data/review_analytics.json");
    try {
      writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
    } catch {
      /* read-only FS on serverless — in-memory cache is enough */
    }

    return NextResponse.json({
      ok: true,
      syncedAt: data.syncedAt,
      dataThrough: data.all?._anchor ?? null,
      counts: { appStore: app.length, playStore: play.length, total: combined.length },
      analytics: data,
      message: `Synced ${combined.length} public reviews (App Store ${app.length}, Play ${play.length}). Latest review: ${data.all?._anchor ?? "—"}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json(
      {
        error: message,
        hint: "Sync uses live App Store RSS + Play Store (or seed). No Python required.",
      },
      { status: 500 },
    );
  }
}
