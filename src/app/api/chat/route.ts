import path from "path";
import { config as loadEnv } from "dotenv";
import { NextResponse } from "next/server";

import mfKb from "@/data/mf_kb.json";
import { ensureCitationFooter } from "@/lib/citations";
import { extractFactAnswer } from "@/lib/factExtractor";
import type { KbChunk } from "@/lib/mfTypes";
import { detectPii } from "@/lib/pii";
import { buildSbiSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import {
  GREETING_REPLY,
  isMutualFundRelatedQuestion,
  OFF_TOPIC_REPLY,
  PII_REFUSAL_REPLY,
} from "@/lib/queryClassification";
import { formatContextForLlm, retrieveChunks } from "@/lib/retrieve";

export const runtime = "nodejs";

function ensureGroqEnv() {
  if (process.env.GROQ_API_KEY?.trim()) return;
  const webRoot = process.cwd();
  loadEnv({ path: path.join(webRoot, "..", ".env") });
  loadEnv({ path: path.join(webRoot, ".env") });
  loadEnv({ path: path.join(webRoot, ".env.local"), override: true });
}

type GroqChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const APP_MODEL_ID = "llama-3.3-70b-versatile";

const KB_CHUNKS = mfKb as unknown as KbChunk[];

function guardrailResponse(userText: string): string | null {
  const t = userText.toLowerCase();
  const adviceKeywords = [
    "should i invest",
    "should i buy",
    "should i sell",
    "recommend",
    "best fund",
    "good investment",
    "allocate to",
    "where should i put my money",
    "portfolio allocation",
    "is it a good time",
    "is now a good time",
    "worth buying",
    "worth investing",
  ];
  if (adviceKeywords.some((k) => t.includes(k))) {
    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      "I can only provide factual information, not investment advice. " +
      "For neutral mutual-fund education, see AMFI's investor knowledge center.\n\n" +
      "Source: https://www.amfiindia.com/investor-corner/knowledge-center/what-are-mutual-funds-new.html\n\n" +
      `Last updated from sources: ${today}`
    );
  }
  // Performance / returns / rankings asks — refuse and point to factsheet.
  const perfKeywords = [
    "last year's return",
    "last year return",
    "1 year return",
    "3 year return",
    "5 year return",
    "cagr",
    "past performance",
    "rank",
    "top performing",
    "best performing",
  ];
  if (perfKeywords.some((k) => t.includes(k))) {
    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      "I don't quote performance numbers without the scheme's latest official factsheet. " +
      "Open the current factsheet on SBI MF's website for performance disclosures, calculated as per AMFI/SEBI methodology.\n\n" +
      "Source: https://www.sbimf.com/\n\n" +
      `Last updated from sources: ${today}`
    );
  }
  return null;
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function POST(req: Request) {
  try {
    ensureGroqEnv();
    const { message } = (await req.json()) as { message?: string };
    const userText = (message || "").toString().trim();
    if (!userText) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    /**
     * PII guardrail runs first. The spec forbids accepting/storing PAN, Aadhaar,
     * account numbers, OTPs, emails or phone numbers — so we never forward
     * messages containing these to the LLM, regardless of intent.
     */
    if (detectPii(userText)) {
      return NextResponse.json({ reply: PII_REFUSAL_REPLY });
    }

    const guarded = guardrailResponse(userText);
    if (guarded) return NextResponse.json({ reply: guarded });

    /**
     * Scope + tone: greetings and off-topic never hit Groq — fixed strings only.
     * In-domain questions keep RAG + Groq + citation footer unchanged.
     */
    const category = isMutualFundRelatedQuestion(userText);
    if (category === "greeting") {
      return NextResponse.json({ reply: GREETING_REPLY });
    }
    if (category === "off_topic") {
      return NextResponse.json({ reply: OFF_TOPIC_REPLY });
    }

    const retrieved = retrieveChunks(userText, KB_CHUNKS, 5);
    const today = todayLabel();

    /**
     * Deterministic fast-path: for canonical asks (lock-in, min SIP, exit
     * load, benchmark, category, scheme code, 80C, SEBI cap definitions),
     * we answer straight from the structured `facts` field on the
     * top-ranked retrieved chunk. This bypasses the LLM entirely so the
     * answer is verified-and-cited instead of generated.
     */
    const direct = extractFactAnswer(userText, retrieved);
    if (direct) {
      return NextResponse.json({
        reply: ensureCitationFooter(direct.reply, direct.url, today),
      });
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            "This app needs a Groq API key. Add GROQ_API_KEY to the project root `.env` (next to the Streamlit app) or to `web/.env.local`, then restart `npm run dev`.",
        },
        { status: 200 },
      );
    }

    const preferredUrl =
      retrieved[0]?.url ?? "https://www.sbimf.com/";
    const contextBlock = formatContextForLlm(retrieved);
    const system = buildSbiSystemPrompt();
    const userPayload = buildUserPrompt(userText, contextBlock);

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: APP_MODEL_ID,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPayload },
        ],
      }),
    });

    const data = (await resp.json()) as GroqChatResponse;
    const raw = data.choices?.[0]?.message?.content?.trim();

    if (!resp.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Groq request failed" },
        { status: 502 },
      );
    }

    const body = raw || "No reply.";
    const reply = ensureCitationFooter(body, preferredUrl, today);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
