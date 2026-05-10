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

export function formatContextForLlm(chunks: KbChunk[]): string {
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] doc_type=${c.doc_type} scheme=${c.scheme} url=${c.url}\n${c.text}`,
    )
    .join("\n\n---\n\n");
}
