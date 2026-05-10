"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeHeader } from "./HomeHeader";
import { HomeHero } from "./HomeHero";
import { LoginModal } from "./LoginModal";
import { MarketTicker } from "./MarketTicker";
import styles from "./HomeShell.module.css";

/**
 * Demo prototype: there is no real auth or PII collection.
 *
 * "Login / Sign up" in the header opens a Groww-style LoginModal so the
 * journey feels like the real product. The modal is visual only — its
 * inputs are uncontrolled and Submit ignores the form values; nothing is
 * read into state, persisted, or sent anywhere. See LoginModal.tsx for
 * the full compliance note.
 *
 * The hero's "Launch assistant" CTA bypasses the modal and routes
 * straight to /about-us — its label doesn't pretend to authenticate.
 * Logout on /about-us closes the loop back to /.
 */
export function HomeShell() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  const goToChat = useCallback(() => router.push("/about-us"), [router]);

  const onLoginClick = useCallback(() => setLoginOpen(true), []);
  const onCancel = useCallback(() => setLoginOpen(false), []);
  const onSubmit = useCallback(() => {
    setLoginOpen(false);
    goToChat();
  }, [goToChat]);

  return (
    <div className={styles.shell}>
      <HomeHeader onLoginClick={onLoginClick} />
      <MarketTicker />
      <HomeHero onGetStarted={goToChat} />
      <LoginModal
        open={loginOpen}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}
