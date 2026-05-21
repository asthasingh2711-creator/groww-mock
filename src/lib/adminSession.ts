const ADMIN_KEY = "demoAdmin";
const ADMIN_EMAIL_KEY = "demoAdminEmail";
const DEFAULT_ADMIN_EMAIL = "admin@groww.in";

export function setAdminSession(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(ADMIN_KEY, "1");
    else {
      sessionStorage.removeItem(ADMIN_KEY);
      sessionStorage.removeItem(ADMIN_EMAIL_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readAdminSession(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminEmail(email: string): void {
  try {
    const trimmed = email.trim();
    if (trimmed) sessionStorage.setItem(ADMIN_EMAIL_KEY, trimmed);
  } catch {
    /* private mode */
  }
}

export function readAdminEmail(): string {
  try {
    return sessionStorage.getItem(ADMIN_EMAIL_KEY) || DEFAULT_ADMIN_EMAIL;
  } catch {
    return DEFAULT_ADMIN_EMAIL;
  }
}

export function clearAdminSession(): void {
  setAdminSession(false);
}
