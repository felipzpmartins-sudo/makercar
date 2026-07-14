import { apiRequest } from "@/services/apiClient";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mustChangePassword: boolean;
  cnhNumber: string | null;
  cnhExpiresAt: string | null;
  cnhPhotoUrl?: string | null;
  cnhStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  department: {
    id: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
  };
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  permissions: string[];
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  permissions: string[];
}

function normalizeAuthResponse(response: AuthResponse): AuthSession {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    user: response.user,
    permissions: response.permissions,
  };
}

export const authClient = {
  async login(data: { email: string; password: string }) {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return normalizeAuthResponse(response);
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    department: string;
    cnhNumber: string;
    cnhExpiresAt: string;
    cnhPhotoDataUrl: string;
  }) {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
        department: data.department,
        cnh_number: data.cnhNumber,
        cnh_expires_at: data.cnhExpiresAt,
        cnh_photo_data_url: data.cnhPhotoDataUrl,
      }),
    });
    return normalizeAuthResponse(response);
  },

  async updateCnh(data: { cnhNumber: string; cnhExpiresAt: string; cnhPhotoDataUrl: string }) {
    return apiRequest<AuthUser>("/auth/cnh", {
      method: "PUT",
      body: JSON.stringify({
        cnh_number: data.cnhNumber,
        cnh_expires_at: data.cnhExpiresAt,
        cnh_photo_data_url: data.cnhPhotoDataUrl,
      }),
    });
  },

  async changePassword(data: { newPassword: string }) {
    const response = await apiRequest<AuthResponse>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ new_password: data.newPassword }),
    });
    return normalizeAuthResponse(response);
  },
};
