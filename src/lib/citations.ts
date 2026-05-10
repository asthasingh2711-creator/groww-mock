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
  const m = answer.match(/Source:\s*(https?:\/\/[^\s]+)/i);
  if (!m) return null;
  return m[1].replace(/[)\].,;:]+$/, "");
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
 * Ensure exactly one allowed Source URL and a Last updated line.
 * Replaces hallucinated or disallowed domains.
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

  const body = stripTrailingCitationBlocks(answer);
  return `${body}\n\nSource: ${citationUrl}\n\nLast updated from sources: ${today}`;
}
