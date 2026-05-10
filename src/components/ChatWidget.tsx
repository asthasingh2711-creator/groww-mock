"use client";

import {
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./ChatWidget.module.css";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type Props = {
  initialOpen?: boolean;
  initialDraftQuestion?: string;
};

const WELCOME_TEXT =
  "Hey there! I am here to answer facts about mutual fund schemes.\n\n" +
  "You can ask me questions like:\n" +
  "• What is the ELSS lock-in period?\n" +
  "• What is the exit load for SBI Bluechip Fund?\n" +
  "• How do I download a capital gains statement?\n\n" +
  "⚠️ Facts-only. No investment advice.";

const initialMessages = (): ChatMessage[] => [
  { role: "assistant", content: WELCOME_TEXT },
];

/**
 * Render a string with any http(s) URLs turned into anchor tags. Used so the
 * mandatory "Source: <url>" line in every assistant reply is clickable.
 *
 * The regex stops at whitespace; trailing sentence punctuation is moved out of
 * the link so a final "." doesn't end up inside the href. We deliberately
 * KEEP `)` inside the URL because some official sources embed parens in the
 * path (e.g. SBI scheme detail URLs).
 */
const URL_RE = /(https?:\/\/\S+)/g;

function renderWithLinks(text: string): React.ReactNode[] {
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const m = part.match(/^(.*?)([.,;:!?]+)$/);
      const url = m ? m[1] : part;
      const trailing = m ? m[2] : "";
      return (
        <Fragment key={i}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cite}
          >
            {url}
          </a>
          {trailing}
        </Fragment>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function ChatWidget({
  initialOpen = false,
  initialDraftQuestion = "",
}: Props) {
  const [open, setOpen] = useState(initialOpen);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState(initialDraftQuestion);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sessionRef = useRef(0);

  const canSend = useMemo(() => input.trim().length > 0 && !busy, [input, busy]);

  /**
   * Closing the chat (via the explicit Close button or by toggling the FAB
   * while the popup is open) wipes the conversation back to the welcome
   * message. The brief is "no PII, no session" — keeping a transcript
   * around in memory after the user has visibly dismissed the chat is
   * surprising and unwelcome.
   */
  const closeAndReset = useCallback(() => {
    sessionRef.current += 1;
    setOpen(false);
    setBusy(false);
    setMessages(initialMessages());
    setInput("");
  }, []);

  const onFabClick = useCallback(() => {
    setOpen((wasOpen) => {
      if (wasOpen) {
        sessionRef.current += 1;
        setBusy(false);
        setMessages(initialMessages());
        setInput("");
      }
      return !wasOpen;
    });
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setBusy(true);
    const sessionId = sessionRef.current;

    const next = [...messages, { role: "user", content: text } satisfies ChatMessage];
    setMessages(next);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await resp.json()) as { reply?: string; error?: string };
      if (sessionRef.current !== sessionId) return;
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.reply || data.error || "Sorry, something went wrong.",
        },
      ]);
    } catch {
      if (sessionRef.current !== sessionId) return;
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "Sorry, I couldn’t reach the server just now.",
        },
      ]);
    } finally {
      if (sessionRef.current !== sessionId) return;
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
        aria-label={open ? "Close chatbot" : "Open chatbot"}
        onClick={onFabClick}
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
              onClick={closeAndReset}
              title="Close and clear chat"
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
                {m.role === "assistant" ? renderWithLinks(m.content) : m.content}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <input
              ref={inputRef}
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

