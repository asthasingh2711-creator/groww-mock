import { Suspense } from "react";
import { HomeShell } from "@/components/home/HomeShell";

function HomeFallback() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
        fontWeight: 600,
      }}
    >
      Loading…
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeShell />
    </Suspense>
  );
}
