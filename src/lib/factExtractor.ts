/**
 * Deterministic fact extractor with multi-intent combination + scheme
 * disambiguation.
 *
 * For canonical asks ("ELSS lock-in?", "benchmark of SBI Flexicap?", "min
 * SIP?", "exit load?", "category?"), we don't need an LLM — we look up the
 * structured `facts` on the highest-scoring retrieved chunk and format a
 * concise answer with the chunk's URL. This eliminates hallucination risk
 * for the questions the brief explicitly names.
 *
 * What "complex" looks like and how we handle it:
 *
 *  1) "Benchmark and category of SBI Flexicap" — multiple intents in one
 *     question. We collect ALL matching intents, take the first sentence
 *     of each resolution, and combine them (≤3 sentences). All component
 *     resolutions must cite the same URL or we defer to the LLM.
 *
 *  2) "Min SIP of Bluechip" when the Bluechip facts have no min_sip_inr.
 *     If the user names a specific scheme by keyword, we only consider
 *     that scheme's chunks; if the asked field isn't there, we return
 *     null (the LLM then refuses honestly and links to the KIM/SID).
 *
 *  3) "Difference between Bluechip and Flexicap benchmark" — multiple
 *     schemes mentioned. We don't combine cross-scheme answers (citation
 *     can only point at one URL); we defer to the LLM, which has each
 *     scheme's `Facts:` line in the CONTEXT.
 *
 *  4) Anything that doesn't map to a canonical intent — defer to LLM.
 */

import type { KbChunk, SchemeFacts } from "./mfTypes";

/**
 * Query → scheme name mapping. If a query matches multiple, we treat the
 * question as cross-scheme and defer to the LLM (the citation contract is
 * one-URL-per-answer, which doesn't generalise to two schemes).
 */
const SCHEME_KEYWORDS: Array<{ scheme: string; pattern: RegExp }> = [
  {
    scheme: "SBI Large Cap Fund (formerly SBI Bluechip Fund)",
    pattern:
      /\b(blue[\s-]*chip|bluechip|sbi\s+large[\s-]*cap|large[\s-]*cap\s+fund)\b/i,
  },
  {
    scheme: "SBI Flexicap Fund",
    pattern: /\b(flexi[\s-]*cap|flexicap)\b/i,
  },
  {
    scheme: "SBI ELSS Tax Saver Fund (formerly SBI Long Term Equity Fund)",
    pattern:
      /\b(elss(?!\s+(?:in\s+)?(?:general|category))|long[-\s]*term[-\s]*equity|tax[-\s]*saver|magnum[-\s]*tax)\b/i,
  },
];

function detectMentionedSchemes(query: string): string[] {
  const matched = SCHEME_KEYWORDS.filter((s) => s.pattern.test(query)).map(
    (s) => s.scheme,
  );
  return Array.from(new Set(matched));
}

type FactIntent = {
  /** Stable id for logging/debugging. */
  id: string;
  /** Patterns that match a user's natural-language ask for this fact. */
  patterns: RegExp[];
  /** Resolves the intent against ranked, scheme-filtered chunks. */
  resolve: (
    chunks: KbChunk[],
  ) => { reply: string; url: string } | null;
};

function pickFirstWith<T>(
  chunks: KbChunk[],
  pick: (f: SchemeFacts) => T | undefined,
): { value: T; chunk: KbChunk } | null {
  for (const chunk of chunks) {
    const f = chunk.facts;
    if (!f) continue;
    const value = pick(f);
    if (value === undefined || value === null || value === "") continue;
    return { value, chunk };
  }
  return null;
}

const INTENTS: FactIntent[] = [
  {
    id: "lock_in",
    patterns: [/\block[\s-]*in\b/i],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) => f.lock_in_years);
      if (!hit) return null;
      return {
        reply:
          `${hit.chunk.scheme} has a statutory ${hit.value}-year lock-in. ` +
          `Tax treatment under Section 80C follows current law and individual circumstances.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "min_sip",
    patterns: [
      /min(?:imum)?\s*sip/i,
      /sip\s*min(?:imum)?/i,
      /smallest\s*sip/i,
      /sip\s*amount/i,
    ],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) => f.min_sip_inr);
      if (!hit) return null;
      return {
        reply:
          `Per the published scheme materials, the minimum SIP for ${hit.chunk.scheme} is Rs ${hit.value} ` +
          `(in multiples of Rs ${hit.value} thereafter). Confirm against the latest KIM/SID before investing.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "min_lumpsum",
    patterns: [
      /min(?:imum)?\s*(?:lumps?um|investment|application)/i,
      /smallest\s*(?:lumps?um|investment)/i,
    ],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) => f.min_lumpsum_inr);
      if (!hit) return null;
      return {
        reply:
          `Per the published scheme materials, the minimum lumpsum for ${hit.chunk.scheme} is Rs ${hit.value}. ` +
          `Confirm against the latest KIM/SID before investing.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "exit_load",
    patterns: [/\bexit\s*load\b/i],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) => f.exit_load);
      if (!hit) return null;
      return {
        reply:
          `Exit load for ${hit.chunk.scheme} is ${hit.value} per the published scheme materials. ` +
          `Always verify against the latest KIM/SID for any change.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "benchmark",
    patterns: [/\bbenchmark\b/i],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) => f.benchmark);
      if (!hit) return null;
      return {
        reply: `The benchmark for ${hit.chunk.scheme} is ${hit.value}.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "category",
    patterns: [
      /(?:scheme|fund)\s*(?:category|type)/i,
      /\bcategory\b/i,
      /what\s*kind\s*of\s*(?:fund|scheme)/i,
      /what\s*type\s*of\s*(?:fund|scheme)/i,
    ],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) => f.category);
      if (!hit) return null;
      return {
        reply: `${hit.chunk.scheme} is categorised as: ${hit.value}.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "scheme_code",
    patterns: [/\bscheme\s*code\b/i, /\bisin\b/i],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) => f.scheme_code);
      if (!hit) return null;
      return {
        reply: `Scheme code for ${hit.chunk.scheme} is ${hit.value} as published in the scheme materials.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "asset_allocation",
    patterns: [
      /\basset\s*allocation\b/i,
      /\bportfolio\s*(?:mix|composition)\b/i,
      /how\s*is\s*(?:it|the\s*fund)\s*invested/i,
    ],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) => f.asset_allocation);
      if (!hit) return null;
      return {
        reply: `${hit.chunk.scheme} asset allocation: ${hit.value}.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "section_80c",
    patterns: [
      /\bsection\s*80\s*c\b/i,
      /\b80\s*c\b/i,
      /tax\s*(?:saving|saver|deduction|benefit)/i,
    ],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) =>
        f.section_80c_eligible ? f.section_80c_max_inr ?? true : undefined,
      );
      if (!hit) return null;
      const cap =
        typeof hit.value === "number"
          ? `up to Rs ${hit.value.toLocaleString("en-IN")} per financial year`
          : "within prescribed limits";
      return {
        reply:
          `${hit.chunk.scheme} qualifies for deduction under Section 80C of the Income-tax Act, 1961, ` +
          `${cap}, subject to applicable law.`,
        url: hit.chunk.url,
      };
    },
  },
  {
    id: "sebi_cap_definition",
    patterns: [
      /(?:sebi|definition).*(?:large[\s-]*cap|mid[\s-]*cap|small[\s-]*cap)/i,
      /(?:large[\s-]*cap|mid[\s-]*cap|small[\s-]*cap).*(?:sebi|definition)/i,
      /how\s*does\s*sebi\s*define/i,
    ],
    resolve: (chunks) => {
      const hit = pickFirstWith(chunks, (f) =>
        f.large_cap_definition && f.mid_cap_definition && f.small_cap_definition
          ? `Large-cap = ${f.large_cap_definition}; mid-cap = ${f.mid_cap_definition}; small-cap = ${f.small_cap_definition}`
          : undefined,
      );
      if (!hit) return null;
      return {
        reply: `Per SEBI categorisation: ${hit.value}.`,
        url: hit.chunk.url,
      };
    },
  },
];

function firstSentence(s: string): string {
  const m = s.match(/^.*?[.!?](?:\s|$)/);
  return (m ? m[0] : s).trim();
}

/**
 * If the user's query maps to one or more canonical intents AND the
 * retrieved chunks contain matching structured facts, returns a
 * deterministic answer body + the URL to cite. The caller is expected to
 * wrap this with `ensureCitationFooter()` so output formatting matches the
 * LLM path.
 *
 * Returns null when no intent matches, no fact is available, or the
 * question crosses multiple schemes (in which case we let the LLM use the
 * `Facts:` lines from CONTEXT to compose a careful answer).
 */
export function extractFactAnswer(
  query: string,
  rankedChunks: KbChunk[],
): { reply: string; url: string; intent: string } | null {
  // Scheme disambiguation: if the query names a specific scheme, restrict
  // to that scheme's chunks. If it names two or more, defer to the LLM.
  const mentioned = detectMentionedSchemes(query);
  if (mentioned.length > 1) return null;
  const candidateChunks =
    mentioned.length === 1
      ? rankedChunks.filter((c) => c.scheme === mentioned[0])
      : rankedChunks;

  // Collect every matching intent, in declaration order.
  const matching = INTENTS.filter((intent) =>
    intent.patterns.some((re) => re.test(query)),
  );
  if (matching.length === 0) return null;

  const resolutions = matching
    .map((intent) => ({ intent, hit: intent.resolve(candidateChunks) }))
    .filter(
      (r): r is { intent: FactIntent; hit: { reply: string; url: string } } =>
        r.hit !== null,
    );
  if (resolutions.length === 0) return null;

  if (resolutions.length === 1) {
    return {
      ...resolutions[0].hit,
      intent: resolutions[0].intent.id,
    };
  }

  // Multi-intent: only safe to combine when every component cites the same
  // URL (i.e. they're all about the same scheme). Otherwise defer to LLM
  // since one citation can't cover claims about multiple URLs.
  const firstUrl = resolutions[0].hit.url;
  const sameSource = resolutions.every((r) => r.hit.url === firstUrl);
  if (!sameSource) return null;

  // Take the first sentence of each resolution and join. clampToSentences
  // in ensureCitationFooter trims to ≤3 sentences as a final guard.
  const combined = resolutions
    .map((r) => firstSentence(r.hit.reply))
    .slice(0, 3)
    .join(" ");

  return {
    reply: combined,
    url: firstUrl,
    intent: resolutions.map((r) => r.intent.id).join("+"),
  };
}
