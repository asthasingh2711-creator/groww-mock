# Sample Q&A — SBI Mutual Fund FAQ assistant (RAG, official sources only)

> **Facts-only. No investment advice.** Mutual fund investments are subject to market risks; read all scheme-related documents carefully.

**Scope:** AMC = SBI Mutual Fund. Schemes = SBI Bluechip / SBI Large Cap Fund (large-cap), SBI Flexicap Fund (flexi-cap), SBI Long Term Equity Fund / SBI ELSS Tax Saver Fund (ELSS).

**Allowed citation domains:** `sbimf.com`, `amfiindia.com`, `sebi.gov.in` (and subdomains).

**Pipeline:** Each user message goes through `PII detection → advice/performance guardrail → greeting/off-topic classifier → retrieval → deterministic fact extractor → (fallback) Groq llama-3.3-70b → citation footer enforcer`. Q1–Q4 and Q7 below are answered by the **deterministic extractor** (looking up the structured `facts` field on the top-ranked retrieved chunk — no LLM call). Q5–Q6 fall through to the LLM. Q8–Q10 are fixed refusals.

---

## Q1: What is the lock-in period for SBI ELSS Tax Saver Fund? *(deterministic)*

**A:** SBI ELSS Tax Saver Fund (formerly SBI Long Term Equity Fund) has a statutory 3-year lock-in. Tax treatment under Section 80C follows current law and individual circumstances.

**Source:** https://www.sbimf.com/sbimf-scheme-details/sbi-long-term-equity-fund-(previously-known-as-sbi-magnum-taxgain-scheme)-3

**Last updated from sources:** 10 May 2026

---

## Q2: What is the benchmark for SBI Flexicap Fund? *(deterministic)*

**A:** The benchmark for SBI Flexicap Fund is BSE 500 Index TRI.

**Source:** https://www.sbimf.com/sbimf-scheme-details/sbi-flexicap-fund-39

**Last updated from sources:** 10 May 2026

---

## Q3: What is the benchmark for SBI Bluechip Fund? *(deterministic)*

**A:** The benchmark for SBI Large Cap Fund (formerly SBI Bluechip Fund) is BSE 100 TRI.

**Source:** https://www.sbimf.com/sbimf-scheme-details/sbi-large-cap-fund-(formerly-known-as-sbi-bluechip-fund)-43

**Last updated from sources:** 10 May 2026

---

## Q4: What is the minimum SIP for SBI ELSS Tax Saver Fund? *(deterministic)*

**A:** Per the published scheme materials, the minimum SIP for SBI ELSS Tax Saver Fund (formerly SBI Long Term Equity Fund) is Rs 500 (in multiples of Rs 500 thereafter). Confirm against the latest KIM/SID before investing.

**Source:** https://www.sbimf.com/sbimf-scheme-details/sbi-long-term-equity-fund-(previously-known-as-sbi-magnum-taxgain-scheme)-3

**Last updated from sources:** 10 May 2026

---

## Q5: How do I download a capital gains statement for my SBI Mutual Fund holdings? *(LLM, RAG)*

**A:** SBI Mutual Fund offers Smart Statement and account / capital-gains statement downloads through its investor portal; Smart Statement can be requested by entering the registered PAN and email, or you can log in to the online transaction portal to download statements directly. See the official Smart Statement page on sbimf.com for the latest steps.

**Source:** https://www.sbimf.com/smart-statement

**Last updated from sources:** 10 May 2026

---

## Q6: What does the riskometer indicate for a mutual fund scheme? *(LLM, RAG)*

**A:** The Riskometer is a SEBI-mandated standardised risk disclosure for mutual fund schemes, updated on an ongoing basis as per SEBI's Master Circular on Mutual Funds. Each AMC publishes monthly riskometer disclosures; for any specific scheme refer to its latest factsheet on the AMC's website.

**Source:** https://www.amfiindia.com/online-center/risk-o-meter

**Last updated from sources:** 10 May 2026

---

## Q7: How does SEBI define large-cap, mid-cap and small-cap stocks? *(deterministic)*

**A:** Per SEBI categorisation: Large-cap = Top 100 listed companies by full market capitalisation; mid-cap = 101st to 250th company by full market capitalisation; small-cap = 251st company onwards by full market capitalisation.

**Source:** https://www.amfiindia.com/investor-corner/knowledge-center/SEBI-categorization-of-mutual-fund-schemes.html

**Last updated from sources:** 10 May 2026

---

## Q8: What is the expense ratio for SBI Bluechip Fund? *(LLM refusal — no verified figure in KB)*

**A:** I cannot state the current expense ratio from the context provided — TER changes monthly. Please open the latest factsheet for SBI Large Cap Fund on sbimf.com for the current figure, calculated as per AMFI/SEBI methodology.

**Source:** https://www.sbimf.com/

**Last updated from sources:** 10 May 2026

---

## Q9 (refusal — opinion): Should I buy SBI Flexicap Fund?

**A:** I can only provide factual information, not investment advice. For neutral mutual-fund education, see AMFI's investor knowledge center.

**Source:** https://www.amfiindia.com/investor-corner/knowledge-center/what-are-mutual-funds-new.html

**Last updated from sources:** 10 May 2026

---

## Q10 (refusal — performance claim): What were last year's returns for SBI Bluechip Fund?

**A:** I don't quote performance numbers without the scheme's latest official factsheet. Open the current factsheet on SBI MF's website for performance disclosures, calculated as per AMFI/SEBI methodology.

**Source:** https://www.sbimf.com/

**Last updated from sources:** 10 May 2026

---

## Q11 (refusal — PII): My PAN is ABCDE1234F. Can you check my folio?

**A:** I can't process personal identifiers like PAN, Aadhaar, account numbers, OTPs, emails, or phone numbers — this assistant only answers factual questions about mutual fund schemes from public sources. For folio or KYC matters, use the AMC's secure investor portal.

**Source:** https://www.sbimf.com/

**Last updated from sources:** 10 May 2026
