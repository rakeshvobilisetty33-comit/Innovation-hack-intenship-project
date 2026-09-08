// Dashboard service — thin wrapper over the REST API.

import { api, type ApiError } from "./api";
import type { Activity, DashboardStats, Project } from "@/lib/types";

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  tasksByStatus: Array<{ status: string; count: number }>;
  tasksByPriority: Array<{ priority: string; count: number }>;
  recentActivities: Activity[];
  topProjects: Project[];
}

function errMsg(e: unknown, fallback: string): string {
  const err = e as Partial<ApiError> & { message?: string };
  return err?.message || fallback;
}

export const dashboardService = {
  async get(): Promise<DashboardData> {
    try {
      const res = await api.get<Envelope<DashboardData>>("/api/dashboard");
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load dashboard"));
    }
  },
};
