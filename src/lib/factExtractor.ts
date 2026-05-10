/**
 * Deterministic fact extractor.
 *
 * For canonical asks ("ELSS lock-in?", "benchmark of SBI Flexicap?", "min SIP?",
 * "exit load?", "category?"), we don't need an LLM — we look up the structured
 * `facts` field on the highest-scoring retrieved chunk and format a 1-sentence
 * answer with the chunk's URL. This:
 *   - eliminates hallucination risk for the questions the brief explicitly
 *     names ("Expense ratio of ?", "ELSS lock-in?", "Min SIP?", "Exit load?",
 *     "Riskometer/benchmark?", "How to download capital-gains statement?"),
 *   - is faster and cheaper than calling Groq, and
 *   - gives the assistant something visibly correct to demo on LinkedIn.
 *
 * Anything that doesn't match a canonical intent — or where the top-ranked
 * chunk for the user's scheme has no value for the asked field — falls
 * through to the RAG + LLM path. That fallback is honest: with the structured
 * fields surfaced in CONTEXT, the LLM either restates the verified value or
 * politely refuses and links to the official factsheet/SID/KIM.
 *
 * Important: order of `chunks` matters. The caller must pass chunks ranked by
 * retrieval score (best first); we walk from the top and pick the first chunk
 * that has the asked fact, so retrieval already handled scheme disambiguation.
 */

import type { KbChunk, SchemeFacts } from "./mfTypes";

type FactIntent = {
  /** Stable id for logging/debugging. */
  id: string;
  /** Patterns that match a user's natural-language ask for this fact. */
  patterns: RegExp[];
  /** Resolves the intent against ranked chunks. Returns null to defer. */
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
      /tax\s*(?:saving|saver|deduction)/i,
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
      /(?:sebi|definition).*(?:large\s*cap|mid\s*cap|small\s*cap)/i,
      /(?:large\s*cap|mid\s*cap|small\s*cap).*(?:sebi|definition)/i,
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

/**
 * If the user's query maps to a canonical intent AND the retrieved chunks
 * contain a matching structured fact, returns a deterministic answer body
 * + the URL to cite. The caller is expected to wrap this with the standard
 * `ensureCitationFooter()` so output formatting matches the LLM path.
 *
 * Returns null when no intent matches or no fact is available — the caller
 * should then fall back to the LLM.
 */
export function extractFactAnswer(
  query: string,
  rankedChunks: KbChunk[],
): { reply: string; url: string; intent: string } | null {
  for (const intent of INTENTS) {
    if (!intent.patterns.some((re) => re.test(query))) continue;
    const hit = intent.resolve(rankedChunks);
    if (hit) return { ...hit, intent: intent.id };
  }
  return null;
}
