// Project service — thin wrapper over the REST API.
// Unwraps `response.data` from the standard envelope and throws on failure.

import { api, type ApiError } from "./api";
import type { Project, Task } from "@/lib/types";

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

export interface ProjectDetail {
  project: Project;
  taskCounts: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  members: string[];
  tasks: Task[];
}

export interface ListParams {
  status?: string;
  search?: string;
}

function errMsg(e: unknown, fallback: string): string {
  const err = e as Partial<ApiError> & { message?: string };
  return err?.message || fallback;
}

function buildQuery(params?: ListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const projectService = {
  async list(params?: ListParams): Promise<Project[]> {
    try {
      const res = await api.get<Envelope<{ projects: Project[] }>>(
        `/api/projects${buildQuery(params)}`,
      );
      return res.data.projects;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load projects"));
    }
  },

  async get(id: string): Promise<ProjectDetail> {
    try {
      const res = await api.get<Envelope<ProjectDetail>>(`/api/projects/${id}`);
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load project"));
    }
  },

  async create(input: {
    name: string;
    description?: string;
    status?: string;
    progress?: number;
  }): Promise<Project> {
    try {
      const res = await api.post<Envelope<{ project: Project }>>(
        "/api/projects",
        input,
      );
      return res.data.project;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to create project"));
    }
  },

  async update(id: string, patch: Partial<{
    name: string;
    description: string;
    status: string;
    progress: number;
  }>): Promise<Project> {
    try {
      const res = await api.put<Envelope<{ project: Project }>>(
        `/api/projects/${id}`,
        patch,
      );
      return res.data.project;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to update project"));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete<Envelope<null>>(`/api/projects/${id}`);
    } catch (e) {
      throw new Error(errMsg(e, "Failed to delete project"));
    }
  },
};
