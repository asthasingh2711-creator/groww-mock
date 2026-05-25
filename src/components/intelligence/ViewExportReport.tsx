"use client";

import {
  downloadFullReportDoc,
  downloadFullReportMarkdown,
} from "@/lib/pulseExport";
import { storeLabel } from "@/lib/reviewAnalytics";
import type { ReviewAnalyticsSlice } from "@/lib/reviewAnalyticsTypes";
import styles from "./intelligence.module.css";

export function ViewExportReport({
  stats,
  platform = "all",
}: {
  stats: ReviewAnalyticsSlice;
  platform?: string;
}) {
  return (
    <>
      <p className={styles.leadText}>
        Full intelligence report for {storeLabel(platform)} — reviews, analytics,
        themes, and weekly pulse for the selected time range.
      </p>
      <div className={styles.exportReportGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>What&apos;s included</h3>
          <ul className={styles.exportList}>
            <li>Executive summary & trend alert</li>
            <li>
              KPIs: {stats.reviewCount.toLocaleString()} reviews, {stats.avgRating}★
              avg, {stats.sentimentScore}% sentiment
            </li>
            <li>{stats.themeCards.length} themes with WoW deltas</li>
            <li>PM Priority Radar items</li>
            <li>Weekly pulse, quotes, and action ideas</li>
            <li>Analytics: ratings, sentiment split, volume trend</li>
          </ul>
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Download report</h3>
          <p className={styles.sectionSub}>Word-compatible .doc or Markdown</p>
          <div className={styles.exportActionsCol}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => downloadFullReportDoc(stats)}
            >
              Export full report (.doc)
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => downloadFullReportMarkdown(stats)}
            >
              Export full report (.md)
            </button>
          </div>
          <p className={styles.exportHint}>
            Import the .doc file into Google Docs via File → Open.
          </p>
        </div>
      </div>
    </>
  );
}
