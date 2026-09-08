// Frontend API service layer.
// Phase 1: this is a thin foundation. Phase 6+ will implement authService,
// projectService, taskService, aiService on top of this client using TanStack Query.
//
// All requests use relative paths so the Caddy gateway can route them.
// In production, set NEXT_PUBLIC_API_URL to the deployed backend origin.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN_KEY = "devflow.auth.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  success: false;
  message: string;
  error?: string | null;
  status?: number;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      (body && (body.message || body.error)) || `Request failed (${res.status})`;
    const err: ApiError = { success: false, message, error: body?.error ?? null, status: res.status };
    throw err;
  }
  return body as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, data?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: "POST", body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: "PUT", body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, { ...init, method: "PATCH", body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: "DELETE" }),
};
