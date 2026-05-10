"use client";

import { useCallback, useState } from "react";
import { AboutHero } from "@/components/AboutHero";
import { ChatWidget } from "@/components/ChatWidget";
import { StatsRow } from "@/components/StatsRow";
import { TopNav } from "@/components/TopNav";
import styles from "./styles.module.css";

/**
 * About page hosts the FAQ chat widget. It is reachable without any login —
 * the assignment forbids accepting/storing PII (email, phone, etc.), so we
 * removed the previous email-based login gate entirely.
 */
export function AboutUsShell() {
  const [chatRequest, setChatRequest] = useState({
    count: 0,
    draftQuestion: "",
  });

  const openChat = useCallback((draftQuestion = "") => {
    setChatRequest((current) => ({
      count: current.count + 1,
      draftQuestion,
    }));
  }, []);

  return (
    <div className={styles.page}>
      <TopNav />
      <main className={styles.main}>
        <AboutHero onOpenChat={openChat} />
        <StatsRow />
      </main>
      <ChatWidget
        key={chatRequest.count}
        initialOpen={chatRequest.count > 0}
        initialDraftQuestion={chatRequest.draftQuestion}
      />
    </div>
  );
}
