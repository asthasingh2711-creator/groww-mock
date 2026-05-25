import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { setReviewAnalyticsCache } from "@/lib/reviewCache";
import type { ReviewAnalyticsFile } from "@/lib/reviewAnalyticsTypes";

const ROOT = process.cwd();

function run(cmd: string) {
  execSync(cmd, {
    cwd: ROOT,
    stdio: "pipe",
    timeout: 120_000,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
}

export async function POST() {
  const extract = path.join(ROOT, "scripts/extract_groww_reviews.py");
  const build = path.join(ROOT, "scripts/build_review_analytics.py");

  if (!existsSync(extract) || !existsSync(build)) {
    return NextResponse.json(
      { error: "Review sync scripts are missing on this server." },
      { status: 500 },
    );
  }

  try {
    run("python3 scripts/extract_groww_reviews.py");
    run("python3 scripts/build_review_analytics.py");

    const jsonPath = path.join(ROOT, "src/data/review_analytics.json");
    const data = JSON.parse(readFileSync(jsonPath, "utf-8")) as ReviewAnalyticsFile;
    setReviewAnalyticsCache(data);

    return NextResponse.json({
      ok: true,
      syncedAt: data.syncedAt ?? new Date().toISOString(),
      dataThrough: data.all?._anchor ?? null,
      message: "Fetched latest public App Store & Play reviews and rebuilt analytics.",
    });
  } catch (err) {
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr?: Buffer }).stderr ?? "")
        : "";
    const message =
      err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json(
      {
        error: message,
        detail: stderr.slice(0, 500) || undefined,
        hint: "Locally run: python3 scripts/extract_groww_reviews.py && python3 scripts/build_review_analytics.py",
      },
      { status: 500 },
    );
  }
}
