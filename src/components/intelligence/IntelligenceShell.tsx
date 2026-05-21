"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import aboutStyles from "@/app/about-us/styles.module.css";
import { TopNav } from "@/components/TopNav";
import { readAdminEmail, readAdminSession } from "@/lib/adminSession";
import { appendToGoogleDocs, exportEmailPdf } from "@/lib/pulseExport";
import { getPulseSnapshot } from "@/lib/pulseSnapshot";
import {
  ViewAnalytics,
  ViewDelivery,
  ViewReviews,
  ViewThemes,
  ViewWeeklyPulse,
  VIEW_SUBTITLES,
} from "./IntelligenceViews";
import { ViewExportReport } from "./ViewExportReport";
import styles from "./intelligence.module.css";

const TABS = [
  { id: "reviews", label: "Reviews" },
  { id: "analytics", label: "Analytics" },
  { id: "themes", label: "Themes" },
  { id: "weekly-pulse", label: "Weekly Pulse" },
  { id: "delivery", label: "Delivery" },
  { id: "export-report", label: "Export Report" },
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
  const adminEmail = useSyncExternalStore(noop, readAdminEmail, () => "admin@groww.in");

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

  if (!isAdmin) return null;

  return (
    <div className={aboutStyles.page}>
      <TopNav />
      <main className={aboutStyles.main}>
        <div className={styles.lightShell}>
          <header className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <div className={styles.titleRow}>
                  <h1 className={styles.title}>Groww Review Intelligence</h1>
                  <span className={styles.aiBadge}>AI-POWERED</span>
                  {synced ? <span className={styles.synced}>Synced</span> : null}
                </div>
                <p className={styles.subtitle}>
                  {VIEW_SUBTITLES[view]} · Signed in as {adminEmail}
                </p>
              </div>
              <div className={styles.headerActions}>
                <button type="button" className={styles.btnGhost} onClick={handleSync}>
                  ↻ Sync Reviews
                </button>
                <Link
                  href="/analytics?view=export-report"
                  className={styles.btnGhost}
                >
                  📄 Export Report
                </Link>
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
            {view === "analytics" && (
              <ViewAnalytics platform={platform} scale={scale} />
            )}
            {view === "themes" && <ViewThemes d={d} scale={scale} />}
            {view === "weekly-pulse" && <ViewWeeklyPulse d={d} />}
            {view === "delivery" && (
              <ViewDelivery
                d={d}
                adminEmail={adminEmail}
                onAppendDocs={() => {
                  appendToGoogleDocs(d);
                  showToast("Report downloaded — open in Google Docs");
                }}
                onExportPdf={(form) => exportEmailPdf(form)}
              />
            )}
            {view === "export-report" && (
              <ViewExportReport d={d} scale={scale} />
            )}
          </div>
        </div>
      </main>

      {toast ? <div className={styles.toast}>✓ {toast}</div> : null}
    </div>
  );
}
