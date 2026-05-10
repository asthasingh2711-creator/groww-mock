"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { GuestConsentModal } from "./GuestConsentModal";
import { HomeHeader } from "./HomeHeader";
import { HomeHero } from "./HomeHero";
import { MarketTicker } from "./MarketTicker";
import styles from "./HomeShell.module.css";

/**
 * Demo prototype: there is no real auth or PII collection.
 *
 * "Login / Sign up" in the header opens a GuestConsentModal that makes the
 * demo nature explicit before routing. It used to silently navigate to
 * /about-us, which read like an "auto-login" — clicking a Login button and
 * being instantly inside the app is misleading even if no PII is collected.
 *
 * The hero's "Launch assistant" CTA is more direct (and doesn't claim to
 * authenticate), so it bypasses the modal and routes straight to the
 * assistant. Logout on /about-us routes back here, completing the loop.
 */
export function HomeShell() {
  const router = useRouter();
  const [consentOpen, setConsentOpen] = useState(false);

  const goToChat = useCallback(() => router.push("/about-us"), [router]);

  const onLoginClick = useCallback(() => setConsentOpen(true), []);
  const onCancel = useCallback(() => setConsentOpen(false), []);
  const onContinue = useCallback(() => {
    setConsentOpen(false);
    goToChat();
  }, [goToChat]);

  return (
    <div className={styles.shell}>
      <HomeHeader onLoginClick={onLoginClick} />
      <MarketTicker />
      <HomeHero onGetStarted={goToChat} />
      <GuestConsentModal
        open={consentOpen}
        onContinue={onContinue}
        onCancel={onCancel}
      />
    </div>
  );
}
