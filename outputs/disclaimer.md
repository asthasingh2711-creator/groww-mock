# UI Disclaimer Snippet

This is the disclaimer presented to every user inside the chat assistant, plus the standing copy used in the README and on the prototype's chat welcome message.

---

## Visible inside the chat (welcome message)

```
Hey there! I am here to answer facts about mutual fund schemes.

You can ask me questions like:
• What is the ELSS lock-in period?
• What is the exit load for SBI Bluechip Fund?
• How do I download a capital gains statement?

Facts-only. No investment advice.
```

## Refusal copy (opinion / portfolio questions)

> I can only provide factual information, not investment advice. For neutral mutual-fund education, see the AMFI investor knowledge center.
>
> Source: https://www.amfiindia.com/investor-corner/knowledge-center/what-are-mutual-funds-new.html

## Refusal copy (off-topic / out-of-scope questions)

> I'm a mutual fund facts assistant and can only help with factual mutual fund questions (categories, fees, lock-in, riskometer, benchmark, statements). For neutral mutual-fund education, see AMFI's investor knowledge center.
>
> Source: https://www.amfiindia.com/investor-corner/knowledge-center/what-are-mutual-funds-new.html

## Refusal copy (PII detected)

> I can't process personal identifiers like PAN, Aadhaar, account numbers, OTPs, emails, or phone numbers — this assistant only answers factual questions about mutual fund schemes from public sources. For folio or KYC matters, use the AMC's secure investor portal.
>
> Source: https://www.sbimf.com/

## Refusal copy (performance / returns claims)

> I don't quote performance numbers without the scheme's latest official factsheet. Open the current factsheet on the AMC's website for performance disclosures, calculated as per AMFI/SEBI methodology.
>
> Source: https://www.sbimf.com/

## Standing footer (auto-appended to every answer)

```
Source: <one URL from the allowlist: sbimf.com / amfiindia.com / sebi.gov.in>

Last updated from sources: <today's date>
```

## Standing legal note (suggested for README / About)

> This is a non-commercial educational prototype. It does not solicit investments, does not collect or store any PII (PAN, Aadhaar, account numbers, OTPs, emails, phone numbers), and does not compute or compare scheme performance. Mutual fund investments are subject to market risks; read all scheme-related documents carefully. Always confirm scheme-specific figures from the latest KIM/SID/factsheet on the AMC's official website.

## Visible inside the Login modal (cosmetic only)

The "Login / Sign up" button on the home page opens a Groww-style login dialog purely for visual fidelity. The modal is cosmetic — its inputs are uncontrolled, `Submit` ignores all field values, and no data is read into state, persisted, or sent anywhere. The modal carries this banner above the form:

> Demo only — nothing you type is saved or sent. Submit to continue.

Compliance summary for the login modal:

- No React state is bound to the email / password inputs.
- The form handler calls `event.preventDefault()` and routes the user to `/about-us` without sending or persisting the form values anywhere.
- On Submit we read the email field once via `FormData` only to derive up to two uppercase A–Z initials for the demo avatar on `/about-us`. The raw email is dropped on the same line and is never stored in component state, `sessionStorage`, `localStorage`, cookies, or sent to a backend. The password field is never read.
- Two derived initials alone cannot identify a person and are not treated as PII; they live in `sessionStorage` so the avatar survives a tab reload but are cleared on Logout and on tab close.
- No `fetch`, `localStorage`, cookies, or analytics calls fire on submit.
- `autoComplete="off"` is set on the form and both inputs to discourage password managers from persisting anything for the user.
