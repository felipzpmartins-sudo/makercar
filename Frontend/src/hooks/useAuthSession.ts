import { useEffect, useState } from "react";

import type { AuthSession } from "@/services/authClient";
import { clearAuthSession, getStoredAuthSession } from "@/utils/authStorage";

export function useAuthSession({ redirectToLogin = false } = {}) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const storedSession = getStoredAuthSession();
    setSession(storedSession);
    setIsCheckingSession(false);

    if (!storedSession && redirectToLogin) {
      window.location.assign("/login");
    }
  }, [redirectToLogin]);

  function logout() {
    clearAuthSession();
    setSession(null);
    window.location.assign("/login");
  }

  return {
    session,
    isCheckingSession,
    logout,
  };
}
