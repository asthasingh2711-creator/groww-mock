## Groww About Us (Clone)

This is a small Next.js clone of Groww’s **About Us** page UI, plus a bottom-right chatbot popup.

### Setup

```bash
cd web
npm install
```

Set `GROQ_API_KEY` in **either** place (same key you use for Streamlit):

- **Repo root** `../.env` next to `app.py` (loaded automatically), or
- **`web/.env.local`**

```bash
GROQ_API_KEY=your_key_here
```

Restart `npm run dev` after changing env files.

### Run

```bash
npm run dev
```

Open:
- `http://localhost:3000` — **Groww-style homepage** + login modal (Login/Sign up, Get started)
- `http://localhost:3000/about-us` — About Us + chatbot

Login is **UI-only**: use a password with 8+ chars including upper, lower, number, and `!@#$%^&*` special char; submit swaps the header to the orange avatar.

### Notes
- **RAG:** `src/data/mf_kb.json` holds short official-style snippets + **verified** `sbimf.com` / `amfiindia.com` / `sebi.gov.in` URLs. `src/lib/retrieve.ts` scores chunks from the user question and **prioritises SBI MF links** over AMFI/SEBI.
- **Chat API:** `src/app/api/chat/route.ts` sends retrieved context to Groq, then `src/lib/citations.ts` **forces** an allowed `Source:` URL and appends `Last updated from sources:` (strips bad domains like `sec.gov`).
- **Assignment artefacts (repo root):** `outputs/source_list.csv`, `outputs/sample_qa.md`.
- Add more KB rows (and matching CSV lines) for deeper SBI scheme coverage; avoid inventing document URLs—confirm they return HTTP 200.
- Credentials / auth are not implemented; the About page avatar is static.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
