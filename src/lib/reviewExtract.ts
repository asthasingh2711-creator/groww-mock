import { readFileSync, existsSync } from "fs";
import path from "path";

export type RawReviewRow = {
  store: string;
  review_id: string;
  author: string;
  rating: string;
  title: string;
  content: string;
  app_version: string;
  date: string;
  helpful_votes: string;
};

const APP_STORE_ID = "1404871703";
const PLAY_APP_ID = "com.nextbillion.groww";

function label(obj: unknown): string {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj === "object" && obj !== null && "label" in obj) {
    return String((obj as { label?: string }).label ?? "");
  }
  return "";
}

export async function fetchAppStoreReviews(maxPages = 10): Promise<RawReviewRow[]> {
  const all: RawReviewRow[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://itunes.apple.com/in/rss/customerreviews/page=${page}/id=${APP_STORE_ID}/sortBy=mostRecent/json`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 0 },
      });
      if (!res.ok) break;
      const data = (await res.json()) as {
        feed?: { entry?: unknown };
      };
      let entries: unknown = data.feed?.entry;
      if (!entries) break;
      const entryList = Array.isArray(entries) ? entries : [entries];
      const rows: RawReviewRow[] = [];
      for (const e of entryList) {
        if (!e || typeof e !== "object" || !("im:rating" in e)) continue;
        const entry = e as Record<string, unknown>;
        rows.push({
          store: "app_store",
          review_id: label(entry.id),
          author: label((entry.author as Record<string, unknown>)?.name),
          rating: label(entry["im:rating"]),
          title: label(entry.title),
          content: label(entry.content),
          app_version: label(entry["im:version"]),
          date: label(entry.updated),
          helpful_votes: label(entry["im:voteSum"]) || "0",
        });
      }
      if (!rows.length) break;
      all.push(...rows);
    } catch {
      break;
    }
  }
  return all;
}

export async function fetchPlayStoreReviews(count = 200): Promise<RawReviewRow[]> {
  try {
    const gplay = await import("google-play-scraper");
    const sortNewest = gplay.sort.NEWEST;
    const all: RawReviewRow[] = [];
    let token: string | undefined;
    while (all.length < count) {
      const batch = await gplay.reviews({
        appId: PLAY_APP_ID,
        lang: "en",
        country: "in",
        sort: sortNewest,
        num: Math.min(200, count - all.length),
        paginate: true,
        nextPaginationToken: token,
      });
      const list = batch.data ?? [];
      for (const r of list) {
        all.push({
          store: "play_store",
          review_id: String(r.id ?? ""),
          author: String(r.userName ?? ""),
          rating: String(r.score ?? ""),
          title: String(r.title ?? ""),
          content: String(r.text ?? ""),
          app_version: String(r.version ?? ""),
          date: r.date ? new Date(r.date).toISOString() : "",
          helpful_votes: String(r.thumbsUp ?? 0),
        });
      }
      token = batch.nextPaginationToken ?? undefined;
      if (!token || !list.length) break;
    }
    return all.slice(0, count);
  } catch {
    return loadPlaySeed();
  }
}

export function loadPlaySeed(): RawReviewRow[] {
  const seedPath = path.join(process.cwd(), "src/data/play_reviews_seed.json");
  if (!existsSync(seedPath)) return [];
  return JSON.parse(readFileSync(seedPath, "utf-8")) as RawReviewRow[];
}

export async function fetchAllPublicReviews(): Promise<{
  app: RawReviewRow[];
  play: RawReviewRow[];
  combined: RawReviewRow[];
}> {
  const [app, play] = await Promise.all([
    fetchAppStoreReviews(10),
    fetchPlayStoreReviews(200),
  ]);
  return { app, play, combined: [...app, ...play] };
}
