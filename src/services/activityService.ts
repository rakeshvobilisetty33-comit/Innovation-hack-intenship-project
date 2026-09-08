// Activity service — thin wrapper over the REST API.

import { api, type ApiError } from "./api";
import type { Activity } from "@/lib/types";

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

export interface ActivityListParams {
  limit?: number;
  entityType?: string;
}

function errMsg(e: unknown, fallback: string): string {
  const err = e as Partial<ApiError> & { message?: string };
  return err?.message || fallback;
}

function buildQuery(params?: ActivityListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.entityType) qs.set("entityType", params.entityType);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const activityService = {
  async list(params?: ActivityListParams): Promise<Activity[]> {
    try {
      const res = await api.get<Envelope<{ activities: Activity[] }>>(
        `/api/activities${buildQuery(params)}`,
      );
      return res.data.activities;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load activities"));
    }
  },
};
