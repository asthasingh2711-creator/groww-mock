const STORAGE_KEY = "groww_clone_session";

export type GrowwSession = {
  email: string;
};

export function setGrowwSession(session: GrowwSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getGrowwSession(): GrowwSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GrowwSession;
    if (parsed?.email && typeof parsed.email === "string") {
      return { email: parsed.email.trim() };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearGrowwSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
