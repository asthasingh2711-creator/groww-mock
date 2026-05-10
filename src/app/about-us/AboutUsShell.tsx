"use client";

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
  return (
    <div className={styles.page}>
      <TopNav />
      <main className={styles.main}>
        <AboutHero />
        <StatsRow />
      </main>
      <ChatWidget />
    </div>
  );
}
