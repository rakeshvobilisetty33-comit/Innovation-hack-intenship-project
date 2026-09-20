// User service — thin wrapper over the REST API.

import { api, type ApiError } from "./api";
import type { User } from "@/lib/types";

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

export const userService = {
  async list(): Promise<User[]> {
    try {
      const res = await api.get<Envelope<{ users: User[] }>>("/api/users");
      return res.data.users;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load users"));
    }
  },
};
