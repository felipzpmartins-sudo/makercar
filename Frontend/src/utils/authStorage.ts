import type { AuthSession } from "@/services/authClient";

const AUTH_SESSION_KEY = "makercar:auth-session";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredAuthSession(): AuthSession | null {
  if (!canUseStorage()) return null;

  try {
    const value = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as AuthSession;
    if (!session.accessToken || !session.refreshToken || !session.user?.email) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.sessionStorage.removeItem("makercar:admin");
}
