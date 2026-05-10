import Link from "next/link";
import styles from "./TopNav.module.css";

type Props = {
  userEmail: string;
};

function avatarLetter(email: string) {
  const c = email.trim().charAt(0);
  return (c || "A").toUpperCase();
}

export function TopNav({ userEmail }: Props) {
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
            aria-label="Profile"
            title={userEmail}
          >
            {avatarLetter(userEmail)}
          </div>
        </div>
      </div>
    </header>
  );
}

