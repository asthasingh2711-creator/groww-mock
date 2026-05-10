"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import styles from "./TopNav.module.css";

/**
 * Lightweight subscriber to `sessionStorage.demoInitials`.
 *
 * `useSyncExternalStore` is the idiomatic way to read a client-only value
 * during render without tripping the "setState in effect" lint or
 * producing a hydration mismatch — `getServerSnapshot` returns `null` so
 * the server-rendered avatar text matches the first client paint, and
 * React swaps in the real initials right after hydration.
 *
 * We don't need a real subscription channel because the only mutator
 * (Logout) immediately navigates away and unmounts this component, so
 * there's nothing to react to in-place. The subscribe fn returns a noop.
 */
const noop = () => () => {};

function readInitials(): string | null {
  try {
    return sessionStorage.getItem("demoInitials");
  } catch {
    return null;
  }
}

function useDemoInitials(): string | null {
  return useSyncExternalStore(noop, readInitials, () => null);
}

/**
 * Top nav for the /about-us demo page.
 *
 * The avatar normally shows "MF" (mutual-fund demo badge). When the user
 * has come through the cosmetic LoginModal, two derived initials live in
 * sessionStorage (see HomeShell.tsx for the compliance note). We read
 * them once on mount; the full email is never stored or transmitted.
 *
 * The "Logout" link is intentionally cosmetic — there is no real session.
 * It routes back to `/` (which unmounts the ChatWidget and so resets any
 * in-memory chat state) AND clears the cached initials so the next
 * visitor sees the default "MF" badge.
 */
export function TopNav() {
  const rawInitials = useDemoInitials();
  const initials = rawInitials
    ? rawInitials.slice(0, 2).toUpperCase()
    : null;

  const onLogoutClick = () => {
    try {
      sessionStorage.removeItem("demoInitials");
    } catch {
      // Best-effort cleanup; routing still happens via <Link>.
    }
  };

  const avatarLabel = initials && initials.length > 0 ? initials : "MF";
  const avatarTitle =
    initials && initials.length > 0
      ? `Signed in as ${initials} (demo only)`
      : "Demo mode — no login required";

  return (
    <header className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            <div className={styles.logoMark} aria-hidden="true" />
            <span className={styles.brandName}>Groww</span>
          </Link>
          <nav className={styles.tabs} aria-label="Primary">
            <Link className={styles.tab} href="/">
              Stocks
            </Link>
            <Link className={styles.tab} href="/">
              F&amp;O
            </Link>
            <Link className={styles.tab} href="/">
              Mutual Funds
            </Link>
            <Link className={styles.tab} href="/about-us">
              More
            </Link>
          </nav>
        </div>

        <div className={styles.right}>
          <div className={styles.search} aria-label="Search">
            <span className={styles.searchIcon} aria-hidden="true">
              ⌕
            </span>
            <span className={styles.searchText}>Search Groww...</span>
            <kbd className={styles.kbd}>⌘K</kbd>
          </div>
          <button type="button" className={styles.iconBtn} aria-label="Notifications">
            🔔
          </button>
          <div
            className={styles.avatar}
            aria-label={avatarTitle}
            title={avatarTitle}
          >
            {avatarLabel}
          </div>
          <Link
            href="/"
            className={styles.logout}
            onClick={onLogoutClick}
            title="Exit the demo and clear cached initials"
          >
            Logout
          </Link>
        </div>
      </div>
    </header>
  );
}
