import { apiRequest } from "@/services/apiClient";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
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

export const userService = {
  list() {
    return apiRequest<AdminUser[]>("/users");
  },
};
