/**
 * Mutual-fund chatbot — query classification
 *
 * We classify every user message before calling the LLM. This keeps scope tight:
 * - Fintech assistants must not answer general knowledge, politics, medical, etc.
 * - Off-topic replies reduce hallucination risk and keep the product in a safe lane.
 * - Greetings / courtesies get short, consistent replies instead of burning tokens on the model.
 *
 * Order of checks (important):
 * 1) mutual_fund — if any in-scope keyword appears, treat as in-domain even if the user
 *    also said "hi" (e.g. "Hi, what is ELSS?").
 * 2) greeting — short, conventional hellos only.
 * 3) courtesy — short thank-you / bye / acknowledgement messages.
 * 4) off_topic — everything else (including empty-after-trim, handled by caller).
 */

export type MutualFundQueryCategory =
  | "greeting"
  | "courtesy"
  | "mutual_fund"
  | "off_topic";

/** Exact assistant reply for greetings (no citation footer appended by API). */
export const GREETING_REPLY =
  "Hi! Ask me factual mutual-fund questions like ELSS lock-in, expense ratios, SIP minimums, exit loads, benchmarks, or riskometer details.";

/** Short polite replies for non-question courtesies. No citation footer needed. */
export function courtesyReplyFor(text: string): string {
  const t = text.trim().toLowerCase();
  if (/^(bye|goodbye|see\s+you|see\s+ya|take\s+care)\s*[!.?,]*$/i.test(t)) {
    return "Goodbye! Happy to help again anytime.";
  }
  if (/^(okay|ok|cool|got\s+it|great|perfect|nice)\s*[!.?,]*$/i.test(t)) {
    return "Great. Ask me anytime if you need a mutual-fund fact checked.";
  }
  return "You're welcome! Happy to help with factual mutual-fund questions.";
}


/**
 * Exact assistant reply when the topic is outside the MF facts scope.
 * Includes a single allowlisted educational link so the response still satisfies
 * the "one source link per answer" contract; the API layer skips the citation
 * footer for fixed replies (this string is rendered as-is).
 */
export const OFF_TOPIC_REPLY =
  "I'm a mutual fund facts assistant and can only help with factual mutual fund questions (categories, fees, lock-in, riskometer, benchmark, statements). For neutral mutual-fund education, see AMFI's investor knowledge center.\n\nSource: https://www.amfiindia.com/investor-corner/knowledge-center/what-are-mutual-funds-new.html";

/** Exact assistant reply when PII is detected in the user message. */
export const PII_REFUSAL_REPLY =
  "I can't process personal identifiers like PAN, Aadhaar, account numbers, OTPs, emails, or phone numbers — this assistant only answers factual questions about mutual fund schemes from public sources. For folio or KYC matters, use the AMC's secure investor portal.\n\nSource: https://www.sbimf.com/";

/**
 * Keywords / phrases that indicate the user is asking about mutual-fund facts or regulation.
 * Kept aligned with product vocabulary (ELSS, SIP, NAV, AMFI, SEBI, scheme names,
 * doc types, regulatory terms, statement / KYC words, plus the SBI scheme aliases
 * we have in the corpus). When in doubt, prefer false positives here — the
 * downstream RAG + fact extractor is much better than `OFF_TOPIC_REPLY` for any
 * reasonable MF-adjacent query.
 */
const MUTUAL_FUND_SIGNALS: RegExp[] = [
  /\bmutual\s+funds?\b/i,
  /\belss\b/i,
  /\bsips?\b/i,
  /\bnavs?\b/i,
  /\bexpense\s+ratio\b/i,
  /\bter\b/i,
  /\bexit\s+load\b/i,
  /\bbenchmark\b/i,
  /\briskometer\b/i,
  /\b(?:k\.?y\.?c\.?|know\s+your\s+customer)\b/i,
  /\bamfi\b/i,
  /\bsebi\b/i,
  /\bfunds?\b/i,
  /\binvest(?:ing|ment)?\b/i,
  /\btax\s*(?:saver|saving)\b/i,
  /\bcapital\s+gains?\b/i,
  /\block[\s-]*in\b/i,
  /\bredemption\b/i,
  /\bswitch\s+(?:in|out)?\b/i,
  /\bfact\s*sheet\b/i,
  /\bkim\b/i,
  /\bsid\b/i,
  /\bfolio\b/i,
  /\b80\s*c\b/i,
  /\bsection\s*80/i,
  /\b(?:large|mid|small|flexi|multi|micro)[\s-]*caps?\b/i,
  /\bblue\s*chip\b|\bbluechip\b/i,
  /\bflexi\s*cap\b|\bflexicap\b/i,
  /\bsbi\s*mf\b/i,
  /\blong[\s-]*term\s+equity\b/i,
  /\bmagnum\b/i,
  /\bsmart\s+statement\b/i,
  /\bcategorisation\b|\bcategorization\b/i,
  /\bequity\s+(?:mutual\s+)?fund\b/i,
  /\bdebt\s+(?:mutual\s+)?fund\b/i,
  /\bhybrid\s+fund\b/i,
];

/**
 * Conventional greetings only (not small-talk like "how are you").
 */
const GREETING_ONLY_PATTERNS: RegExp[] = [
  /^(hi|hello|hey)(\s+there)?\s*[!.?,]*$/i,
  /^good\s+morning\s*[!.?,]*$/i,
  /^good\s+evening\s*[!.?,]*$/i,
];

const COURTESY_ONLY_PATTERNS: RegExp[] = [
  /^(thanks|thank\s+you|thankyou|thx|ty|appreciate\s+it)\s*[!.?,]*$/i,
  /^(okay|ok|cool|got\s+it|great|perfect|nice)\s*[!.?,]*$/i,
  /^(bye|goodbye|see\s+you|see\s+ya|take\s+care)\s*[!.?,]*$/i,
];

function hasMutualFundSignal(lower: string): boolean {
  return MUTUAL_FUND_SIGNALS.some((re) => re.test(lower));
}

function isGreetingOnly(trimmed: string): boolean {
  return GREETING_ONLY_PATTERNS.some((re) => re.test(trimmed));
}

function isCourtesyOnly(trimmed: string): boolean {
  return COURTESY_ONLY_PATTERNS.some((re) => re.test(trimmed));
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
  if (isCourtesyOnly(trimmed)) return "courtesy";
  return "off_topic";
}
