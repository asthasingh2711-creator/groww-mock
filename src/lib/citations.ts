const ALLOWED_HOST_SUFFIXES = [
  "sbimf.com",
  "amfiindia.com",
  "sebi.gov.in",
] as const;

const DEFAULT_FALLBACK_URL = "https://www.sbimf.com/";

export function validateSource(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return ALLOWED_HOST_SUFFIXES.some(
      (s) => host === s || host.endsWith(`.${s}`),
    );
  } catch {
    return false;
  }
}

export function extractSourceLine(answer: string): string | null {
  const m = answer.match(/Source:\s*(https?:\/\/\S+)/i);
  if (!m) return null;
  // Strip common trailing punctuation that's likely sentence punctuation, NOT
  // a paren since some official URLs (e.g. SBI scheme detail pages) embed
  // parens in the path: ".../sbi-large-cap-fund-(formerly-known-as-bluechip-fund)-43".
  return m[1].replace(/[.,;:!?]+$/, "");
}

export function stripTrailingCitationBlocks(answer: string): string {
  let a = answer.trim();
  const srcAt = a.search(/\n\s*Source:\s*https?:\/\//i);
  if (srcAt >= 0) a = a.slice(0, srcAt).trim();
  const updAt = a.search(/\n\s*Last updated from sources:/i);
  if (updAt >= 0) a = a.slice(0, updAt).trim();
  return a;
}

/**
 * Truncate body to at most `maxSentences` sentences. Sentence boundaries are
 * detected as terminal punctuation (`.`, `!`, `?`) followed by whitespace and
 * a capital letter or open paren — this avoids splitting on common
 * abbreviations like "e.g." while still catching real sentence ends.
 *
 * Multi-paragraph bodies count newlines as boundaries too. If the body has
 * fewer than `maxSentences` sentences, it's returned unchanged.
 */
export function clampToSentences(body: string, maxSentences = 3): string {
  const trimmed = body.trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split(/(?<=[.!?])\s+(?=[A-Z(])|\n{2,}/);
  if (parts.length <= maxSentences) return trimmed;
  return parts.slice(0, maxSentences).join(" ").trim();
}

/**
 * Ensure exactly one allowed Source URL and a Last updated line.
 * Replaces hallucinated or disallowed domains and clamps the body to ≤3
 * sentences (per assignment "Clarity & transparency" rule).
 */
export function ensureCitationFooter(
  answer: string,
  preferredUrl: string,
  today: string,
): string {
  const extracted = extractSourceLine(answer);
  let citationUrl =
    extracted && validateSource(extracted) ? extracted : preferredUrl;
  if (!validateSource(citationUrl)) citationUrl = DEFAULT_FALLBACK_URL;

  const rawBody = stripTrailingCitationBlocks(answer);
  const body = clampToSentences(rawBody, 3);
  return `${body}\n\nSource: ${citationUrl}\n\nLast updated from sources: ${today}`;
}
