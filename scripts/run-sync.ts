/**
 * Fetch latest public reviews and rebuild review_analytics.json.
 * Run: npx tsx scripts/run-sync.ts
 */
import { writeFileSync } from "fs";
import path from "path";
import { buildAnalyticsForRows } from "../src/lib/reviewAnalyticsCompute";
import { fetchAllPublicReviews } from "../src/lib/reviewExtract";

async function main() {
  const { app, play, combined } = await fetchAllPublicReviews();
  console.log(`Fetched App Store: ${app.length}, Play: ${play.length}`);
  const data = buildAnalyticsForRows(combined);
  const out = path.join(process.cwd(), "src/data/review_analytics.json");
  writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${out}`);
  console.log(`Data through: ${data.all?._anchor}`);
  console.log(`Synced at: ${data.syncedAt}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
