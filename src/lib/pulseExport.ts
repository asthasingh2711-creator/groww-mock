import type { PulseSnapshot } from "@/lib/pulseSnapshot";

export type EmailDraftForm = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
};

export function draftFromSnapshot(d: PulseSnapshot, to: string): EmailDraftForm {
  const distro = d.emailDraft.to.trim();
  return {
    to,
    cc: distro && distro.toLowerCase() !== to.toLowerCase() ? distro : "team@groww.in",
    bcc: "pulse-reports@groww.in",
    subject: d.emailDraft.subject,
    body: d.emailDraft.body,
  };
}

export function buildFullReportHtml(d: PulseSnapshot, scale = 1): string {
  const reviews = Math.round(d.reviewCount * scale);
  const themes = d.themeCards
    .map(
      (t) =>
        `<li><strong>${t.title}</strong> (${t.pct}%) — ${t.description} · ${Math.round(t.reviews * scale)} reviews · ↑${t.wowDelta}% WoW</li>`,
    )
    .join("");
  const radar = [
    ...d.pmRadar.highImpact,
    ...d.pmRadar.highFrequency,
    ...d.pmRadar.monitor,
  ]
    .map((r) => `<li>${r.title} (${r.count}) — ${r.description}</li>`)
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Groww Review Report ${d.weekCode}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:24px auto;line-height:1.5;color:#111}
h1{font-size:22px}h2{font-size:16px;margin-top:24px;color:#047857}table{border-collapse:collapse;width:100%}
td,th{border:1px solid #e5e7eb;padding:8px;text-align:left}th{background:#f0fdf4}</style></head><body>
<h1>Groww Review Intelligence — Full Report</h1>
<p><em>AI-generated · PII-safe export · ${d.weekCode} · ${d.period}</em></p>
<h2>Executive summary</h2><p>${d.executiveSummary}</p>
<h2>Reviews overview</h2>
<table><tr><th>Metric</th><th>Value</th></tr>
<tr><td>Reviews analysed</td><td>${reviews.toLocaleString()}</td></tr>
<tr><td>Avg rating</td><td>${d.avgRating}★ (${d.avgRatingDelta} WoW)</td></tr>
<tr><td>Sentiment</td><td>${d.sentimentScore}% (${d.sentimentDelta}% WoW)</td></tr>
<tr><td>Volume delta</td><td>+${d.wowReviewDelta}%</td></tr>
<tr><td>Trend alert</td><td>${d.trendAlert}</td></tr>
</table>
<h2>Top themes</h2><ol>${themes}</ol>
<h2>Weekly pulse</h2><p>${d.weeklyNote.summary}</p>
<ol>${d.weeklyNote.themes.map((t) => `<li>${t}</li>`).join("")}</ol>
<h3>User quotes</h3><ul>${d.weeklyNote.quotes.map((q) => `<li>${q}</li>`).join("")}</ul>
<h3>Action ideas</h3><ol>${d.weeklyNote.actions.map((a) => `<li>${a}</li>`).join("")}</ol>
<h2>PM priority radar</h2><ul>${radar}</ul>
<h2>Keywords</h2><p>${d.keywords.join(", ")}</p>
<p style="margin-top:32px;font-size:12px;color:#6b7280">Generated from ${d.reviewCount.toLocaleString()} public App Store & Play reviews. Clustered automatically.</p>
</body></html>`;
}

export function buildFullReportMarkdown(d: PulseSnapshot): string {
  return `# Groww Review Intelligence — Full Report
**${d.weekCode}** · ${d.period} · AI-generated · PII-safe export

## Executive summary
${d.executiveSummary}

## Reviews
- Reviews analysed: ${d.reviewCount.toLocaleString()}
- Avg rating: ${d.avgRating}★ (${d.avgRatingDelta} WoW)
- Sentiment: ${d.sentimentScore}% (${d.sentimentDelta}% WoW)
- Volume: +${d.wowReviewDelta}% WoW
- Alert: ${d.trendAlert}

## Themes
${d.themeCards.map((t, i) => `${i + 1}. **${t.title}** (${t.pct}%) — ${t.description}`).join("\n")}

## Weekly pulse
${d.weeklyNote.summary}

### Top 3 themes
${d.weeklyNote.themes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

### User quotes
${d.weeklyNote.quotes.map((q) => `- ${q}`).join("\n")}

### Actions
${d.weeklyNote.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

## Analytics
- Rating distribution (1–5★): ${d.ratingDistribution.join(", ")}
- Sentiment split: +${d.sentimentSplit.positive}% / -${d.sentimentSplit.negative}% / neutral ${d.sentimentSplit.neutral}%
- Weekly volume: ${d.volumeLabels.map((l, i) => `${l}:${d.weeklyVolume[i]}`).join(", ")}
`;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function downloadFullReportDoc(d: PulseSnapshot) {
  downloadBlob(
    buildFullReportHtml(d),
    `groww-review-report-${d.weekCode}.doc`,
    "application/msword",
  );
}

export function downloadFullReportMarkdown(d: PulseSnapshot) {
  downloadBlob(
    buildFullReportMarkdown(d),
    `groww-review-report-${d.weekCode}.md`,
    "text/markdown",
  );
}

export function appendToGoogleDocs(d: PulseSnapshot) {
  downloadBlob(
    buildFullReportHtml(d),
    `groww-pulse-append-${d.weekCode}.doc`,
    "application/msword",
  );
  window.open("https://docs.google.com/document/create", "_blank", "noopener,noreferrer");
}

export function openGmailCompose(form: EmailDraftForm) {
  const params = new URLSearchParams();
  if (form.to) params.set("to", form.to);
  if (form.cc) params.set("cc", form.cc);
  if (form.bcc) params.set("bcc", form.bcc);
  if (form.subject) params.set("su", form.subject);
  if (form.body) params.set("body", form.body);
  window.open(
    `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function exportEmailPdf(form: EmailDraftForm) {
  const html = `<!DOCTYPE html><html><head><title>${form.subject}</title>
<style>@page{margin:1in}body{font-family:Georgia,serif;padding:24px;line-height:1.6;color:#111;max-width:640px}
.header{font-size:12px;color:#666;margin-bottom:20px}.field{margin-bottom:12px}</style></head><body>
<div class="header">Groww Weekly Review Pulse — PII-safe export</div>
<div class="field"><strong>To:</strong> ${escapeHtml(form.to)}</div>
${form.cc ? `<div class="field"><strong>CC:</strong> ${escapeHtml(form.cc)}</div>` : ""}
${form.bcc ? `<div class="field"><strong>BCC:</strong> ${escapeHtml(form.bcc)}</div>` : ""}
<div class="field"><strong>Subject:</strong> ${escapeHtml(form.subject)}</div>
<hr/>
<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">${escapeHtml(form.body)}</pre>
</body></html>`;

  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 400);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SCHEDULE_KEY = "pulseEmailSchedule";

export type ScheduleFreq = "none" | "daily" | "weekly" | "monthly";

export function saveEmailSchedule(freq: ScheduleFreq) {
  try {
    sessionStorage.setItem(SCHEDULE_KEY, freq);
  } catch {
    /* ignore */
  }
}

export function readEmailSchedule(): ScheduleFreq {
  try {
    return (sessionStorage.getItem(SCHEDULE_KEY) as ScheduleFreq) || "none";
  } catch {
    return "none";
  }
}
