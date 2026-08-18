import type { AuthSession } from "@/services/authClient";
import { clearAuthSession, getStoredAuthSession, saveAuthSession } from "@/utils/authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3333/api";

export function getApiBaseUrl() {
  return API_BASE_URL;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

let refreshSessionPromise: Promise<AuthSession | null> | null = null;

export function refreshStoredSession() {
  if (!refreshSessionPromise) {
    refreshSessionPromise = refreshSession().finally(() => {
      refreshSessionPromise = null;
    });
  }
  return refreshSessionPromise;
}

async function refreshSession(): Promise<AuthSession | null> {
  const session = getStoredAuthSession();
  if (!session) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });

    if (!response.ok) {
      if (response.status === 401) clearAuthSession();
      return null;
    }

    const tokens = (await response.json()) as RefreshResponse;
    if (!tokens.access_token || !tokens.refresh_token) return null;

    const refreshedSession = {
      ...session,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
    saveAuthSession(refreshedSession);
    return refreshedSession;
  } catch {
    return null;
  }
}

export async function openProtectedMedia(url: string) {
  const preview = window.open("", "_blank");
  const token = getStoredAuthSession()?.accessToken;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    preview?.close();
    throw new Error("Não foi possível abrir o documento protegido.");
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  if (preview) {
    preview.location.href = objectUrl;
  } else {
    window.open(objectUrl, "_blank", "noopener,noreferrer");
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

interface ApiErrorBody {
  message?: string;
  error?: string;
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  let response = await requestWithAccessToken(path, options);

  if (response.status === 401 && path !== "/auth/refresh") {
    const refreshedSession = await refreshStoredSession();
    if (refreshedSession) {
      response = await requestWithAccessToken(path, options, refreshedSession.accessToken);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }

    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = {};
    }
    throw new Error(body.message ?? body.error ?? "Nao foi possivel concluir a requisicao.");
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

function requestWithAccessToken(path: string, options: RequestInit, accessToken?: string) {
  const token = accessToken ?? getStoredAuthSession()?.accessToken;
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
