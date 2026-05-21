"use client";

import { useState } from "react";
import {
  openGmailCompose,
  readEmailSchedule,
  saveEmailSchedule,
  type EmailDraftForm,
  type ScheduleFreq,
} from "@/lib/pulseExport";
import styles from "./intelligence.module.css";

type Props = {
  initial: EmailDraftForm;
  onExportPdf: (form: EmailDraftForm) => void;
  onClose: () => void;
};

export function EmailComposer({ initial, onExportPdf, onClose }: Props) {
  const [form, setForm] = useState<EmailDraftForm>(initial);
  const [schedule, setSchedule] = useState<ScheduleFreq>(readEmailSchedule);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const update = (key: keyof EmailDraftForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSend = () => {
    openGmailCompose(form);
  };

  const handleSchedule = () => {
    saveEmailSchedule(schedule);
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 2500);
  };

  return (
    <div className={styles.emailComposer}>
      <div className={styles.emailComposerHead}>
        <div>
          <h3 className={styles.sectionTitle}>Compose in Gmail</h3>
          <p className={styles.sectionSub}>
            Pre-filled from LLM weekly pulse · editable before send
          </p>
        </div>
        <button type="button" className={styles.btnGhost} onClick={onClose}>
          Close
        </button>
      </div>

      <div className={styles.emailForm}>
        <label className={styles.emailLabel}>
          To
          <input
            className={styles.emailInput}
            value={form.to}
            onChange={(e) => update("to", e.target.value)}
            placeholder="recipient@company.com"
          />
        </label>
        <label className={styles.emailLabel}>
          CC
          <input
            className={styles.emailInput}
            value={form.cc}
            onChange={(e) => update("cc", e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className={styles.emailLabel}>
          BCC
          <input
            className={styles.emailInput}
            value={form.bcc}
            onChange={(e) => update("bcc", e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className={styles.emailLabel}>
          Subject
          <input
            className={styles.emailInput}
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
          />
        </label>
        <label className={styles.emailLabel}>
          Message
          <textarea
            className={styles.emailTextarea}
            rows={12}
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
          />
        </label>
      </div>

      <div className={styles.scheduleRow}>
        <span className={styles.filterLabel}>Schedule send (demo)</span>
        {(["none", "daily", "weekly", "monthly"] as const).map((freq) => (
          <button
            key={freq}
            type="button"
            className={`${styles.pill} ${schedule === freq ? styles.pillActive : ""}`}
            onClick={() => setSchedule(freq)}
          >
            {freq === "none" ? "None" : freq.charAt(0).toUpperCase() + freq.slice(1)}
          </button>
        ))}
        <button type="button" className={styles.btnGhost} onClick={handleSchedule}>
          Save schedule
        </button>
        {scheduleSaved ? (
          <span className={styles.scheduleSaved}>✓ Saved — runs {schedule}</span>
        ) : null}
      </div>

      <div className={styles.deliveryActions}>
        <button type="button" className={styles.btnPrimary} onClick={handleSend}>
          ✉ Send Email
        </button>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => onExportPdf(form)}
        >
          ↓ Export email PDF
        </button>
      </div>
      <p className={styles.sectionSub}>
        Send opens Gmail compose with your fields. Scheduling is stored locally for this demo.
      </p>
    </div>
  );
}
