/**
 * Structured, machine-readable facts attached to a scheme chunk.
 *
 * The retriever surfaces these to both:
 *  1) the deterministic factExtractor (for canonical asks like "lock-in?",
 *     "benchmark?", "min SIP?") so we can answer with a number/string + URL
 *     without an LLM round-trip; and
 *  2) the LLM as part of the CONTEXT so it can ground free-form answers in
 *     verified fields rather than re-deriving them from prose.
 *
 * Every scalar should be a fact you can verify on the cited URL — DO NOT add
 * fields you can't source officially. Numeric INR fields are stored as plain
 * numbers (no "Rs " prefix). Free-form fields use short canonical strings.
 */
export type SchemeFacts = {
  scheme_code?: string;
  category?: string;
  benchmark?: string;
  asset_allocation?: string;
  lock_in_years?: number;
  min_sip_inr?: number;
  min_lumpsum_inr?: number;
  exit_load?: string;
  section_80c_eligible?: boolean;
  inception_date?: string;
  notes?: string;
  /** Free-form regulatory/category facts for non-scheme chunks. */
  large_cap_definition?: string;
  mid_cap_definition?: string;
  small_cap_definition?: string;
  section_80c_max_inr?: number;
  /** Provenance / freshness label for the facts above. */
  as_of?: string;
};

export type KbChunk = {
  id: string;
  url: string;
  doc_type: string;
  scheme: string;
  tags: string[];
  text: string;
  facts?: SchemeFacts;
};
