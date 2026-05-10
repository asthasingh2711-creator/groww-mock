import styles from "./StatsRow.module.css";

type Stat = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

/**
 * Stats reflect the *prototype's verifiable scope*, not fabricated AMC metrics.
 *
 * The assignment forbids performance claims; the previous values
 * ("50 Million+ Customers", "4.5 Rating") were made-up marketing copy. We now
 * show three verifiable facts about this build:
 *  1) AMC + scheme count covered by the RAG corpus
 *  2) Number of public-source URLs in outputs/source_list.csv
 *  3) Allowlisted citation domains (sbimf.com / amfiindia.com / sebi.gov.in)
 */
const stats: Stat[] = [
  { icon: "▦", value: "3 SBI schemes", label: "Bluechip · Flexicap · ELSS" },
  { icon: "🔗", value: "22 official URLs", label: "AMC · AMFI · SEBI corpus" },
  { icon: "⚖", value: "Facts-only", label: "No advice · No PII · No returns" },
];

export function StatsRow() {
  return (
    <section className={styles.row} aria-label="Prototype scope">
      {stats.map((s) => (
        <div key={s.label} className={styles.card}>
          <div className={styles.icon} aria-hidden="true">
            {s.icon}
          </div>
          <div className={styles.value}>{s.value}</div>
          <div className={styles.label}>{s.label}</div>
        </div>
      ))}
    </section>
  );
}
