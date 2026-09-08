"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";
import { authService } from "@/services/authService";
import { getToken, setToken } from "@/services/api";
import { useDataStore } from "@/store/data-store";

// Phase 6 — real JWT auth backed by the REST API. The store API stays stable
// (same `user`, `token`, `isAuthenticated`, `status`, `error`, `login`,
// `register`, `logout`, `updateProfile`, `clearError`) so the existing view
// components keep working unchanged. A new `hydrate()` action is added for
// app-mount session validation; views don't call it directly.

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "bio" | "role" | "avatar">>) => void;
  clearError: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      status: "idle",
      error: null,
      hydrated: false,

      login: async (email, password) => {
        set({ status: "loading", error: null });
        try {
          const { token, user } = await authService.login(email, password);
          setToken(token);
          // Reset the workspace cache so hydrate() pulls fresh data for the
          // (potentially different) user — guards against cross-user data
          // leakage when switching accounts without a full page reload.
          useDataStore.setState({
            projects: [],
            tasks: [],
            activities: [],
            users: [],
            hydrated: false,
            loading: false,
            error: null,
          });
          set({
            user,
            token,
            isAuthenticated: true,
            status: "authenticated",
            error: null,
          });
          return { ok: true };
        } catch (e) {
          const message = e instanceof Error ? e.message : "Sign in failed.";
          set({ status: "error", error: message });
          return { ok: false, error: message };
        }
      },

      register: async (name, email, password) => {
        set({ status: "loading", error: null });
        try {
          const { token, user } = await authService.register(name, email, password);
          setToken(token);
          useDataStore.setState({
            projects: [],
            tasks: [],
            activities: [],
            users: [],
            hydrated: false,
            loading: false,
            error: null,
          });
          set({
            user,
            token,
            isAuthenticated: true,
            status: "authenticated",
            error: null,
          });
          return { ok: true };
        } catch (e) {
          const message = e instanceof Error ? e.message : "Registration failed.";
          set({ status: "error", error: message });
          return { ok: false, error: message };
        }
      },

      logout: () => {
        // Clear local state immediately so the UI flips to the auth shell
        // without waiting for the network. The server-side logout is
        // best-effort (clears the httpOnly cookie; the JWT is stateless).
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          status: "idle",
          error: null,
        });
        setToken(null);
        // Wipe the cached workspace so the next login starts fresh.
        useDataStore.setState({
          projects: [],
          tasks: [],
          activities: [],
          users: [],
          hydrated: false,
          loading: false,
          error: null,
        });
        void authService.logout();
      },

      updateProfile: (patch) => {
        const current = get().user;
        if (!current) return;
        // Optimistic local update so the UI reflects the change immediately.
        const next = { ...current, ...patch };
        set({ user: next });
        // Fire-and-forget server-side update. On success, replace with the
        // server-returned user (in case of any server-side normalization).
        void authService
          .updateProfile(current.id, patch)
          .then((updated) => {
            // Merge to avoid clobbering fields the server may not return.
            set({ user: { ...next, ...updated } });
          })
          .catch((e) => {
            // Revert on failure so stale UI doesn't lie.
            set({ user: current, error: e instanceof Error ? e.message : null });
          });
      },

      clearError: () => set({ error: null }),

      hydrate: async () => {
        if (get().hydrated) return;
        const token = getToken();
        if (!token) {
          set({ hydrated: true, isAuthenticated: false, user: null, status: "idle" });
          return;
        }
        try {
          const user = await authService.me();
          set({
            user,
            token,
            isAuthenticated: true,
            status: "authenticated",
            error: null,
            hydrated: true,
          });
        } catch {
          // Token is invalid/expired — clear auth and force re-login.
          setToken(null);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            status: "idle",
            error: null,
            hydrated: true,
          });
        }
      },
    }),
    {
      name: "devflow-auth",
      // Only persist user identity + token. Never passwords (we never store
      // them in the browser anyway).
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
