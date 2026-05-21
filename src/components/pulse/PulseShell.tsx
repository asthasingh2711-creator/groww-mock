"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { readAdminSession } from "@/lib/adminSession";
import { TopNav } from "@/components/TopNav";
import {
  PulseDashboard,
  PulsePipeline,
  PulseThemes,
  PulseTopBar,
  PulseWeeklyNote,
} from "./PulseViews";
import styles from "./pulse.module.css";

const VIEWS = [
  { id: "dashboard", label: "Dashboard", icon: "▣" },
  { id: "weekly-pulse", label: "Weekly Pulse", icon: "◎" },
  { id: "themes", label: "Themes", icon: "◫" },
  { id: "pipeline", label: "Pipeline", icon: "⟳" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

const noop = () => () => {};

function useIsAdmin() {
  return useSyncExternalStore(noop, readAdminSession, () => false);
}

export function PulseShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = useIsAdmin();
  const view = (searchParams.get("view") as ViewId) || "dashboard";

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/?login=1");
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  const titles: Record<ViewId, { title: string; badge?: string }> = {
    dashboard: { title: "Review Pulse", badge: "PII cleared" },
    "weekly-pulse": { title: "Weekly Pulse", badge: "PII cleared" },
    themes: { title: "Review themes" },
    pipeline: { title: "Pipeline status" },
  };

  const { title, badge } = titles[view] ?? titles.dashboard;

  return (
    <>
      <TopNav />
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>G</div>
            <div>
              <div className={styles.brandTitle}>App Reviews</div>
              <div className={styles.brandSub}>Groww Platform</div>
            </div>
          </div>
          <nav className={styles.nav} aria-label="Pulse">
            {VIEWS.map((v) => (
              <Link
                key={v.id}
                href={`/analytics?view=${v.id}`}
                className={`${styles.navLink} ${view === v.id ? styles.navActive : ""}`}
              >
                {v.icon} {v.label}
              </Link>
            ))}
            <Link href="/about-us" className={styles.navLink}>
              ← Back to More
            </Link>
          </nav>
        </aside>
        <div className={styles.main}>
          <PulseTopBar title={title} badge={badge} />
          <div className={styles.content}>
            {view === "dashboard" && <PulseDashboard />}
            {view === "weekly-pulse" && <PulseWeeklyNote />}
            {view === "themes" && <PulseThemes />}
            {view === "pipeline" && <PulsePipeline />}
          </div>
        </div>
      </div>
    </>
  );
}
