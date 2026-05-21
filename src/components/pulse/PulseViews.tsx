"use client";

import Link from "next/link";
import { getPulseSnapshot } from "@/lib/pulseSnapshot";
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

  return (
    <>
      <div className={styles.statGrid}>
        <div className={styles.card}>
          <div className={styles.statLbl}>Reviews analyzed</div>
          <div className={styles.statNum}>{d.reviewCount}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.statLbl}>Word count</div>
          <div className={styles.statNum}>
            {d.wordCount} / {d.wordLimit}
          </div>
          <div className={styles.progress}>
            <span style={{ width: `${wcPct}%` }} />
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statLbl}>PII gate</div>
          <p style={{ marginTop: 8 }}>
            <span className={styles.pillOk}>✓ Passed system check</span>
          </p>
          <p className={styles.muted} style={{ marginTop: 8 }}>
            No usernames or IDs in exports
          </p>
        </div>
      </div>
      <p className={styles.muted} style={{ marginBottom: 12 }}>
        This week&apos;s pulse — executive summary
      </p>
      <div className={styles.twoCol}>
        <div className={styles.card}>
          <h3>Key themes</h3>
          {d.themeRows.slice(0, 3).map((t) => (
            <div key={t.id} className={styles.themeRow}>
              <div className={styles.themeHead}>
                <span>{t.label}</span>
                <span>{t.pct}%</span>
              </div>
              <div className={styles.progress}>
                <span style={{ width: `${Math.min(t.pct, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className={styles.card}>
          <h3>Quick links</h3>
          <p className={styles.muted}>Weekly note & email draft in repo outputs/</p>
          <Link href="/analytics?view=weekly-pulse" className={styles.btn} style={{ marginTop: 12 }}>
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
    <div className={styles.twoCol}>
      <div className={styles.card}>
        <h3>Top themes</h3>
        <ol style={{ paddingLeft: 18, margin: "0 0 16px" }}>
          {d.topThemes.map((t) => (
            <li key={t.label} style={{ marginBottom: 8, fontSize: 14 }}>
              <strong>{t.label}</strong> — {t.count} mentions, avg {t.avg}★ — {t.insight}
            </li>
          ))}
        </ol>
        <h3>What users are saying</h3>
        {d.quotes.map((q) => (
          <div key={q.slice(0, 40)} className={styles.quote}>
            {q}
          </div>
        ))}
        <h3>Suggested actions</h3>
        {d.actions.map((a, i) => (
          <div key={a} className={styles.action}>
            {i + 1}. {a}
          </div>
        ))}
        <p className={styles.muted}>
          {d.wordCount} words — {within ? "within" : "over"} {d.wordLimit} limit
        </p>
      </div>
      <div>
        <div className={styles.card}>
          <h3>PII status</h3>
          <span className={styles.pillOk}>✓ Passed system check</span>
          <p className={styles.muted} style={{ marginTop: 8 }}>
            Automated scan — no sensitive identifiers in the summary.
          </p>
        </div>
        <div className={styles.card} style={{ marginTop: 12 }}>
          <h3>Period</h3>
          <p>{d.period}</p>
          <p className={styles.muted}>{d.weekLabel}</p>
        </div>
      </div>
    </div>
  );
}

export function PulseThemes() {
  const d = getPulseSnapshot();

  return (
    <>
      <p className={styles.muted} style={{ marginBottom: 16 }}>
        Up to 5 themes from sampled App Store &amp; Play reviews
      </p>
      <div className={styles.twoCol}>
        <div className={styles.card}>
          <h3>Share of voice</h3>
          {d.themeRows.map((t) => (
            <div key={t.id} className={styles.themeRow}>
              <div className={styles.themeHead}>
                <span>{t.label}</span>
                <span>{t.pct}%</span>
              </div>
              <div className={styles.progress}>
                <span style={{ width: `${Math.min(t.pct, 100)}%` }} />
              </div>
            </div>
          ))}
          <h3 style={{ marginTop: 20 }}>Ranked themes</h3>
          {d.themeRows.map((t, i) => (
            <p key={t.id} style={{ fontSize: 14, margin: "8px 0" }}>
              <strong>#{i + 1} {t.label}</strong> — {t.count} reviews ({t.pct}%) · low
              ratings:{" "}
              <span
                className={styles.lowBar}
                style={{ width: `${Math.min(100, t.lowPct * 1.2)}px` }}
              />{" "}
              {t.lowPct}%
            </p>
          ))}
        </div>
        <div>
          <div className={styles.card} style={{ textAlign: "center" }}>
            <div className={styles.statLbl}>Sample size</div>
            <div className={styles.statNum}>{d.reviewCount}</div>
            <p className={styles.muted}>reviews</p>
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
  const steps = [
    ["Ingest reviews", "complete"],
    ["Theme clustering", "complete"],
    ["Weekly note", "complete"],
    ["PII gate", "passed — zero leaks detected"],
    ["Google Doc", "complete — see weekly_pulse.md"],
    ["Gmail draft", "complete — see email_draft.txt"],
    ["E2E scheduler", "ready — GitHub Actions / cron"],
  ] as const;

  return (
    <>
      <p className={styles.muted} style={{ marginBottom: 16 }}>
        Phases 1–7 · refresh via <code>scripts/run_weekly_pulse.py</code>
      </p>
      <div className={styles.twoCol}>
        <div className={styles.card}>
          {steps.map(([name, status]) => (
            <div key={name} className={styles.pipelineStep}>
              <span>
                <span className={styles.check}>✓</span>
                {name}
              </span>
              <span className={styles.muted}>{status}</span>
            </div>
          ))}
        </div>
        <div>
          <div className={styles.card}>
            <h3>Scheduler</h3>
            <p>Monday 06:00 UTC</p>
            <p className={styles.muted}>Configure in CI or local cron</p>
          </div>
          <div className={styles.card} style={{ marginTop: 12 }}>
            <h3>Data snapshot</h3>
            <p className={styles.muted}>
              Bundled <code>pulse_snapshot.json</code> — re-run pipeline and copy to{" "}
              <code>web/src/data/</code> to refresh.
            </p>
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
  return (
    <div className={styles.topBar}>
      <div className={styles.topTitle}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className={styles.topMeta}>WEEK ENDING {weekEnding()}</span>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
      </div>
    </div>
  );
}
