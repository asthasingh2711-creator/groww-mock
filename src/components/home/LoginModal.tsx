"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LoginModal.module.css";

type Props = {
  open: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

/**
 * Visual replica of the original Groww-style login modal.
 *
 * IMPORTANT — compliance posture:
 *
 *  The assignment forbids accepting or storing PII. This component renders
 *  the email / password fields purely for visual fidelity so the demo
 *  *looks* like the real Groww login a user might expect on a clone, but:
 *
 *    1. Inputs are uncontrolled (`defaultValue`), so React never reads
 *       what the user types into component state.
 *    2. `onSubmit` ignores `FormData` entirely and only calls the
 *       parent's `onSubmit()` callback to route the user to /about-us.
 *    3. No fetch, no localStorage / sessionStorage, no cookies, no
 *       analytics — nothing leaves the browser tab.
 *    4. `autoComplete="off"` so password managers don't quietly persist
 *       anything for the user either.
 *    5. A persistent banner above the form ("Demo only — nothing you
 *       type is saved or sent.") makes the cosmetic nature explicit.
 *
 *  The fields are pre-filled with obviously placeholder values so a user
 *  can click Submit without ever typing a real credential.
 */

const CAROUSEL = ["Stocks", "Mutual Funds", "F&O", "Commodities", "IPOs"];

export function LoginModal({ open, onSubmit, onCancel }: Props) {
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % CAROUSEL.length);
    }, 2200);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    submitRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      onClick={onCancel}
    >
      <div
        className={styles.card}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onCancel}
          aria-label="Close login"
        >
          ×
        </button>

        <aside className={styles.left} aria-hidden="true">
          <div className={styles.pattern} />
          <h3 className={styles.tagline}>
            Simple, Free
            <br />
            Investing.
          </h3>
          <div className={styles.tickerLine} />
          <div className={styles.ticker} key={tickerIndex}>
            {CAROUSEL[tickerIndex]}
          </div>
        </aside>

        <section className={styles.right}>
          <h2 id="login-title" className={styles.title}>
            Welcome Back
          </h2>
          <p className={styles.demoNote}>
            Demo only — nothing you type is saved or sent. Submit to continue.
          </p>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Your Email Address</span>
              <div className={styles.inputWrap}>
                <input
                  type="email"
                  className={styles.input}
                  defaultValue="abc@gmail.com"
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className={styles.pencil} aria-hidden="true">
                  ✎
                </span>
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Enter Password</span>
              <div className={styles.inputWrap}>
                <input
                  type={showPwd ? "text" : "password"}
                  className={styles.input}
                  defaultValue="DemoPass1!"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className={styles.eye}
                  onClick={() => setShowPwd((value) => !value)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
            </label>

            <a
              href="#"
              className={styles.forgot}
              onClick={(event) => event.preventDefault()}
            >
              Forgot Password?
            </a>

            <p className={styles.hint}>
              <span aria-hidden="true">ⓘ </span>
              Password must be min. 8 characters, with uppercase, lowercase,
              number & special characters (@$!%*?&).
            </p>

            <button
              ref={submitRef}
              type="submit"
              className={styles.submit}
            >
              Submit
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
