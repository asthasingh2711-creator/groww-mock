import snapshot from "@/data/pulse_snapshot.json";

export type ThemeRow = {
  id: string;
  label: string;
  count: number;
  pct: number;
  avg: number;
  lowPct: number;
};

export type PulseSnapshot = {
  weekLabel: string;
  period: string;
  reviewCount: number;
  wordCount: number;
  wordLimit: number;
  themeRows: ThemeRow[];
  topThemes: { label: string; count: number; avg: number; insight: string }[];
  quotes: string[];
  actions: string[];
  piiPassed: boolean;
};

export function getPulseSnapshot(): PulseSnapshot {
  return snapshot as PulseSnapshot;
}
