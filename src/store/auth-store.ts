"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";
import { demoUser } from "@/lib/mock-data";

// Phase 1 mock auth. In Phase 4+ this is replaced by real JWT auth via
// /api/auth/register, /api/auth/login, /api/auth/me — the store API stays stable.

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  status: "idle" | "loading" | "authenticated" | "error";
  error: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "email" | "bio" | "role" | "avatar">>) => void;
  clearError: () => void;
}

// Very small in-memory "user database" so register then login works in Phase 1.
const localUsers: Record<string, { user: User; password: string }> = {
  [demoUser.email]: { user: demoUser, password: "password" },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      status: "idle",
      error: null,
      login: async (email, password) => {
        set({ status: "loading", error: null });
        await new Promise((r) => setTimeout(r, 550)); // simulate latency
        const record = localUsers[email.toLowerCase()];
        if (!record || record.password !== password) {
          set({ status: "error", error: "Invalid email or password." });
          return { ok: false, error: "Invalid email or password." };
        }
        const token = `mock.${btoa(record.user.id)}.${Date.now()}`;
        set({
          user: record.user,
          token,
          isAuthenticated: true,
          status: "authenticated",
          error: null,
        });
        return { ok: true };
      },
      register: async (name, email, password) => {
        set({ status: "loading", error: null });
        await new Promise((r) => setTimeout(r, 700));
        const key = email.toLowerCase();
        if (localUsers[key]) {
          set({ status: "error", error: "An account with this email already exists." });
          return { ok: false, error: "An account with this email already exists." };
        }
        const user: User = {
          id: `user_${Math.random().toString(36).slice(2, 10)}`,
          name,
          email: key,
          avatar: null,
          bio: null,
          role: "Member",
          createdAt: new Date().toISOString(),
        };
        localUsers[key] = { user, password };
        const token = `mock.${btoa(user.id)}.${Date.now()}`;
        set({ user, token, isAuthenticated: true, status: "authenticated", error: null });
        return { ok: true };
      },
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, status: "idle", error: null }),
      updateProfile: (patch) => {
        const current = get().user;
        if (!current) return;
        const next = { ...current, ...patch };
        if (localUsers[current.email]) localUsers[current.email].user = next;
        set({ user: next });
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: "devflow-auth",
      // Only persist user identity (mock token), never passwords.
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    },
  ),
);
