import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getApiBaseUrl } from "@/services/apiClient";
import { type AdminRole, type AdminUser, userService } from "@/services/userService";
import { getStoredAuthSession } from "@/utils/authStorage";

export function useAdminUsers(enabled: boolean, canManageUsers: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(enabled);

  const refreshUsers = useCallback(async () => {
    if (!enabled) return;

    setIsLoadingUsers(true);
    try {
      const [nextUsers, nextRoles] = await Promise.all([
        userService.list(),
        canManageUsers ? userService.roles() : Promise.resolve([]),
      ]);
      setUsers(nextUsers);
      setRoles(nextRoles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar usuários.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [canManageUsers, enabled]);

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
      toast.success("Perfil do usuário atualizado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar o perfil.");
      return false;
    }
  }

  async function changeCnhStatus(userId: string, cnhStatus: "PENDING" | "APPROVED" | "REJECTED") {
    try {
      await userService.updateCnhStatus(userId, cnhStatus);
      await refreshUsers();
      toast.success("Status da CNH atualizado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível alterar a CNH.");
      return false;
    }
  }

  async function deleteUser(userId: string) {
    try {
      await userService.delete(userId);
      await refreshUsers();
      toast.success("Usuário excluído.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o usuário.");
      return false;
    }
  }

  async function resetUserPassword(userId: string, password: string) {
    try {
      await userService.updatePassword(userId, password);
      await refreshUsers();
      toast.success("Senha temporária definida. O usuário deverá trocá-la no próximo acesso.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível redefinir a senha.");
      return false;
    }
  }

  return {
    users,
    roles,
    isLoadingUsers,
    refreshUsers,
    changeUserRole,
    changeCnhStatus,
    deleteUser,
    resetUserPassword,
  };
}
