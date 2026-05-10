import styles from "./AboutHero.module.css";

export function AboutHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <h1 className={styles.title}>
          Easy.
          <br />
          Fast.
          <br />
          Transparent.
        </h1>
        <p className={styles.copy}>
          Investing in India was none of the above.
          <br />
          But we&apos;re changing that.
          <br />
          Super easy to use, lightning fast, and
          <br />
          crystal clear.
        </p>
      </div>

      <div className={styles.right} aria-hidden="true">
        <div className={styles.mintBlob} />
        <svg
          className={styles.people}
          viewBox="0 0 640 420"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Minimal vector approximation of illustration */}
          <path
            d="M88 332c74-94 130-140 216-140 94 0 134 60 248 60 28 0 56-2 90-10v134H88z"
            fill="#DFF9EE"
          />
          <ellipse cx="368" cy="360" rx="54" ry="18" fill="#CFF6E6" />

          {/* Person 1 */}
          <circle cx="278" cy="130" r="26" fill="#F3C7A6" />
          <path d="M252 120c10-18 48-18 56 0v10h-56z" fill="#374151" />
          <path
            d="M246 165c20-22 72-22 92 0v150h-92z"
            fill="#10B981"
          />
          <path d="M270 175h44v150h-44z" fill="#059669" opacity=".25" />
          <rect x="262" y="210" width="10" height="128" rx="5" fill="#374151" opacity=".45" />

          {/* Person 2 */}
          <circle cx="370" cy="110" r="26" fill="#F3C7A6" />
          <path d="M344 100c10-18 48-18 56 0v10h-56z" fill="#374151" />
          <path
            d="M332 145c22-24 76-24 98 0v170h-98z"
            fill="#34D399"
          />
          <path d="M366 160h30v155h-30z" fill="#0F766E" opacity=".18" />
          <rect x="362" y="196" width="10" height="150" rx="5" fill="#374151" opacity=".45" />

          {/* Person 3 */}
          <circle cx="476" cy="134" r="26" fill="#F3C7A6" />
          <path d="M450 124c10-18 48-18 56 0v10h-56z" fill="#374151" />
          <path
            d="M444 170c20-22 72-22 92 0v145h-92z"
            fill="#10B981"
            opacity=".85"
          />
          <path d="M468 190h44v145h-44z" fill="#059669" opacity=".22" />
          <rect x="460" y="220" width="10" height="120" rx="5" fill="#374151" opacity=".45" />

          {/* Small mascot */}
          <circle cx="360" cy="318" r="14" fill="#0EA5A5" opacity=".85" />
          <path
            d="M344 340c10-12 42-12 52 0v22h-52z"
            fill="#22C55E"
            opacity=".65"
          />
        </svg>
      </div>
    </section>
  );
}

