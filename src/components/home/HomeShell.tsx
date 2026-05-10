"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { HomeHeader } from "./HomeHeader";
import { HomeHero } from "./HomeHero";
import { MarketTicker } from "./MarketTicker";
import styles from "./HomeShell.module.css";

/**
 * Demo prototype: there is no real auth or PII collection.
 *
 * The header's "Login/Sign up" and the hero's "Get started" buttons both
 * navigate straight to /about-us, where the chat assistant lives. We do NOT
 * collect or store any PII (email, name, phone) — see /outputs/disclaimer.md.
 */
export function HomeShell() {
  const router = useRouter();
  const goToChat = useCallback(() => router.push("/about-us"), [router]);

  return (
    <div className={styles.shell}>
      <HomeHeader onLoginClick={goToChat} />
      <MarketTicker />
      <HomeHero onGetStarted={goToChat} />
    </div>
  );
}
