import styles from "./StatsRow.module.css";

type Stat = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

const stats: Stat[] = [
  { icon: "▦", value: "50 Million+", label: "Customers" },
  { icon: "👥", value: "1000+", label: "Team Members" },
  { icon: "★", value: "4.5", label: "Rating" },
];

export function StatsRow() {
  return (
    <section className={styles.row} aria-label="Stats">
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

