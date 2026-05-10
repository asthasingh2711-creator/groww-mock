import Link from "next/link";
import styles from "./TopNav.module.css";

/**
 * Top nav for the /about-us demo page.
 *
 * Renders a static "MF" demo badge in place of the previous email-derived
 * avatar so the page can stay public and anonymous (no PII collection per
 * the assignment).
 *
 * The "Logout" link is intentionally cosmetic — there is no real session.
 * It just routes back to `/`, which unmounts the ChatWidget and so resets
 * any in-memory chat state. Naming it "Logout" matches the rest of the
 * Groww-clone UX and gives users a familiar way out.
 */
export function TopNav() {
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
            aria-label="Demo mode"
            title="Demo mode — no login required"
          >
            MF
          </div>
          <Link
            href="/"
            className={styles.logout}
            title="Exit the demo and return to home"
          >
            Logout
          </Link>
        </div>
      </div>
    </header>
  );
}
