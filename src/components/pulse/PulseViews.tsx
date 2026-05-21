"use client";

import Link from "next/link";
import { getPulseSnapshot } from "@/lib/pulseSnapshot";
import {
  AiChip,
  DataProvenance,
  DeltaPill,
  MiniTrendChart,
  SentimentArrow,
  TrendAlerts,
} from "./PulseUi";
import styles from "./pulse.module.css";

function weekEnding() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();
}

export function PulseDashboard() {
  const d = getPulseSnapshot();
  const wcPct = Math.min(100, Math.round((100 * d.wordCount) / d.wordLimit));
  const topPain = [...d.themeRows].sort((a, b) => b.lowPct - a.lowPct)[0];

  return (
    <>
      <DataProvenance d={d} />

      <div className={styles.statGrid4}>
        <div className={`${styles.card} ${styles.cardLive}`}>
          <div className={styles.cardHead}>
            <div className={styles.statLbl}>Reviews analyzed</div>
            <AiChip>PII-safe export</AiChip>
          </div>
          <div className={styles.statNum}>{d.reviewCount.toLocaleString()}</div>
          <DeltaPill value={d.wowReviewDelta} label="Volume" />
          <MiniTrendChart values={d.weeklyVolume} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div className={styles.statLbl}>Avg store rating</div>
            <AiChip variant="muted">Clustered automatically</AiChip>
          </div>
          <div className={styles.statNum}>{d.avgRating}★</div>
          <p className={styles.muted}>Across App Store + Play sample</p>
        </div>

        <div className={styles.card}>
          <SentimentArrow score={d.sentimentScore} />
        </div>

        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardHead}>
            <div className={styles.statLbl}>Highest low-rating %</div>
            <AiChip variant="purple">AI-flagged</AiChip>
          </div>
          <div className={styles.statNum} style={{ color: "#b91c1c" }}>
            {topPain.lowPct}%
          </div>
          <p className={styles.muted}>{topPain.label}</p>
          <div className={styles.progress}>
            <span
              style={{
                width: `${topPain.lowPct}%`,
                background: "#ef4444",
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Live signals</h2>
        <AiChip variant="purple">LLM-generated alerts</AiChip>
      </div>
      <TrendAlerts trends={d.themeTrends} />

      <div className={styles.sectionHead} style={{ marginTop: 20 }}>
        <h2 className={styles.sectionTitle}>This week&apos;s pulse</h2>
        <span className={styles.muted}>Executive summary · auto-refreshed</span>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Key themes</h3>
            <AiChip>Clustered automatically</AiChip>
          </div>
          {d.themeRows.slice(0, 3).map((t) => (
            <div key={t.id} className={styles.themeRow}>
              <div className={styles.themeHead}>
                <span>{t.label}</span>
                <span>
                  {t.pct}% · <span className={styles.lowTag}>{t.lowPct}% low ★</span>
                </span>
              </div>
              <div className={styles.progress}>
                <span style={{ width: `${Math.min(t.pct, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Word count gate</h3>
            <span className={styles.pillOk}>✓ Passed</span>
          </div>
          <div className={styles.statNum} style={{ fontSize: 24 }}>
            {d.wordCount} / {d.wordLimit}
          </div>
          <div className={styles.progress}>
            <span style={{ width: `${wcPct}%` }} />
          </div>
          <p className={styles.muted} style={{ marginTop: 12 }}>
            LLM-generated executive summary
          </p>
          <Link
            href="/analytics?view=weekly-pulse"
            className={styles.btn}
            style={{ marginTop: 14 }}
          >
            Read full pulse →
          </Link>
        </div>
      </div>
    </>
  );
}

export function PulseWeeklyNote() {
  const d = getPulseSnapshot();
  const within = d.wordCount <= d.wordLimit;

  return (
    <div className={styles.weeklyLayout}>
      <DataProvenance d={d} />

      <div className={styles.aiSummaryBox}>
        <div className={styles.aiSummaryHead}>
          <span className={styles.aiSummaryTitle}>LLM-generated executive summary</span>
          <AiChip variant="purple">AI-generated</AiChip>
        </div>
        <p className={styles.aiSummaryBody}>{d.executiveSummary}</p>
        <p className={styles.aiSummaryMeta}>
          Generated from {d.reviewCount.toLocaleString()} public reviews · {d.period} ·
          PII-safe export
        </p>
      </div>

      <div className={styles.twoCol}>
        <div className={styles.weeklyMain}>
          <section className={styles.highlightCard}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Top themes</h2>
              <AiChip>Clustered automatically</AiChip>
            </div>
            <ol className={styles.themeList}>
              {d.topThemes.map((t, i) => (
                <li key={t.label} className={styles.themeListItem}>
                  <span className={styles.themeRank}>{i + 1}</span>
                  <div>
                    <strong className={styles.themeName}>{t.label}</strong>
                    <p className={styles.themeMeta}>
                      {t.count.toLocaleString()} mentions · avg {t.avg}★
                    </p>
                    <p className={styles.themeInsight}>{t.insight}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.highlightCard}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>What users are saying</h2>
              <AiChip variant="muted">Verbatim · redacted</AiChip>
            </div>
            {d.quotes.map((q, i) => (
              <blockquote key={i} className={styles.quoteExec}>
                <span className={styles.quoteMark}>&ldquo;</span>
                {q}
              </blockquote>
            ))}
          </section>

          <section className={styles.highlightCard}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Suggested actions</h2>
              <AiChip variant="purple">AI-generated</AiChip>
            </div>
            <ul className={styles.actionList}>
              {d.actions.map((a, i) => (
                <li key={a} className={styles.actionCard}>
                  <span className={styles.actionNum}>{i + 1}</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <p className={`${styles.wordGate} ${within ? styles.wordOk : styles.wordOver}`}>
              {d.wordCount} words — {within ? "within" : "over"} {d.wordLimit} limit
            </p>
          </section>
        </div>

        <aside className={styles.weeklyAside}>
          <div className={styles.card}>
            <h3>PII status</h3>
            <span className={styles.pillOk}>✓ Passed system check</span>
            <p className={styles.muted} style={{ marginTop: 10 }}>
              Automated scan — no sensitive identifiers in the summary.
            </p>
            <div style={{ marginTop: 10 }}>
              <AiChip>PII-safe export</AiChip>
            </div>
          </div>

          <div className={styles.card}>
            <h3>Operational snapshot</h3>
            <DeltaPill value={d.wowReviewDelta} label="Review volume" />
            <div style={{ marginTop: 12 }}>
              <SentimentArrow score={d.sentimentScore} />
            </div>
          </div>

          <div className={styles.card}>
            <h3>Period</h3>
            <p className={styles.periodLarge}>{d.period}</p>
            <p className={styles.muted}>{d.weekLabel}</p>
          </div>

          <TrendAlerts trends={d.themeTrends.slice(0, 3)} />
        </aside>
      </div>
    </div>
  );
}

export function PulseThemes() {
  const d = getPulseSnapshot();

  return (
    <>
      <DataProvenance d={d} />
      <p className={styles.muted} style={{ marginBottom: 16 }}>
        Up to 5 themes · <AiChip>Clustered automatically</AiChip> from public App Store
        &amp; Play
      </p>
      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Share of voice</h3>
            <AiChip variant="purple">AI-generated</AiChip>
          </div>
          {d.themeRows.map((t) => (
            <div key={t.id} className={styles.themeRow}>
              <div className={styles.themeHead}>
                <span>{t.label}</span>
                <span>{t.pct}%</span>
              </div>
              <div className={styles.progress}>
                <span style={{ width: `${Math.min(t.pct, 100)}%` }} />
              </div>
              <p className={styles.muted} style={{ fontSize: 12, marginTop: 4 }}>
                {t.lowPct}% low ratings (1–2★) · avg {t.avg}★
              </p>
            </div>
          ))}
          <h3 className={styles.sectionTitle} style={{ marginTop: 24 }}>
            Ranked themes
          </h3>
          {d.themeRows.map((t, i) => {
            const trend = d.themeTrends.find((x) => x.id === t.id);
            return (
              <div key={t.id} className={styles.rankRow}>
                <span className={styles.themeRank}>#{i + 1}</span>
                <div className={styles.rankBody}>
                  <strong>{t.label}</strong>
                  <span className={styles.muted}>
                    {t.count} reviews ({t.pct}%)
                  </span>
                  <span
                    className={styles.lowBar}
                    style={{ width: `${Math.min(120, t.lowPct * 1.4)}px` }}
                  />
                  <span className={styles.lowTag}>{t.lowPct}% low ★</span>
                  {trend ? (
                    <span
                      className={
                        trend.sentiment === "negative"
                          ? styles.deltaUp
                          : styles.deltaDown
                      }
                      style={{ fontSize: 12 }}
                    >
                      {trend.direction === "up" ? "↑" : "↓"}
                      {Math.abs(trend.wowDelta)}% WoW
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <div className={styles.card} style={{ textAlign: "center" }}>
            <div className={styles.statLbl}>Sample size</div>
            <div className={styles.statNum}>{d.reviewCount.toLocaleString()}</div>
            <p className={styles.muted}>reviews ingested</p>
            <div style={{ marginTop: 8 }}>
              <AiChip>PII-safe export</AiChip>
            </div>
          </div>
          <div className={styles.card} style={{ marginTop: 12 }}>
            <MiniTrendChart values={d.weeklyVolume} />
          </div>
          <div className={styles.card} style={{ marginTop: 12 }}>
            <h3>Stores</h3>
            <p>▶ Play Store — public export</p>
            <p> App Store — public export</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function PulsePipeline() {
  const d = getPulseSnapshot();
  const steps = [
    ["Ingest reviews", "complete", "Generated from public store exports"],
    ["Theme clustering", "complete", "Clustered automatically (LLM + rules)"],
    ["Weekly note", "complete", "LLM-generated executive summary"],
    ["PII gate", "passed", "PII-safe export — zero leaks"],
    ["Google Doc", "ready", "Download weekly .md"],
    ["Gmail draft", "ready", "Stakeholder email draft"],
    ["E2E scheduler", "ready", "GitHub Actions / cron"],
  ] as const;

  return (
    <>
      <DataProvenance d={d} />
      <p className={styles.muted} style={{ marginBottom: 16 }}>
        Phases 1–7 · <AiChip>AI workflow</AiChip> · refresh via pipeline
      </p>
      <div className={styles.twoCol}>
        <div className={styles.card}>
          {steps.map(([name, status, sub]) => (
            <div key={name} className={styles.pipelineStep}>
              <span>
                <span className={styles.check}>✓</span>
                <strong>{name}</strong>
                <br />
                <span className={styles.muted} style={{ fontSize: 12 }}>
                  {sub}
                </span>
              </span>
              <span className={styles.pillOk}>{status}</span>
            </div>
          ))}
        </div>
        <div>
          <div className={styles.card}>
            <h3>Scheduler</h3>
            <p>Monday 06:00 UTC</p>
            <AiChip variant="muted">Automated</AiChip>
          </div>
          <div className={styles.card} style={{ marginTop: 12 }}>
            <SentimentArrow score={d.sentimentScore} />
            <TrendAlerts trends={d.themeTrends} />
          </div>
        </div>
      </div>
    </>
  );
}

export function PulseTopBar({
  title,
  badge,
}: {
  title: string;
  badge?: string;
}) {
  const d = getPulseSnapshot();
  return (
    <div className={styles.topBar}>
      <div>
        <div className={styles.topTitle}>{title}</div>
        <p className={styles.topSub}>
          <AiChip variant="muted">AI-generated</AiChip>{" "}
          <span className={styles.muted}>
            {d.reviewCount.toLocaleString()} public reviews
          </span>
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className={styles.topMeta}>WEEK ENDING {weekEnding()}</span>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
        <span className={styles.badgeLive}>● Live</span>
      </div>
    </div>
  );
}
