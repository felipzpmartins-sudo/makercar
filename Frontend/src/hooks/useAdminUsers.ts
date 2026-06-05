import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getApiBaseUrl } from "@/services/apiClient";
import { type AdminUser, userService } from "@/services/userService";
import { getStoredAuthSession } from "@/utils/authStorage";

export function useAdminUsers(enabled: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(enabled);

  const refreshUsers = useCallback(async () => {
    if (!enabled) return;

    setIsLoadingUsers(true);
    try {
      setUsers(await userService.list());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel carregar usuarios.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refreshUsers();
  }, [refreshUsers]);

  useEffect(() => {
    const token = getStoredAuthSession()?.accessToken;
    if (!enabled || !token || typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const events = new EventSource(`${getApiBaseUrl()}/events?token=${encodeURIComponent(token)}`);
    events.addEventListener("users:update", () => {
      void refreshUsers();
    });

    return () => {
      events.close();
    };
  }, [enabled, refreshUsers]);

  return { users, isLoadingUsers, refreshUsers };
}
