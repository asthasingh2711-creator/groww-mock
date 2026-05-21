import snapshot from "@/data/pulse_snapshot.json";

export type ThemeRow = {
  id: string;
  label: string;
  count: number;
  pct: number;
  avg: number;
  lowPct: number;
};

export type ThemeTrend = {
  id: string;
  label: string;
  wowDelta: number;
  direction: string;
  sentiment: string;
  alert: string;
};

export type ThemeCard = {
  id: string;
  title: string;
  pct: number;
  description: string;
  reviews: number;
  priority: "High" | "Critical";
  lowPct: number;
  wowDelta: number;
  sparkline: number[];
};

export type RadarItem = {
  title: string;
  count: number;
  icon: string;
  severity: "critical" | "warn";
  description: string;
};

export type UserVoice = {
  quote: string;
  source: string;
  stars: number;
};

export type PulseSnapshot = {
  weekCode: string;
  weekLabel: string;
  period: string;
  reviewCount: number;
  wordCount: number;
  wordLimit: number;
  avgRating: number;
  avgRatingDelta: number;
  sentimentScore: number;
  sentimentDelta: number;
  wowReviewDelta: number;
  weeklyVolume: number[];
  volumeLabels: string[];
  ratingDistribution: number[];
  sentimentSplit: { positive: number; negative: number; neutral: number };
  trendAlert: string;
  keywords: string[];
  themeTrends: ThemeTrend[];
  themeCards: ThemeCard[];
  pmRadar: {
    highImpact: RadarItem[];
    highFrequency: RadarItem[];
    monitor: RadarItem[];
  };
  userVoices: UserVoice[];
  weeklyNote: {
    summary: string;
    themes: string[];
    tracking: string;
    quotes: string[];
    actions: string[];
  };
  emailDraft: { to: string; subject: string; body: string };
  themeRows: ThemeRow[];
  topThemes: { label: string; count: number; avg: number; insight: string }[];
  quotes: string[];
  actions: string[];
  executiveSummary: string;
  piiPassed: boolean;
};

export function getPulseSnapshot(): PulseSnapshot {
  return snapshot as PulseSnapshot;
}
