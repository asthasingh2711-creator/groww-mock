"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AboutHero } from "@/components/AboutHero";
import { ChatWidget } from "@/components/ChatWidget";
import { StatsRow } from "@/components/StatsRow";
import { TopNav } from "@/components/TopNav";
import { getGrowwSession, type GrowwSession } from "@/lib/growwSession";
import styles from "./styles.module.css";

export function AboutUsShell() {
  const router = useRouter();
  const [session, setSession] = useState<GrowwSession | null>(null);

  useEffect(() => {
    const s = getGrowwSession();
    if (!s) {
      router.replace("/?login=1");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <TopNav userEmail={session.email} />
      <main className={styles.main}>
        <AboutHero />
        <StatsRow />
      </main>
      <ChatWidget />
    </div>
  );
}
