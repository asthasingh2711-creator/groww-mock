"use client";

import { useEffect, useRef } from "react";
import styles from "./GuestConsentModal.module.css";

type Props = {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
};

/**
 * Honest demo gate that fires when someone clicks "Login / Sign up" on the
 * home page.
 *
 * We intentionally do NOT render input fields here. The assignment forbids
 * collecting or storing PII (email, phone, OTP, PAN, Aadhaar, account
 * numbers), and we used to silently route the user into the assistant —
 * which feels like an "auto-login". This dialog replaces that with an
 * explicit, one-click consent: the user sees what the demo is, what is
 * NOT collected, and clicks "Continue as guest" to proceed. No state is
 * persisted on the client or server.
 */
export function GuestConsentModal({ open, onContinue, onCancel }: Props) {
  const continueRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    continueRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-modal-title"
      onClick={onCancel}
    >
      <div
        className={styles.card}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="guest-modal-title" className={styles.title}>
          Continue as guest
        </h2>
        <p className={styles.body}>
          This is a public demo of a Mutual Fund FAQ assistant. There is no
          real login — we don&apos;t collect or store email, phone, OTP, PAN,
          Aadhaar, or any other PII.
        </p>
        <ul className={styles.bullets}>
          <li>Facts-only answers from SBI MF, AMFI, and SEBI pages</li>
          <li>Every reply includes one source citation</li>
          <li>No investment advice or performance comparisons</li>
        </ul>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            ref={continueRef}
            type="button"
            className={styles.primary}
            onClick={onContinue}
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
