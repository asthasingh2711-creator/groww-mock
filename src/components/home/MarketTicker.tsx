import styles from "./MarketTicker.module.css";

const items = [
  { name: "NIFTYTOTALMCAP", value: "13,017.90", change: "+0.22%", up: true },
  { name: "NIFTYSMALL", value: "18,737.00", change: "-0.41%", up: false },
  { name: "NIFTYMETAL", value: "8,421.30", change: "+0.15%", up: true },
  { name: "NIFTYPHARMA", value: "21,102.55", change: "-0.18%", up: false },
  { name: "BSE100", value: "24,890.12", change: "+0.08%", up: true },
  { name: "BANKEX", value: "63,456.00", change: "-0.62%", up: false },
];

export function MarketTicker() {
  return (
    <div className={styles.wrap} aria-label="Market indices">
      <div className={styles.track}>
        {items.map((it) => (
          <span key={it.name} className={styles.item}>
            <span className={styles.name}>{it.name}</span>{" "}
            <span className={styles.val}>{it.value}</span>{" "}
            <span className={it.up ? styles.up : styles.down}>
              {it.up ? "↑" : "↓"} {it.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
