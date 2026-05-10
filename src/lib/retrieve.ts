import type { KbChunk } from "./mfTypes";

/** Higher = prefer for citation (SBI + PDFs first, then AMFI/SEBI). */
export function urlPriority(url: string): number {
  const u = url.toLowerCase();
  if (u.includes("sbimf.com")) {
    if (u.includes(".pdf")) return 4;
    return 3;
  }
  if (u.includes("amfiindia.com")) return 2;
  if (u.includes("sebi.gov.in")) return 2;
  return 0;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9%+]+/i)
    .filter((t) => t.length > 1);
}

function scoreOverlap(queryTokens: string[], docTokens: string[]): number {
  const docSet = new Set(docTokens);
  let score = 0;
  for (const t of queryTokens) {
    if (docSet.has(t)) score += 1;
  }
  return score;
}

export function prioritizeChunks(chunks: KbChunk[]): KbChunk[] {
  return [...chunks].sort((a, b) => urlPriority(b.url) - urlPriority(a.url));
}

export function retrieveChunks(
  query: string,
  chunks: KbChunk[],
  topK = 5,
): KbChunk[] {
  const qTokens = tokenize(query);
  const scored = chunks.map((chunk) => {
    const docTokens = tokenize(
      `${chunk.text} ${chunk.tags.join(" ")} ${chunk.scheme} ${chunk.doc_type}`,
    );
    return {
      chunk,
      textScore: scoreOverlap(qTokens, docTokens),
      priority: urlPriority(chunk.url),
    };
  });

  scored.sort((a, b) => {
    if (b.textScore !== a.textScore) return b.textScore - a.textScore;
    return b.priority - a.priority;
  });

  const positive = scored.filter((s) => s.textScore > 0);
  const pick = positive.length > 0 ? positive : scored;
  return pick.slice(0, topK).map((s) => s.chunk);
}

/**
 * Render structured facts as a single-line `Facts:` summary so the LLM can
 * see verified scalars (lock-in, benchmark, exit load, etc.) without having
 * to re-extract them from prose. Skips empty chunks.
 */
function formatFactsLine(chunk: KbChunk): string | null {
  const f = chunk.facts;
  if (!f) return null;
  const pairs: string[] = [];
  if (f.scheme_code) pairs.push(`scheme_code=${f.scheme_code}`);
  if (f.category) pairs.push(`category=${f.category}`);
  if (f.benchmark) pairs.push(`benchmark=${f.benchmark}`);
  if (f.asset_allocation) pairs.push(`asset_allocation=${f.asset_allocation}`);
  if (typeof f.lock_in_years === "number")
    pairs.push(`lock_in_years=${f.lock_in_years}`);
  if (typeof f.min_sip_inr === "number") pairs.push(`min_sip_inr=${f.min_sip_inr}`);
  if (typeof f.min_lumpsum_inr === "number")
    pairs.push(`min_lumpsum_inr=${f.min_lumpsum_inr}`);
  if (f.exit_load) pairs.push(`exit_load=${f.exit_load}`);
  if (f.section_80c_eligible) pairs.push(`section_80c_eligible=true`);
  if (typeof f.section_80c_max_inr === "number")
    pairs.push(`section_80c_max_inr=${f.section_80c_max_inr}`);
  if (f.inception_date) pairs.push(`inception_date=${f.inception_date}`);
  if (f.large_cap_definition)
    pairs.push(`large_cap_definition="${f.large_cap_definition}"`);
  if (f.mid_cap_definition)
    pairs.push(`mid_cap_definition="${f.mid_cap_definition}"`);
  if (f.small_cap_definition)
    pairs.push(`small_cap_definition="${f.small_cap_definition}"`);
  if (f.notes) pairs.push(`notes="${f.notes}"`);
  if (f.as_of) pairs.push(`as_of="${f.as_of}"`);
  return pairs.length > 0 ? `Facts: ${pairs.join("; ")}` : null;
}

export function formatContextForLlm(chunks: KbChunk[]): string {
  return chunks
    .map((c, i) => {
      const head = `[${i + 1}] doc_type=${c.doc_type} scheme=${c.scheme} url=${c.url}`;
      const facts = formatFactsLine(c);
      return facts ? `${head}\n${c.text}\n${facts}` : `${head}\n${c.text}`;
    })
    .join("\n\n---\n\n");
}
