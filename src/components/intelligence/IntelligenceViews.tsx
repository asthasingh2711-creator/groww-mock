"use client";

import { useState } from "react";
import { draftFromAnalytics, openGmailCompose } from "@/lib/pulseExport";
import { storeLabel } from "@/lib/reviewAnalytics";
import type {
  ReviewAnalyticsSlice,
  ReviewPlatform,
} from "@/lib/reviewAnalyticsTypes";
import { IconDocument, IconDownload, IconMail } from "@/components/ui/Icons";
import { EmailComposer } from "./EmailComposer";
import { DonutChart, DeltaBadge, Sparkline, VolumeChart } from "./IntelligenceUi";
import styles from "./intelligence.module.css";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedQuote({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(keyword)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={`${part}-${i}`} className={styles.kwHighlight}>
            {part}
          </mark>
        ) : (
          <span key={`${part}-${i}`}>{part}</span>
        ),
      )}
    </>
  );
}

export function ViewReviews({ stats }: { stats: ReviewAnalyticsSlice }) {
  const [kw, setKw] = useState<string | null>(null);
  const reviews = stats.reviewCount;

  return (
    <>
      <div className={styles.alertBanner}>
        <span className={styles.alertIcon} aria-hidden>
          !
        </span>
        <span>
          <strong>Trend alert:</strong> {stats.trendAlert}
        </span>
        <span className={`${styles.aiBadgeGreen} ${styles.alertBannerEnd}`}>
          AI-detected
        </span>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={`${styles.kpiIconBox} ${styles.kpiIconReviews}`}>
              RV
            </span>
            <DeltaBadge value={stats.wowReviewDelta} suffix="%" />
          </div>
          <div className={styles.kpiValue}>{reviews.toLocaleString()}</div>
          <div className={styles.kpiLabel}>Reviews analysed</div>
          <div className={styles.kpiHint}>Public App Store &amp; Play data</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={`${styles.kpiIconBox} ${styles.kpiIconRating}`}>
              ★
            </span>
            <DeltaBadge value={stats.avgRatingDelta} />
          </div>
          <div className={styles.kpiValue}>{stats.avgRating}</div>
          <div className={styles.kpiLabel}>Average rating</div>
          <div className={styles.kpiHint}>Weighted star average</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={`${styles.kpiIconBox} ${styles.kpiIconSentiment}`}>
              +%
            </span>
            <DeltaBadge value={stats.sentimentDelta} suffix="%" />
          </div>
          <div className={styles.kpiValue}>{stats.sentimentScore}%</div>
          <div className={styles.kpiLabel}>Sentiment score</div>
          <div className={styles.kpiHint}>4–5★ positive share</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={`${styles.kpiIconBox} ${styles.kpiIconThemes}`}>
              TH
            </span>
            <span className={styles.deltaFlat}>→ 0</span>
          </div>
          <div className={styles.kpiValue}>{stats.themeCards.length}</div>
          <div className={styles.kpiLabel}>Active themes</div>
          <div className={styles.kpiHint}>Keyword-clustered insights</div>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Trending keywords</h3>
      <p className={styles.sectionSub}>
        Click a keyword to see matching reviews with the term highlighted
      </p>
      <div className={styles.keywordCloud}>
        {(stats.keywordHits?.length
          ? stats.keywordHits
          : stats.keywords.map((word) => ({ keyword: word, count: 0, reviews: [] }))
        ).map((hit, i) => (
          <button
            key={hit.keyword}
            type="button"
            className={`${styles.keyword} ${kw === hit.keyword ? styles.keywordSel : ""} ${
              i % 3 === 0
                ? styles.keywordSm
                : i % 3 === 1
                  ? styles.keywordMd
                  : styles.keywordLg
            }`}
            onClick={() => setKw(kw === hit.keyword ? null : hit.keyword)}
            title={`${hit.count} reviews mention “${hit.keyword}”`}
          >
            {hit.keyword}
            {hit.count > 0 ? (
              <span className={styles.keywordCount}>{hit.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {kw ? (
        <div className={styles.keywordReviewPanel}>
          <h4 className={styles.keywordPanelTitle}>
            Reviews mentioning &ldquo;{kw}&rdquo;
            <span className={styles.keywordPanelMeta}>
              {stats.keywordHits?.find((h) => h.keyword === kw)?.count ?? 0} in
              window · showing up to 5
            </span>
          </h4>
          <div className={styles.keywordReviewList}>
            {(stats.keywordHits?.find((h) => h.keyword === kw)?.reviews ?? []).length >
            0 ? (
              stats.keywordHits
                ?.find((h) => h.keyword === kw)
                ?.reviews.map((v) => (
                  <div key={v.quote.slice(0, 40)} className={styles.keywordReviewCard}>
                    <p className={styles.keywordReviewQuote}>
                      &ldquo;
                      <HighlightedQuote text={v.quote} keyword={kw} />
                      &rdquo;
                    </p>
                    <div className={styles.voiceMeta}>
                      <span>{v.source}</span>
                      <span className={styles.stars}>{"★".repeat(v.stars)}</span>
                    </div>
                  </div>
                ))
            ) : (
              <p className={styles.sectionSub}>No sample reviews for this keyword.</p>
            )}
          </div>
        </div>
      ) : null}

      <h3 className={styles.sectionTitle}>PM Priority Radar</h3>
      <p className={styles.sectionSub}>
        High impact × high frequency — AI-generated executive decision panel
      </p>
      <div className={styles.radarGrid}>
        <div className={styles.radarCol}>
          <h4>HIGH IMPACT (Fix first)</h4>
          {stats.pmRadar.highImpact.map((item) => (
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
          {stats.pmRadar.highFrequency.map((item) => (
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
          {stats.pmRadar.monitor.map((item) => (
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
        {stats.userVoices.map((v) => (
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

export function ViewAnalytics({
  stats,
  platform,
}: {
  stats: ReviewAnalyticsSlice;
  platform: ReviewPlatform | string;
}) {
  const vol = stats.weeklyVolume;
  const ratings = stats.ratingDistribution;
  const reviewTotal = stats.reviewCount;
  return (
    <>
      <p className={styles.leadText}>
        {storeLabel(platform)} · {reviewTotal.toLocaleString()} reviews in window ·
        average {stats.avgRating}★
      </p>
      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Review volume trend</h3>
          <p className={styles.sectionSub}>
            {stats.volumeSubtitle ?? "Review ingest volume"}
          </p>
          <VolumeChart
            key={`vol-${platform}-${stats.reviewCount}-${stats.volumeLabels.join("-")}`}
            values={vol}
            labels={stats.volumeLabels}
          />
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.sectionTitle}>Sentiment split</h3>
          <p className={styles.sectionSub}>
            4–5★ positive · 1–2★ negative · 3★ neutral
          </p>
          <DonutChart
            key={`${platform}-${stats.reviewCount}-${stats.sentimentSplit.positive}-${stats.sentimentSplit.negative}`}
            positive={stats.sentimentSplit.positive}
            negative={stats.sentimentSplit.negative}
            neutral={stats.sentimentSplit.neutral}
          />
        </div>
      </div>
      <div className={styles.chartCard}>
        <h3 className={styles.sectionTitle}>Rating distribution</h3>
        <p className={styles.sectionSub}>1–5 star breakdown from extracted reviews</p>
        {stats.ratingDistribution.map((count, i) => {
          const stars = i + 1;
          const scaled = ratings[i];
          const max = Math.max(...ratings, 1);
          const pct = (scaled / max) * 100;
          return (
            <div key={stars} className={styles.barRow}>
              <span className={styles.barLabel}>{stars} ★</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.barCount}>{scaled}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function ViewThemes({ stats }: { stats: ReviewAnalyticsSlice }) {
  return (
    <>
      <p className={styles.sectionSub} style={{ marginBottom: 16 }}>
        Top themes from CSV review text · keyword-clustered · click to expand
      </p>
      <div className={styles.themeGrid}>
        {stats.themeCards.map((t) => (
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
              {t.reviews} reviews
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

export function ViewWeeklyPulse({ stats }: { stats: ReviewAnalyticsSlice }) {
  const n = stats.weeklyNote;

  return (
    <div className={styles.noteCard}>
      <div className={styles.noteHeader}>
        <div>
          <div className={styles.noteTitle}>
            <span className={styles.noteSparkle} aria-hidden>
              ✦
            </span>
            Weekly Pulse Note
          </div>
          <p className={styles.sectionSub}>
            Executive one-pager · ≤{stats.wordLimit} words
          </p>
        </div>
        <div className={styles.noteMeta}>
          <strong>{stats.weekCode}</strong>
          <span>
            {stats.wordCount} words · CSV-derived
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
      <p className={styles.footnote}>
        Executive summary from public store data ·{" "}
        {stats.reviewCount.toLocaleString()} reviews · {stats.period}
      </p>
    </div>
  );
}

export function ViewDelivery({
  stats,
  adminEmail,
  onAppendDocs,
  onExportPdf,
}: {
  stats: ReviewAnalyticsSlice;
  adminEmail: string;
  onAppendDocs: () => void;
  onExportPdf: (form: import("@/lib/pulseExport").EmailDraftForm) => void;
}) {
  const [showComposer, setShowComposer] = useState(false);
  const initialDraft = draftFromAnalytics(stats, adminEmail);

  return (
    <>
      <div className={styles.deliveryStatus}>
        <span className={styles.statusItem}>
          <span className={`${styles.statusDot} ${styles.statusDotLive}`}>●</span>
          Gmail — Ready
        </span>
        <span className={styles.statusItem}>
          <span className={`${styles.statusDot} ${styles.statusDotLive}`}>●</span>
          Docs — Ready
        </span>
        <span className={styles.statusItem}>
          <span className={`${styles.statusDot} ${styles.statusDotLive}`}>●</span>
          PDF — Email only
        </span>
        <span className={`${styles.aiBadgeGreen} ${styles.alertBannerEnd}`}>
          Pipeline ready
        </span>
      </div>

      {!showComposer ? (
        <>
          <p className={styles.sectionSub}>EMAIL DRAFT PREVIEW · AI-generated</p>
          <div className={styles.emailPreview}>
            <strong>To:</strong> {adminEmail}
            <br />
            <strong>Subject:</strong> {stats.emailDraft.subject}
            <br />
            <br />
            {stats.emailDraft.body}
          </div>
          <div className={styles.deliveryActions}>
            <button
              type="button"
              className={`${styles.btnPrimary} ${styles.btnIcon}`}
              onClick={() => openGmailCompose(initialDraft)}
            >
              <IconMail />
              Send email
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => setShowComposer(true)}
            >
              Edit draft
            </button>
            <button
              type="button"
              className={`${styles.btnGhost} ${styles.btnIcon}`}
              onClick={onAppendDocs}
            >
              <IconDocument />
              Append to Docs
            </button>
            <button
              type="button"
              className={`${styles.btnGhost} ${styles.btnIcon}`}
              onClick={() => onExportPdf(initialDraft)}
            >
              <IconDownload />
              Export PDF
            </button>
          </div>
        </>
      ) : (
        <EmailComposer
          initial={initialDraft}
          onExportPdf={onExportPdf}
          onClose={() => setShowComposer(false)}
        />
      )}
    </>
  );
}

export const VIEW_SUBTITLES: Record<string, string> = {
  reviews:
    "Review corpus overview, KPIs, word cloud, and PM radar.",
  analytics: "Rating, sentiment, and volume charts.",
  themes: "Top 5 themed insights — click to expand.",
  "weekly-pulse": "Executive one-pager · LLM-generated.",
  delivery: "Gmail compose, Docs append, and email PDF export.",
  "export-report": "Full report — reviews, analytics, themes, and pulse.",
};
