// Thin service layer over the REST API.
// Each function unwraps `response.data` from the standard envelope
// { success, message, data, error } returned by every route, and throws
// an Error with the server-provided message on failure (the underlying
// `apiFetch` already throws ApiError for non-2xx).

import { api, setToken, type ApiError } from "./api";
import type { User } from "@/lib/types";

// Server-side envelope shape.
interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

function errMsg(e: unknown, fallback: string): string {
  const err = e as Partial<ApiError> & { message?: string };
  return err?.message || fallback;
}

export interface AuthResult {
  token: string;
  user: User;
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResult> {
    try {
      const res = await api.post<Envelope<AuthResult>>("/api/auth/register", {
        name,
        email,
        password,
      });
      setToken(res.data.token);
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Registration failed"));
    }
  },

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const res = await api.post<Envelope<AuthResult>>("/api/auth/login", {
        email,
        password,
      });
      setToken(res.data.token);
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Invalid email or password"));
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post<Envelope<null>>("/api/auth/logout", {});
    } catch {
      // Best-effort — the server side just clears the cookie; we always
      // clear the local token regardless.
    } finally {
      setToken(null);
    }
  },

  async me(): Promise<User> {
    try {
      const res = await api.get<Envelope<{ user: User }>>("/api/auth/me");
      return res.data.user;
    } catch (e) {
      throw new Error(errMsg(e, "Session expired"));
    }
  },

  async updateProfile(
    id: string,
    patch: Partial<Pick<User, "name" | "email" | "bio" | "role" | "avatar">>,
  ): Promise<User> {
    try {
      const res = await api.put<Envelope<{ user: User }>>(`/api/users/${id}`, patch);
      return res.data.user;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to update profile"));
    }
  },

  async deleteAccount(id: string): Promise<void> {
    try {
      await api.delete<Envelope<null>>(`/api/users/${id}`);
      setToken(null);
    } catch (e) {
      throw new Error(errMsg(e, "Failed to delete account"));
    }
  },
};
