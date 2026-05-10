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
 * Both the header's "Login / Sign up" and the hero's "Launch assistant"
 * CTAs route straight to /about-us where the chat lives. The Login button
 * pairs with the Logout link in /about-us's TopNav so the user-facing
 * journey stays symmetric — but no email, phone, OTP, or other PII is ever
 * collected (see /outputs/disclaimer.md).
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
