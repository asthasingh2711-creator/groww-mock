import { Suspense } from "react";
import { IntelligenceShell } from "@/components/intelligence/IntelligenceShell";

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#0a0a0b",
            color: "#71717a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading intelligence…
        </div>
      }
    >
      <IntelligenceShell />
    </Suspense>
  );
}
