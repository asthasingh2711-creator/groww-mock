import { Suspense } from "react";
import { PulseShell } from "@/components/pulse/PulseShell";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <PulseShell />
    </Suspense>
  );
}
