# SBI Mutual Fund — FAQ Assistant (RAG, official sources only)

A small Next.js + Groq prototype that answers **factual** mutual-fund questions about a curated SBI MF corpus, with **one official-source citation per answer**, **no investment advice**, and **no PII collection**.

> **Facts-only. No investment advice.** Mutual fund investments are subject to market risks; read all scheme-related documents carefully.

---

## Scope

| Item | Value |
| --- | --- |
| **AMC** | SBI Mutual Fund |
| **Schemes covered** | 1) SBI Bluechip Fund / SBI Large Cap Fund (large-cap) · 2) SBI Flexicap Fund (flexi-cap) · 3) SBI Long Term Equity Fund / SBI ELSS Tax Saver Fund (ELSS) |
| **Public sources** | 22 URLs from `sbimf.com`, `amfiindia.com`, `sebi.gov.in` (see [`outputs/source_list.csv`](./outputs/source_list.csv)) |
| **Doc types** | scheme detail pages, KIM, SID, factsheet, scheme differentiation, AMC FAQ, AMFI categorization / riskometer / educational pages, SEBI IMD page, SEBI investor portal MF page |
| **Allowlisted citation domains** | `sbimf.com`, `amfiindia.com`, `sebi.gov.in` (and subdomains) — enforced server-side in [`src/lib/citations.ts`](./src/lib/citations.ts) |
| **Response style** | ≤ 3 short sentences, exactly one `Source: <url>` line, plus `Last updated from sources: <date>` |

The retrieval-augmented pipeline lives in `src/lib/retrieve.ts` (token-overlap scorer with a URL-priority bias toward `sbimf.com`); the corpus is in `src/data/mf_kb.json`.

---

## Setup

```bash
cd web
npm install
```

Set your Groq API key. Locally, either is fine:

- repo root `../.env` (loaded automatically), or
- `web/.env.local`

```bash
GROQ_API_KEY=your_key_here
```

Run the dev server:

```bash
npm run dev
```

Open:

- `http://localhost:3000/` — Groww-style homepage; click "Login/Sign up" or "Get started"
- `http://localhost:3000/about-us` — About page with the bottom-right chat widget
- `http://localhost:3000/analytics` — **Review Pulse** (admin only; see below)

### Admin → Analytics (Review Pulse)

1. Homepage → **Login / Sign up** → **Admin** tab → sign in (password checked via `POST /api/admin/login`).
2. You land on **/about-us** (same MF chat flow as a normal user).
3. Nav shows **Analytics** next to **More** → opens `/analytics` (Dashboard, Weekly Pulse, Themes, Pipeline).

Default admin password: `GrowwPulse2026!` (override with `ADMIN_PASSWORD` on Vercel).

> **Deploying to Vercel?** Set `GROQ_API_KEY` and `ADMIN_PASSWORD` in **Project → Settings → Environment Variables**. The `dotenv` calls in `next.config.ts` and `src/app/api/chat/route.ts` are no-ops on Vercel (no `../.env` exists in the build container) but harmlessly fall through to `process.env.GROQ_API_KEY`.

---

## Architecture

```
User → ChatWidget → POST /api/chat
                        │
                        ├─ detectPii()       ← refuse if PAN/Aadhaar/email/phone/long-numeric
                        ├─ guardrailResponse() ← refuse if advice or performance keywords
                        ├─ classifier        ← greeting | mutual_fund | off_topic
                        │     greeting / off_topic → fixed reply (with educational link)
                        │     mutual_fund → ↓
                        ├─ retrieveChunks()  ← token-overlap scoring over mf_kb.json
                        ├─ extractFactAnswer() ← deterministic lookup on chunk.facts;
                        │      hits canonical asks (lock-in, min SIP, exit load,
                        │      benchmark, category, scheme code, 80C, SEBI cap defs)
                        │      and short-circuits the LLM entirely
                        ├─ Groq llama-3.3-70b-versatile (system + user prompt, T=0.2;
                        │      receives `Facts:` line per chunk in CONTEXT)
                        └─ ensureCitationFooter()
                              ├─ extract Source URL from LLM
                              ├─ validate against allowlist; fallback to retrieved URL
                              ├─ clamp body to ≤3 sentences
                              └─ append Source + "Last updated from sources" line
```

### Structured facts in the KB

Each scheme chunk in `mf_kb.json` carries an optional `facts` object with verified scalars (see `src/lib/mfTypes.ts → SchemeFacts`):

```jsonc
"facts": {
  "category": "Equity Linked Savings Scheme (ELSS, open-ended)",
  "benchmark": "BSE 500 Index TRI",
  "lock_in_years": 3,
  "min_sip_inr": 500,
  "min_lumpsum_inr": 500,
  "exit_load": "NIL",
  "section_80c_eligible": true,
  "section_80c_max_inr": 150000,
  "as_of": "Per scheme detail page on sbimf.com (accessed May 2026)"
}
```

Facts are surfaced in two places:

1. **Deterministic fast-path** — `extractFactAnswer` (in `src/lib/factExtractor.ts`) maps canonical user asks to fields and returns a 1-sentence answer + URL, no LLM call. This eliminates hallucination risk for the questions the brief explicitly names.
2. **LLM context** — `formatContextForLlm` appends `Facts: key=value; key=value; …` after each chunk's prose. The system prompt instructs the LLM to PREFER these structured fields over re-deriving values from text.

Anything not covered by a `Facts:` field (e.g. expense ratio, NAV, returns) flows to the LLM, which is instructed to refuse with a link to the scheme's official factsheet/SID/KIM rather than fabricate.

### Key files

| File | Purpose |
| --- | --- |
| `src/data/mf_kb.json` | 22 official-source RAG chunks (scheme + topic) with structured `facts` on scheme chunks |
| `src/lib/mfTypes.ts` | `KbChunk` + `SchemeFacts` type definitions |
| `src/lib/retrieve.ts` | Keyword-overlap retrieval with `sbimf.com` priority; renders `Facts:` line in LLM context |
| `src/lib/factExtractor.ts` | Deterministic intent → fact lookup → 1-sentence answer + URL |
| `src/lib/prompts.ts` | System + user prompt with strict no-advice / no-fabrication rules; instructs LLM to use `Facts:` line |
| `src/lib/queryClassification.ts` | 3-way classifier + fixed `GREETING_REPLY` / `OFF_TOPIC_REPLY` / `PII_REFUSAL_REPLY` |
| `src/lib/pii.ts` | PAN / Aadhaar / email / phone / long-numeric detection |
| `src/lib/citations.ts` | Allowlist, ≤3-sentence clamp, citation footer enforcement |
| `src/app/api/chat/route.ts` | Server route wiring all of the above |
| `src/components/ChatWidget.tsx` | Bottom-right chat popup with welcome + 3 example Qs + disclaimer; linkifies citations |

---

## Disclaimer (also surfaced inside the chat)

```
Hey there! I am here to answer facts about mutual fund schemes.

You can ask me questions like:
• What is the ELSS lock-in period?
• What is the exit load for SBI Bluechip Fund?
• How do I download a capital gains statement?

Facts-only. No investment advice.
```

The full set of refusal copy (advice, performance, off-topic, PII) lives in [`outputs/disclaimer.md`](./outputs/disclaimer.md).

---

## Known limits

- **Scheme-specific numbers (TER, exit load, NAV, returns) are not stored in the KB.** The corpus deliberately points at the latest SID / KIM / factsheet on `sbimf.com` rather than caching numbers that go stale; the assistant will refuse to quote those figures and link to the document instead.
- **No performance computation or comparison.** Performance / returns / ranking questions are caught by `guardrailResponse()` and answered with a polite refusal that points to the official factsheet.
- **No PII handling.** PAN / Aadhaar / email / phone / 10+ digit numerics in user input are detected pre-LLM and refused; nothing is stored or forwarded to Groq. There is no auth or login flow — the prototype is fully anonymous.
- **Retrieval is keyword-overlap, not embedding-based.** This is intentional for a 22-chunk corpus (small, transparent, debuggable) but won't generalise well past ~50 chunks.
- **Refusal lists are keyword-based.** Novel phrasings of advice / performance asks may slip through; in that case the system prompt and `performance-refusal` KB chunk are the secondary defences.
- **URL stability.** Official SBI MF / AMFI / SEBI URLs change occasionally (especially PDF revisions). Re-verify each row of `outputs/source_list.csv` returns HTTP 200 before any submission or LinkedIn post.
- **Streamlit twin.** A parallel Streamlit prototype exists at `../app.py` for offline demos; the canonical, deployable build is this Next.js app.

---

## Deliverables map (for the assignment)

| Deliverable | Path |
| --- | --- |
| Working prototype | This Next.js app (deployable to Vercel) |
| Source list (22 URLs) | [`outputs/source_list.csv`](./outputs/source_list.csv) |
| Sample Q&A (10 entries incl. refusals) | [`outputs/sample_qa.md`](./outputs/sample_qa.md) |
| Disclaimer snippet | [`outputs/disclaimer.md`](./outputs/disclaimer.md) |
| README (this file) | `README.md` |
