import { Suspense } from "react";
import { IntelligenceShell } from "@/components/intelligence/IntelligenceShell";

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "60vh",
            background: "var(--gw-bg)",
            color: "var(--gw-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading analytics…
        </div>
      }
    >
      <IntelligenceShell />
    </Suspense>
  );
}
