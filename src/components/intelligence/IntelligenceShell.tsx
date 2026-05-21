"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { readAdminSession } from "@/lib/adminSession";
import { getPulseSnapshot } from "@/lib/pulseSnapshot";
import {
  ViewAnalytics,
  ViewDelivery,
  ViewReviews,
  ViewThemes,
  ViewWeeklyPulse,
  VIEW_SUBTITLES,
} from "./IntelligenceViews";
import styles from "./intelligence.module.css";

const TABS = [
  { id: "reviews", label: "Reviews" },
  { id: "analytics", label: "Analytics" },
  { id: "themes", label: "Themes" },
  { id: "weekly-pulse", label: "Weekly Pulse" },
  { id: "delivery", label: "Delivery" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const noop = () => () => {};

function useIsAdmin() {
  return useSyncExternalStore(noop, readAdminSession, () => false);
}

const PLATFORM_SCALE: Record<string, number> = {
  all: 1,
  android: 0.82,
  ios: 0.18,
};

const RANGE_SCALE: Record<string, number> = {
  today: 0.03,
  "7d": 0.12,
  "30d": 0.45,
  "8-12w": 1,
};

export function IntelligenceShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = useIsAdmin();
  const d = getPulseSnapshot();

  const view = (searchParams.get("view") as TabId) || "reviews";
  const [platform, setPlatform] = useState("all");
  const [range, setRange] = useState("8-12w");
  const [synced, setSynced] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const scale = useMemo(
    () => (PLATFORM_SCALE[platform] ?? 1) * (RANGE_SCALE[range] ?? 1),
    [platform, range],
  );

  useEffect(() => {
    if (!isAdmin) router.replace("/?login=1");
  }, [isAdmin, router]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const handleSync = () => {
    setSynced(false);
    setTimeout(() => {
      setSynced(true);
      showToast(`Reviews synced · ${platform} · ${range}`);
    }, 900);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportPulse = () => {
    const blob = new Blob(
      [
        `# Groww Weekly Pulse ${d.weekCode}\n\n${d.weeklyNote.summary}\n\n## Themes\n${d.weeklyNote.themes.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\n## Quotes\n${d.weeklyNote.quotes.map((q) => `- ${q}`).join("\n")}\n\n## Actions\n${d.weeklyNote.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
      ],
      { type: "text/markdown" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `groww-pulse-${d.weekCode}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Pulse exported · PII-safe");
  };

  if (!isAdmin) return null;

  return (
    <div className={styles.wrap}>
      <aside className={styles.sidebar}>
        <div className={styles.sideBrand}>
          <div className={styles.sideBrandSmall}>INTELLIGENCE PRO</div>
          <div className={styles.sideBrandTitle}>Review Analyst</div>
        </div>
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/analytics?view=${t.id}`}
            className={`${styles.sideLink} ${view === t.id ? styles.sideActive : ""}`}
          >
            {t.label}
          </Link>
        ))}
        <Link href="/about-us" className={styles.backLink}>
          ← Back to Groww app
        </Link>
        <div className={styles.sideFooter}>
          <div className={styles.profile}>
            <div className={styles.profileAvatar}>AR</div>
            <div>
              <div className={styles.profileName}>Alex Rivera</div>
              <div className={styles.profilePlan}>Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>Groww Review Intelligence</h1>
                <span className={styles.aiBadge}>AI-POWERED</span>
                {synced ? <span className={styles.synced}>Synced</span> : null}
              </div>
              <p className={styles.subtitle}>
                AI-powered App Review Pulse Dashboard. {VIEW_SUBTITLES[view]}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button type="button" className={styles.btnGhost} onClick={handleSync}>
                ↻ Sync Reviews
              </button>
              <button type="button" className={styles.btnGhost} onClick={handleExportPulse}>
                📄 Export Pulse
              </button>
              <button type="button" className={styles.iconBtn} aria-label="Notifications">
                🔔
              </button>
              <button type="button" className={styles.iconBtn} aria-label="Settings">
                ⚙
              </button>
            </div>
          </div>
          <nav className={styles.tabRow}>
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={`/analytics?view=${t.id}`}
                className={`${styles.tab} ${view === t.id ? styles.tabActive : ""}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>PLATFORM</span>
            {(["all", "android", "ios"] as const).map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.pill} ${platform === p ? styles.pillActive : ""}`}
                onClick={() => setPlatform(p)}
              >
                {p === "all" ? "All" : p === "android" ? "Android" : "iOS"}
              </button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>TIME RANGE</span>
            {(
              [
                ["today", "Today"],
                ["7d", "7 Days"],
                ["30d", "30 Days"],
                ["8-12w", "8-12 Weeks"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`${styles.pill} ${range === id ? styles.pillActive : ""}`}
                onClick={() => setRange(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {view === "reviews" && <ViewReviews d={d} scale={scale} />}
          {view === "analytics" && <ViewAnalytics d={d} scale={scale} />}
          {view === "themes" && <ViewThemes d={d} scale={scale} />}
          {view === "weekly-pulse" && <ViewWeeklyPulse d={d} />}
          {view === "delivery" && (
            <ViewDelivery d={d} onExportPdf={handleExportPdf} />
          )}
        </div>
      </div>

      {toast ? <div className={styles.toast}>✓ {toast}</div> : null}
    </div>
  );
}
