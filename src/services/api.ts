// Frontend API service layer.
// All requests use relative paths so the Caddy gateway can route them.
// In production, set NEXT_PUBLIC_API_URL to the deployed backend origin.
//
// Includes automatic retry for 502/503 (server restarting / gateway timeout)
// and friendly error messages instead of raw HTTP codes.

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

// Friendly messages for common HTTP error codes.
function friendlyMessage(status: number): string | null {
  switch (status) {
    case 502:
    case 503:
      return "The server is starting up. Please wait a moment and try again.";
    case 504:
      return "The request timed out. Please try again.";
    case 500:
      return "A server error occurred. Please try again.";
    case 429:
      return "Too many requests. Please slow down and try again.";
    case 0:
      return "Cannot connect to the server. Is it running?";
    default:
      return null;
  }
}

// Sleep helper for retry delays.
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiFetchInner<T>(
  path: string,
  init: RequestInit,
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
    const friendly = friendlyMessage(res.status);
    const message =
      friendly ||
      (body && (body.message || body.error)) ||
      `Request failed (${res.status})`;
    const err: ApiError = {
      success: false,
      message,
      error: body?.error ?? null,
      status: res.status,
    };
    throw err;
  }
  return body as T;
}

// Public fetch with automatic retry for transient errors (502/503/504).
// The dev server may need to compile a route on first request, which can
// briefly return 502 via the gateway — retrying solves this transparently.
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiFetchInner<T>(path, init);
    } catch (e) {
      lastError = e;
      const status = (e as ApiError)?.status ?? 0;

      // Only retry on gateway/server errors that are likely transient.
      const transient = status === 502 || status === 503 || status === 504 || status === 0;
      if (!transient || attempt === maxRetries) {
        throw e;
      }

      // Exponential backoff: 1s, 2s, 4s.
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  throw lastError;
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
