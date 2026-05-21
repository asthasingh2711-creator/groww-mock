"use client";

import { useState } from "react";
import type { PulseSnapshot } from "@/lib/pulseSnapshot";
import { DonutChart, DeltaBadge, Sparkline, VolumeChart } from "./IntelligenceUi";
import styles from "./intelligence.module.css";

function scaleCount(n: number, scale: number) {
  return Math.round(n * scale);
}

export function ViewReviews({ d, scale }: { d: PulseSnapshot; scale: number }) {
  const [kw, setKw] = useState<string | null>(null);
  const reviews = scaleCount(d.reviewCount, scale);

  return (
    <>
      <div className={styles.alertBanner}>
        <span>⚠</span>
        <span>
          <strong>Trend Alert:</strong> {d.trendAlert}
        </span>
        <span className={styles.aiBadgeGreen} style={{ marginLeft: "auto" }}>
          AI-detected
        </span>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>📈</span>
            <DeltaBadge value={d.wowReviewDelta} suffix="%" />
          </div>
          <div className={styles.kpiValue}>{reviews.toLocaleString()}</div>
          <div className={styles.kpiLabel}>Reviews analysed</div>
          <div className={styles.kpiHint}>Click for details · PII-safe export</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>★</span>
            <DeltaBadge value={d.avgRatingDelta} />
          </div>
          <div className={styles.kpiValue}>{d.avgRating}</div>
          <div className={styles.kpiLabel}>Average rating</div>
          <div className={styles.kpiHint}>Clustered automatically</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>⚡</span>
            <DeltaBadge value={d.sentimentDelta} suffix="%" />
          </div>
          <div className={styles.kpiValue}>{d.sentimentScore}%</div>
          <div className={styles.kpiLabel}>Sentiment score</div>
          <div className={styles.kpiHint}>LLM-scored from clusters</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>🏷</span>
            <span className={styles.deltaFlat}>→ 0</span>
          </div>
          <div className={styles.kpiValue}>5</div>
          <div className={styles.kpiLabel}>Theme count</div>
          <div className={styles.kpiHint}>Generated from public reviews</div>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Trending keywords</h3>
      <p className={styles.sectionSub}>
        Clustered automatically · click a keyword to highlight related themes
      </p>
      <div className={styles.keywordCloud}>
        {d.keywords.map((word, i) => (
          <button
            key={word}
            type="button"
            className={`${styles.keyword} ${kw === word ? styles.keywordSel : ""}`}
            style={{ fontSize: 12 + (i % 3) }}
            onClick={() => setKw(kw === word ? null : word)}
          >
            {word}
          </button>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>PM Priority Radar</h3>
      <p className={styles.sectionSub}>
        High impact × high frequency — AI-generated executive decision panel
      </p>
      <div className={styles.radarGrid}>
        <div className={styles.radarCol}>
          <h4>HIGH IMPACT (Fix first)</h4>
          {d.pmRadar.highImpact.map((item) => (
            <div
              key={item.title}
              className={`${styles.radarCard} ${
                item.severity === "critical"
                  ? styles.radarCardCritical
                  : styles.radarCardWarn
              }`}
            >
              <div className={styles.radarCardHead}>
                <span className={styles.radarCardTitle}>
                  {item.icon} {item.title}
                </span>
                <span className={styles.radarCount}>{item.count}</span>
              </div>
              <p className={styles.radarDesc}>{item.description}</p>
            </div>
          ))}
        </div>
        <div className={styles.radarCol}>
          <h4>HIGH FREQUENCY (Volume drivers)</h4>
          {d.pmRadar.highFrequency.map((item) => (
            <div
              key={item.title}
              className={`${styles.radarCard} ${
                item.severity === "critical"
                  ? styles.radarCardCritical
                  : styles.radarCardWarn
              }`}
            >
              <div className={styles.radarCardHead}>
                <span className={styles.radarCardTitle}>
                  {item.icon} {item.title}
                </span>
                <span className={styles.radarCount}>{item.count}</span>
              </div>
              <p className={styles.radarDesc}>{item.description}</p>
            </div>
          ))}
        </div>
        <div className={styles.radarCol}>
          <h4>MONITOR (Watch closely)</h4>
          {d.pmRadar.monitor.map((item) => (
            <div key={item.title} className={`${styles.radarCard} ${styles.radarCardWarn}`}>
              <div className={styles.radarCardHead}>
                <span className={styles.radarCardTitle}>
                  {item.icon} {item.title}
                </span>
                <span className={styles.radarCount}>{item.count}</span>
              </div>
              <p className={styles.radarDesc}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <h3 className={styles.sectionTitle}>User voices</h3>
      <p className={styles.sectionSub}>Verbatim · PII-redacted · from public store exports</p>
      <div className={styles.voiceGrid}>
        {d.userVoices.map((v) => (
          <div key={v.quote.slice(0, 30)} className={styles.voiceCard}>
            <p className={styles.voiceQuote}>&ldquo;{v.quote}&rdquo;</p>
            <div className={styles.voiceMeta}>
              <span>{v.source}</span>
              <span className={styles.stars}>{"★".repeat(v.stars)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ViewAnalytics({ d, scale }: { d: PulseSnapshot; scale: number }) {
  const vol = d.weeklyVolume.map((v) => scaleCount(v, scale));

  return (
    <>
      <p className={styles.sectionSub} style={{ marginBottom: 16 }}>
        AI-powered charts · Generated from {scaleCount(d.reviewCount, scale).toLocaleString()}{" "}
        public reviews
      </p>
      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Review volume trend</h3>
          <p className={styles.sectionSub}>Weekly ingest volume · last 5 weeks</p>
          <VolumeChart values={vol} labels={d.volumeLabels} />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Sentiment split</h3>
          <p className={styles.sectionSub}>Positive · negative · neutral</p>
          <DonutChart
            positive={d.sentimentSplit.positive}
            negative={d.sentimentSplit.negative}
            neutral={d.sentimentSplit.neutral}
          />
        </div>
      </div>
      <div className={styles.chartCard}>
        <h3 className={styles.sectionTitle}>Rating distribution</h3>
        <p className={styles.sectionSub}>1–5 star breakdown · clustered automatically</p>
        {d.ratingDistribution.map((count, i) => {
          const stars = i + 1;
          const max = Math.max(...d.ratingDistribution);
          const pct = (count / max) * 100;
          return (
            <div key={stars} className={styles.barRow}>
              <span className={styles.barLabel}>{stars} ★</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>
              <span style={{ width: 40, textAlign: "right", color: "#71717a" }}>
                {scaleCount(count, scale)}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ViewThemes({ d, scale }: { d: PulseSnapshot; scale: number }) {
  return (
    <>
      <p className={styles.sectionSub} style={{ marginBottom: 16 }}>
        Top 5 themed insights — clustered automatically · click to expand
      </p>
      <div className={styles.themeGrid}>
        {d.themeCards.map((t) => (
          <div key={t.id} className={styles.themeCard}>
            <div className={styles.themeCardHead}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{t.title}</div>
                <span className={styles.tagNeg}>Negative</span>
              </div>
              <span className={styles.themePct}>{t.pct}%</span>
            </div>
            <p style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.45, flex: 1 }}>
              {t.description}
            </p>
            <p style={{ fontSize: 12, color: "#71717a", marginTop: 12 }}>
              {scaleCount(t.reviews, scale)} reviews
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <span
                className={t.priority === "Critical" ? styles.tagCrit : styles.tagHigh}
              >
                {t.priority}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
              }}
            >
              <Sparkline values={t.sparkline} />
              <span className={styles.deltaUp}>↑ {t.wowDelta}%</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ViewWeeklyPulse({ d }: { d: PulseSnapshot }) {
  const n = d.weeklyNote;

  return (
    <div className={styles.noteCard}>
      <div className={styles.noteHeader}>
        <div>
          <div className={styles.noteTitle}>
            <span>✦</span> Weekly Pulse Note
          </div>
          <p className={styles.sectionSub} style={{ margin: "6px 0 0" }}>
            Executive one-pager · LLM limit ≤{d.wordLimit} words
          </p>
        </div>
        <div className={styles.noteMeta}>
          <strong>{d.weekCode}</strong>
          <span>
            {d.wordCount} words · AI-generated
          </span>
        </div>
      </div>
      <div className={styles.noteBody}>
        <p>{n.summary}</p>
        <h4>TOP 3 THEMES</h4>
        <ol>
          {n.themes.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <p>{n.tracking}</p>
        <h4>USER QUOTES</h4>
        <ul>
          {n.quotes.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <h4>ACTION IDEAS</h4>
        <ol>
          {n.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </div>
      <p style={{ marginTop: 16, fontSize: 12, color: "#71717a" }}>
        LLM-generated executive summary · PII-safe export · Generated from{" "}
        {d.reviewCount.toLocaleString()} public reviews
      </p>
    </div>
  );
}

export function ViewDelivery({
  d,
  onExportPdf,
}: {
  d: PulseSnapshot;
  onExportPdf: () => void;
}) {
  const email = `To: ${d.emailDraft.to}\nSubject: ${d.emailDraft.subject}\n\n${d.emailDraft.body}`;

  return (
    <>
      <div className={styles.deliveryStatus}>
        <span className={styles.statusItem}>
          <span className={styles.statusDot}>●</span> Gmail — Ready
        </span>
        <span className={styles.statusItem}>
          <span className={styles.statusDot}>●</span> Docs — Ready
        </span>
        <span className={styles.statusItem}>
          <span className={styles.statusDot}>●</span> PDF — Ready
        </span>
        <span className={styles.aiBadgeGreen} style={{ marginLeft: "auto" }}>
          Last pipeline run · 2h ago
        </span>
      </div>
      <p className={styles.sectionSub}>EMAIL DRAFT PREVIEW · AI-generated</p>
      <div className={styles.emailPreview}>{email}</div>
      <div className={styles.deliveryActions}>
        <button type="button" className={styles.btnPrimary}>
          ✉ Draft Email
        </button>
        <button type="button" className={styles.btnGhost}>
          📄 Append to Docs
        </button>
        <button type="button" className={styles.btnGhost} onClick={onExportPdf}>
          ↓ Export PDF
        </button>
      </div>
    </>
  );
}

export const VIEW_SUBTITLES: Record<string, string> = {
  reviews:
    "Review corpus overview, KPIs, word cloud, and PM radar.",
  analytics: "Rating, sentiment, and volume charts.",
  themes: "Top 5 themed insights — click to expand.",
  "weekly-pulse": "Executive one-pager · LLM-generated.",
  delivery: "Email draft preview and export actions.",
};
