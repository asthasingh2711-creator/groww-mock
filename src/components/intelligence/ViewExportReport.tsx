"use client";

import type { PulseSnapshot } from "@/lib/pulseSnapshot";
import {
  downloadFullReportDoc,
  downloadFullReportMarkdown,
} from "@/lib/pulseExport";
import styles from "./intelligence.module.css";

export function ViewExportReport({
  d,
  scale,
}: {
  d: PulseSnapshot;
  scale: number;
}) {
  const reviews = Math.round(d.reviewCount * scale);

  return (
    <>
      <p className={styles.sectionSub} style={{ marginBottom: 16 }}>
        Full intelligence report — reviews, analytics, themes, and weekly pulse in
        one document. AI-generated · PII-safe export.
      </p>
      <div className={styles.exportReportGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>What&apos;s included</h3>
          <ul className={styles.exportList}>
            <li>Executive summary & trend alert</li>
            <li>KPIs: {reviews.toLocaleString()} reviews, {d.avgRating}★ avg, {d.sentimentScore}% sentiment</li>
            <li>All 5 themes with WoW deltas</li>
            <li>PM Priority Radar items</li>
            <li>Weekly pulse, quotes, and action ideas</li>
            <li>Analytics: ratings, sentiment split, volume trend</li>
          </ul>
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Download report</h3>
          <p className={styles.sectionSub}>Word-compatible .doc or Markdown</p>
          <div className={styles.deliveryActions} style={{ flexDirection: "column" }}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => downloadFullReportDoc(d)}
            >
              ↓ Export full report (.doc)
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => downloadFullReportMarkdown(d)}
            >
              ↓ Export full report (.md)
            </button>
          </div>
          <p className={styles.sectionSub} style={{ marginTop: 12 }}>
            Import the .doc file into Google Docs via File → Open.
          </p>
        </div>
      </div>
    </>
  );
}
