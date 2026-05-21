"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAdminSession } from "@/lib/adminSession";
import type { LoginMode } from "./LoginModal";
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
  const searchParams = useSearchParams();
  const [loginOpen, setLoginOpen] = useState(
    () => searchParams.get("login") === "1",
  );

  const goToChat = useCallback(() => router.push("/about-us"), [router]);

  const onLoginClick = useCallback(() => setLoginOpen(true), []);
  const onCancel = useCallback(() => setLoginOpen(false), []);

  /**
   * `initials` is the only thing we keep from the cosmetic login form (max
   * two A–Z characters derived from the email's local part). We persist it
   * in `sessionStorage` so the avatar can render on /about-us and survive a
   * reload, but it dies with the tab. The full email is dropped inside
   * LoginModal and never reaches this callback. Logout clears the key.
   */
  const onSubmit = useCallback(
    async (initials: string, mode: LoginMode) => {
      setLoginOpen(false);
      try {
        if (initials) {
          sessionStorage.setItem("demoInitials", initials);
        } else {
          sessionStorage.removeItem("demoInitials");
        }
        setAdminSession(mode === "admin");
      } catch {
        // sessionStorage can throw in privacy mode — fine, avatar falls
        // back to "MF" and the rest of the demo keeps working.
      }
      goToChat();
    },
    [goToChat],
  );

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
