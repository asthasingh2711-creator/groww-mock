const ADMIN_KEY = "demoAdmin";

export function setAdminSession(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(ADMIN_KEY, "1");
    else sessionStorage.removeItem(ADMIN_KEY);
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

export function clearAdminSession(): void {
  setAdminSession(false);
}
