import { useEffect, useState } from "react";

import type { AuthSession } from "@/services/authClient";
import { refreshStoredSession } from "@/services/apiClient";
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

    if (!storedSession) return;

    let isActive = true;
    const renewSession = async () => {
      const refreshedSession = await refreshStoredSession();
      if (!isActive || !refreshedSession) return;
      setSession(refreshedSession);
    };

    void renewSession();
    const renewalInterval = window.setInterval(() => void renewSession(), 10 * 60 * 1000);

    return () => {
      isActive = false;
      window.clearInterval(renewalInterval);
    };
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
