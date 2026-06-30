import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getApiBaseUrl } from "@/services/apiClient";
import { type AdminRole, type AdminUser, userService } from "@/services/userService";
import { getStoredAuthSession } from "@/utils/authStorage";

export function useAdminUsers(enabled: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(enabled);

  const refreshUsers = useCallback(async () => {
    if (!enabled) return;

    setIsLoadingUsers(true);
    try {
      const [nextUsers, nextRoles] = await Promise.all([userService.list(), userService.roles()]);
      setUsers(nextUsers);
      setRoles(nextRoles);
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

  async function changeUserRole(userId: string, roleId: string) {
    try {
      await userService.updateRole(userId, roleId);
      await refreshUsers();
      toast.success("Perfil do usuario atualizado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel alterar o perfil.");
      return false;
    }
  }

  async function deleteUser(userId: string) {
    try {
      await userService.delete(userId);
      await refreshUsers();
      toast.success("Usuario excluido.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel excluir o usuario.");
      return false;
    }
  }

  async function resetUserPassword(userId: string, password: string) {
    try {
      await userService.updatePassword(userId, password);
      await refreshUsers();
      toast.success("Senha temporaria definida. O usuario devera troca-la no proximo acesso.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel redefinir a senha.");
      return false;
    }
  }

  return {
    users,
    roles,
    isLoadingUsers,
    refreshUsers,
    changeUserRole,
    deleteUser,
    resetUserPassword,
  };
}
