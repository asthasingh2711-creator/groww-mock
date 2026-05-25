"use client";

import styles from "./intelligence.module.css";

export function Sparkline({
  values,
  color = "#00d09c",
  width = 48,
  height = 20,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const pad = 2;
  const step = (width - pad * 2) / (values.length - 1 || 1);
  const points = values
    .map((v, i) => {
      const x = pad + i * step;
      const y = height - pad - (v / max) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className={styles.spark} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function VolumeChart({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const counts = labels.map((_, i) => values[i] ?? 0);
  const max = Math.max(...counts, 1);

  const dense = labels.length > 8;

  return (
    <div
      className={`${styles.volumeChart} ${dense ? styles.volumeChartDense : ""}`}
      role="img"
      aria-label={`Review volume: ${labels.map((l, i) => `${l} ${counts[i]}`).join(", ")}`}
    >
      {labels.map((label, i) => {
        const v = counts[i];
        const pct = Math.max((v / max) * 100, v > 0 ? 6 : 0);
        return (
          <div key={`${label}-${i}`} className={styles.volumeBarCol}>
            <span className={styles.volumeBarValue}>{v > 0 ? v : ""}</span>
            <div className={styles.volumeBarTrack}>
              <div
                className={styles.volumeBarFill}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span
              className={`${styles.volumeBarLabel} ${dense ? styles.volumeBarLabelDense : ""}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({
  positive,
  negative,
  neutral,
}: {
  positive: number;
  negative: number;
  neutral: number;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const total = positive + negative + neutral || 1;
  const negLen = (negative / total) * c;
  const neuLen = (neutral / total) * c;
  const posLen = (positive / total) * c;

  return (
    <div className={styles.donutWrap}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#27272a"
          strokeWidth="14"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#f87171"
          strokeWidth="14"
          strokeDasharray={`${negLen} ${c}`}
          strokeDashoffset="0"
          transform="rotate(-90 70 70)"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#00d09c"
          strokeWidth="14"
          strokeDasharray={`${posLen} ${c}`}
          strokeDashoffset={-negLen}
          transform="rotate(-90 70 70)"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#52525b"
          strokeWidth="14"
          strokeDasharray={`${neuLen} ${c}`}
          strokeDashoffset={-(negLen + posLen)}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className={styles.donutLegend}>
        <span>
          <span className={styles.legendDot} style={{ background: "#f87171" }} />
          Negative {negative}%
        </span>
        <span>
          <span className={styles.legendDot} style={{ background: "#00d09c" }} />
          Positive {positive}%
        </span>
        <span>
          <span className={styles.legendDot} style={{ background: "#52525b" }} />
          Neutral {neutral}%
        </span>
      </div>
    </div>
  );
}

export function DeltaBadge({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  if (value > 0) {
    return (
      <span className={styles.deltaUp}>
        <Sparkline values={[1, 2, 3, 4, 5]} width={32} height={14} />
        ↑ {value}
        {suffix}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className={styles.deltaDown}>
        ↓ {Math.abs(value)}
        {suffix}
      </span>
    );
  }
  return <span className={styles.deltaFlat}>→ 0{suffix}</span>;
}
