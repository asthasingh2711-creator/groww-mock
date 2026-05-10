/**
 * PII detection for the MF FAQ chatbot.
 *
 * The assignment spec says: "No PII. Do not accept/store PAN, Aadhaar, account
 * numbers, OTPs, emails, or phone numbers." If any of these patterns appear in
 * the user's message we refuse before forwarding to the LLM.
 *
 * Patterns aim for low false-positives on factual mutual-fund queries (which
 * rarely contain 10+ digit runs or `@`).
 */

const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/i;
const AADHAAR_RE = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
// Indian mobile: optional +91/91 prefix, then a 10-digit number starting 6-9.
const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d{9}\b/;
// 10+ consecutive digits anywhere → likely an account or card number.
const LONG_NUMERIC_RE = /\b\d{10,}\b/;

export type PiiKind =
  | "pan"
  | "aadhaar"
  | "email"
  | "phone"
  | "long_numeric";

export function detectPii(text: string): PiiKind | null {
  const t = text || "";
  if (PAN_RE.test(t)) return "pan";
  if (AADHAAR_RE.test(t)) return "aadhaar";
  if (EMAIL_RE.test(t)) return "email";
  if (PHONE_RE.test(t)) return "phone";
  if (LONG_NUMERIC_RE.test(t)) return "long_numeric";
  return null;
}
