import { apiRequest } from "@/services/apiClient";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
  };
}

export interface AdminRole {
  id: string;
  name: string;
}

export const userService = {
  list() {
    return apiRequest<AdminUser[]>("/users");
  },

  roles() {
    return apiRequest<AdminRole[]>("/roles");
  },

  updateRole(userId: string, roleId: string) {
    return apiRequest<AdminUser>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ role_id: roleId }),
    });
  },

  updatePassword(userId: string, password: string) {
    return apiRequest<AdminUser>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
  },

  delete(userId: string) {
    return apiRequest<AdminUser>(`/users/${userId}`, {
      method: "DELETE",
    });
  },
};
