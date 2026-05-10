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

- `http://localhost:3000/` — Groww-style homepage; click "Login/Sign up" or "Get started" (no auth flow, no email collection)
- `http://localhost:3000/about-us` — About page with the bottom-right chat widget

> **Deploying to Vercel?** Set `GROQ_API_KEY` in **Project → Settings → Environment Variables**. The `dotenv` calls in `next.config.ts` and `src/app/api/chat/route.ts` are no-ops on Vercel (no `../.env` exists in the build container) but harmlessly fall through to `process.env.GROQ_API_KEY`.

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
                        ├─ Groq llama-3.3-70b-versatile (system + user prompt, T=0.2)
                        └─ ensureCitationFooter()
                              ├─ extract Source URL from LLM
                              ├─ validate against allowlist; fallback to retrieved URL
                              ├─ clamp body to ≤3 sentences
                              └─ append Source + "Last updated from sources" line
```

Key files:

| File | Purpose |
| --- | --- |
| `src/data/mf_kb.json` | 22 official-source RAG chunks (scheme + topic) |
| `src/lib/retrieve.ts` | Keyword-overlap retrieval with `sbimf.com` priority |
| `src/lib/prompts.ts` | System + user prompt with strict no-advice / no-fabrication rules |
| `src/lib/queryClassification.ts` | 3-way classifier + fixed `GREETING_REPLY` / `OFF_TOPIC_REPLY` / `PII_REFUSAL_REPLY` |
| `src/lib/pii.ts` | PAN / Aadhaar / email / phone / long-numeric detection |
| `src/lib/citations.ts` | Allowlist, ≤3-sentence clamp, citation footer enforcement |
| `src/app/api/chat/route.ts` | Server route wiring all of the above |
| `src/components/ChatWidget.tsx` | Bottom-right chat popup with welcome + 3 example Qs + disclaimer |

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
