"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import styles from "./LoginModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
};

const PW_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

/** Typical user@domain.tld shape (aligned with HTML5 email validation). */
const EMAIL_FORMAT =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function LoginModal({ open, onClose, onSuccess }: Props) {
  const titleId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setError(null);
    } else {
      document.body.style.overflow = "";
      setEmail("");
      setPassword("");
      setShowPw(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim();
    if (!em || !EMAIL_FORMAT.test(em)) {
      setError("Use a valid email like username@email.com.");
      return;
    }
    if (!PW_RULE.test(password)) {
      setError(
        "Password must be min. 8 characters, with uppercase, lowercase, number & special characters (!@#$%^&*).",
      );
      return;
    }
    onSuccess(em);
  }

  return (
    <div className={styles.root} role="presentation">
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close login"
        onClick={onClose}
      />
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.split}>
          <div className={styles.left}>
            <div className={styles.leftInner}>
              <p className={styles.leftHead}>Simple, Free Investing.</p>
              <div className={styles.leftFoot}>
                <span className={styles.leftRule} />
                <span className={styles.leftSub}>Commodities</span>
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
            <h2 id={titleId} className={styles.welcome}>
              Welcome Back
            </h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.label} htmlFor="login-email">
                Your Email Address
              </label>
              <div className={styles.fieldRow}>
                <input
                  id="login-email"
                  className={styles.input}
                  type="email"
                  autoComplete="email"
                  placeholder="username@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className={styles.fieldIcon} title="Edit" aria-hidden>
                  ✎
                </span>
              </div>
              <label className={styles.label} htmlFor="login-password">
                Enter Password
              </label>
              <div className={styles.fieldRow}>
                <input
                  id="login-password"
                  className={styles.input}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.eye}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              <button type="button" className={styles.forgot}>
                Forgot Password?
              </button>
              <div className={styles.hintBox}>
                <span className={styles.shield} aria-hidden>
                  🛡
                </span>
                <p>
                  Password must be min. 8 characters, with uppercase,
                  lowercase, number &amp; special characters (!@#$%^&amp;*)
                </p>
              </div>
              {error ? <p className={styles.err}>{error}</p> : null}
              <button type="submit" className={styles.submit}>
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
