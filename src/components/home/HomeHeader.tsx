import Link from "next/link";
import styles from "./HomeHeader.module.css";

type Props = {
  onLoginClick: () => void;
};

/**
 * Homepage header is always logged-out UX: Login/Sign up (no avatar).
 * Profile appears on /about-us after login.
 */
export function HomeHeader({ onLoginClick }: Props) {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoMark} aria-hidden />
            <span className={styles.brandText}>Groww</span>
          </Link>
          <nav className={styles.nav} aria-label="Primary">
            <Link href="/">Stocks</Link>
            <Link href="/">F&amp;O</Link>
            <Link href="/">Mutual Funds</Link>
            <Link href="/about-us">More</Link>
          </nav>
        </div>
        <div className={styles.right}>
          <div className={styles.search} role="search">
            <span className={styles.mag} aria-hidden>
              ⌕
            </span>
            <span className={styles.searchPh}>Search Groww...</span>
            <kbd className={styles.kbd}>⌘K</kbd>
          </div>
          <button
            type="button"
            className={styles.loginBtn}
            onClick={onLoginClick}
          >
            Login/Sign up
          </button>
        </div>
      </div>
    </header>
  );
}
