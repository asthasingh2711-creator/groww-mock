"use client";

import { useMemo, useRef, useState } from "react";
import styles from "./ChatWidget.module.css";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const welcomeText =
    "Hey there! I am here to answer facts about mutual fund schemes.\n\n" +
    "You can ask me questions like:\n" +
    "• What is the ELSS lock-in period?\n" +
    "• What is the exit load for SBI Bluechip Fund?\n" +
    "• How do I download a capital gains statement?\n\n" +
    "⚠️ Facts-only. No investment advice.";

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "assistant", content: welcomeText },
  ]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !busy, [input, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setBusy(true);

    const next = [...messages, { role: "user", content: text } satisfies ChatMessage];
    setMessages(next);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await resp.json()) as { reply?: string; error?: string };
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.reply || data.error || "Sorry, something went wrong.",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Sorry, I couldn’t reach the server just now.",
        },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
      });
    }
  }

  return (
    <>
      <button
        className={styles.fab}
        type="button"
        aria-label="Open chatbot"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>💬</span>
      </button>

      {open ? (
        <section className={styles.popup} aria-label="Mutual fund FAQs chat">
          <div className={styles.header}>
            <div className={styles.title}>FAQs - Mutual Fund</div>
            <button
              className={styles.close}
              type="button"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className={styles.body} ref={scrollerRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? styles.msgUser : styles.msgBot}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              disabled={busy}
            />
            <button
              className={styles.send}
              type="button"
              onClick={() => void send()}
              disabled={!canSend}
            >
              Send
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

