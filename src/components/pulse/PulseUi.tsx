"use client";

import type { PulseSnapshot, ThemeTrend } from "@/lib/pulseSnapshot";
import styles from "./pulse.module.css";

export function AiChip({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "purple" | "muted";
  className?: string;
}) {
  const cls =
    variant === "purple"
      ? styles.aiChipPurple
      : variant === "muted"
        ? styles.aiChipMuted
        : styles.aiChip;
  return <span className={`${cls} ${className ?? ""}`.trim()}>{children}</span>;
}

export function MiniTrendChart({
  values,
  label = "Review volume",
}: {
  values: number[];
  label?: string;
}) {
  const max = Math.max(...values, 1);
  const w = 200;
  const h = 48;
  const pad = 4;
  const step = (w - pad * 2) / (values.length - 1 || 1);
  const points = values
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={styles.trendChart}>
      <div className={styles.trendChartHead}>
        <span className={styles.statLbl}>{label}</span>
        <AiChip variant="muted">AI-tracked</AiChip>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className={styles.trendSvg} aria-hidden>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,208,156,0.35)" />
            <stop offset="100%" stopColor="rgba(0,208,156,0.02)" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
          fill="url(#trendFill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#00d09c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((v, i) => {
          const x = pad + i * step;
          const y = h - pad - (v / max) * (h - pad * 2);
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="#00b88a" />
          );
        })}
      </svg>
      <div className={styles.trendWeeks}>
        {values.map((_, i) => (
          <span key={i}>W{i + 1}</span>
        ))}
      </div>
    </div>
  );
}

export function DeltaPill({
  value,
  suffix = "%",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const up = value >= 0;
  return (
    <div className={styles.deltaPill}>
      <span className={styles.statLbl}>{label}</span>
      <span className={up ? styles.deltaUp : styles.deltaDown}>
        {up ? "↑" : "↓"} {Math.abs(value).toFixed(1)}
        {suffix} WoW
      </span>
    </div>
  );
}

export function SentimentArrow({
  score,
  label = "AI sentiment index",
}: {
  score: number;
  label?: string;
}) {
  const tone =
    score >= 60 ? "positive" : score >= 45 ? "neutral" : "negative";
  const arrow = score >= 55 ? "↑" : score <= 45 ? "↓" : "→";
  return (
    <div className={styles.sentimentBox}>
      <span className={styles.statLbl}>{label}</span>
      <div className={styles.sentimentRow}>
        <span className={`${styles.sentimentArrow} ${styles[`sentiment_${tone}`]}`}>
          {arrow}
        </span>
        <span className={styles.statNum} style={{ fontSize: 28 }}>
          {score}
        </span>
        <span className={styles.muted}>/ 100</span>
      </div>
      <AiChip>LLM-scored from clusters</AiChip>
    </div>
  );
}

export function TrendAlerts({ trends }: { trends: ThemeTrend[] }) {
  return (
    <div className={styles.alertList}>
      {trends.map((t) => (
        <div
          key={t.id}
          className={
            t.sentiment === "negative"
              ? styles.alertItemBad
              : styles.alertItemGood
          }
        >
          <span className={styles.alertIcon}>
            {t.direction === "up" && t.sentiment === "negative" ? "⚠" : "✦"}
          </span>
          <span>{t.alert}</span>
          <span className={styles.alertDelta}>
            {t.direction === "up" ? "↑" : t.direction === "down" ? "↓" : "→"}
            {Math.abs(t.wowDelta)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function DataProvenance({ d }: { d: PulseSnapshot }) {
  return (
    <p className={styles.provenance}>
      <AiChip variant="purple">AI-generated</AiChip>{" "}
      <span className={styles.provenanceText}>
        Clustered automatically · Generated from {d.reviewCount.toLocaleString()}{" "}
        public reviews · PII-safe export
      </span>
    </p>
  );
}
