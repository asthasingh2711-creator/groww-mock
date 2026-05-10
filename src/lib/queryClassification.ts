/**
 * Mutual-fund chatbot — query classification
 *
 * We classify every user message before calling the LLM. This keeps scope tight:
 * - Fintech assistants must not answer general knowledge, politics, medical, etc.
 * - Off-topic replies reduce hallucination risk and keep the product in a safe lane.
 * - Greetings get a short, consistent onboarding line instead of burning tokens on the model.
 *
 * Order of checks (important):
 * 1) mutual_fund — if any in-scope keyword appears, treat as in-domain even if the user
 *    also said "hi" (e.g. "Hi, what is ELSS?").
 * 2) greeting — short, conventional hellos only.
 * 3) off_topic — everything else (including empty-after-trim, handled by caller).
 */

export type MutualFundQueryCategory = "greeting" | "mutual_fund" | "off_topic";

/** Exact assistant reply for greetings (no citation footer appended by API). */
export const GREETING_REPLY =
  "Hi! Ask me factual mutual-fund questions like ELSS lock-in, expense ratios, SIP minimums, exit loads, benchmarks, or riskometer details.";

/** Exact assistant reply when the topic is outside the MF facts scope. */
export const OFF_TOPIC_REPLY =
  "I'm a mutual fund facts assistant and do not have information on that topic. For factual information on mutual funds, I can provide details on topics such as fund types, investment objectives, or fees.";

/**
 * Keywords / phrases that indicate the user is asking about mutual-fund facts or regulation.
 * Kept aligned with product vocabulary (ELSS, SIP, NAV, AMFI, SEBI, etc.).
 */
const MUTUAL_FUND_SIGNALS: RegExp[] = [
  /\bmutual\s+funds?\b/i,
  /\belss\b/i,
  /\bsip\b/i,
  /\bnav\b/i,
  /\bexpense\s+ratio\b/i,
  /\bexit\s+load\b/i,
  /\bbenchmark\b/i,
  /\briskometer\b/i,
  /\bamfi\b/i,
  /\bsebi\b/i,
  /\bfund\b/i,
  /\binvesting\b/i,
  /\btax\s+saver\b/i,
  /\bcapital\s+gains\b/i,
];

/**
 * Conventional greetings only (not small-talk like "how are you").
 */
const GREETING_ONLY_PATTERNS: RegExp[] = [
  /^(hi|hello|hey)(\s+there)?\s*[!.?,]*$/i,
  /^good\s+morning\s*[!.?,]*$/i,
  /^good\s+evening\s*[!.?,]*$/i,
];

function hasMutualFundSignal(lower: string): boolean {
  return MUTUAL_FUND_SIGNALS.some((re) => re.test(lower));
}

function isGreetingOnly(trimmed: string): boolean {
  return GREETING_ONLY_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Classifies user text into greeting | mutual_fund | off_topic.
 *
 * Note: The name `isMutualFundRelatedQuestion` was kept per integration spec; it returns
 * a category union, not a boolean.
 */
export function isMutualFundRelatedQuestion(
  text: string,
): MutualFundQueryCategory {
  const trimmed = text.trim();
  if (!trimmed) return "off_topic";

  const lower = trimmed.toLowerCase();

  if (hasMutualFundSignal(lower)) return "mutual_fund";
  if (isGreetingOnly(trimmed)) return "greeting";
  return "off_topic";
}
