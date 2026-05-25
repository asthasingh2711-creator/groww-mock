"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import aboutStyles from "@/app/about-us/styles.module.css";
import { TopNav } from "@/components/TopNav";
import { readAdminEmail, readAdminSession } from "@/lib/adminSession";
import { appendToGoogleDocs, exportEmailPdf } from "@/lib/pulseExport";
import { getReviewAnalytics } from "@/lib/reviewAnalytics";
import {
  formatSyncTime,
  getStatsFromFile,
  loadAnalyticsFromSession,
  saveAnalyticsToSession,
} from "@/lib/reviewAnalyticsClient";
import type {
  ReviewAnalyticsFile,
  ReviewAnalyticsSlice,
} from "@/lib/reviewAnalyticsTypes";
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

export function IntelligenceShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = useIsAdmin();
  const adminEmail = useSyncExternalStore(noop, readAdminEmail, () => "admin@groww.in");

  const view = (searchParams.get("view") as TabId) || "reviews";
  const [platform, setPlatform] = useState("all");
  const [range, setRange] = useState("8-12w");
  const [synced, setSynced] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dataThrough, setDataThrough] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const applyFile = useCallback(
    (file: ReviewAnalyticsFile, platformId: string, rangeId: string) => {
      const slice = getStatsFromFile(file, platformId, rangeId);
      setStats(slice);
      const p =
        platformId === "ios" || platformId === "android" ? platformId : "all";
      const anchor = (file[p] as { _anchor?: string } | undefined)?._anchor;
      setDataThrough(anchor ?? slice.dataThrough ?? null);
      setLastSyncedAt(file.syncedAt ?? null);
    },
    [],
  );

  const [stats, setStats] = useState<ReviewAnalyticsSlice>(() => {
    const session = typeof window !== "undefined" ? loadAnalyticsFromSession() : null;
    if (session) return getStatsFromFile(session, platform, range);
    return getReviewAnalytics(platform, range);
  });

  const loadAnalytics = useCallback(async () => {
    const session = loadAnalyticsFromSession();
    if (session?.syncedAt) {
      applyFile(session, platform, range);
      setSynced(true);
      return;
    }
    try {
      const res = await fetch(
        `/api/reviews/analytics?platform=${encodeURIComponent(platform)}&range=${encodeURIComponent(range)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Analytics unavailable");
      const body = (await res.json()) as {
        stats: ReviewAnalyticsSlice;
        dataThrough?: string;
        syncedAt?: string;
      };
      setStats(body.stats);
      setDataThrough(body.dataThrough ?? body.stats.dataThrough ?? null);
      setLastSyncedAt(body.syncedAt ?? null);
      setSynced(true);
    } catch {
      setStats(getReviewAnalytics(platform, range));
      setSynced(true);
    }
  }, [platform, range, applyFile]);

  useEffect(() => {
    if (!isAdmin) router.replace("/?login=1");
  }, [isAdmin, router]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSynced(false);
    try {
      const res = await fetch("/api/reviews/sync", { method: "POST" });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        dataThrough?: string;
        message?: string;
        analytics?: ReviewAnalyticsFile;
      };
      if (!res.ok) {
        showToast(body.error ?? "Sync failed — run scripts locally");
        return;
      }
      if (body.analytics) {
        saveAnalyticsToSession(body.analytics);
        applyFile(body.analytics, platform, range);
      } else {
        await loadAnalytics();
      }
      showToast(
        body.message ??
          `Synced · latest review ${body.dataThrough ?? "—"}`,
      );
    } catch {
      showToast("Sync failed — check server logs or run extract script locally");
    } finally {
      setSyncing(false);
      setSynced(true);
    }
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
                  {synced && !syncing ? (
                    <span className={styles.synced}>Synced</span>
                  ) : null}
                  {syncing ? (
                    <span className={styles.aiBadge}>Syncing…</span>
                  ) : null}
                </div>
                <p className={styles.subtitle}>
                  {VIEW_SUBTITLES[view]} · Signed in as {adminEmail}
                  {lastSyncedAt
                    ? ` · Last sync ${formatSyncTime(lastSyncedAt)}`
                    : ""}
                  {dataThrough ? ` · Latest review ${dataThrough}` : ""}
                </p>
              </div>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? "↻ Syncing…" : "↻ Sync Reviews"}
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
            {view === "reviews" && <ViewReviews stats={stats} />}
            {view === "analytics" && (
              <ViewAnalytics stats={stats} platform={platform} />
            )}
            {view === "themes" && <ViewThemes stats={stats} />}
            {view === "weekly-pulse" && <ViewWeeklyPulse stats={stats} />}
            {view === "delivery" && (
              <ViewDelivery
                stats={stats}
                adminEmail={adminEmail}
                onAppendDocs={() => {
                  appendToGoogleDocs(stats);
                  showToast("Report downloaded — open in Google Docs");
                }}
                onExportPdf={(form) => exportEmailPdf(form)}
              />
            )}
            {view === "export-report" && (
              <ViewExportReport stats={stats} platform={platform} />
            )}
          </div>
        </div>
      </main>

      {toast ? <div className={styles.toast}>✓ {toast}</div> : null}
    </div>
  );
}
