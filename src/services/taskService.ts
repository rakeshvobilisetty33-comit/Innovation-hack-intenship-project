// Task service — thin wrapper over the REST API.

import { api, type ApiError } from "./api";
import type { Task } from "@/lib/types";

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

export interface TaskListParams {
  status?: string;
  priority?: string;
  project?: string;
  search?: string;
  assignee?: string;
}

function errMsg(e: unknown, fallback: string): string {
  const err = e as Partial<ApiError> & { message?: string };
  return err?.message || fallback;
}

function buildQuery(params?: TaskListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.priority) qs.set("priority", params.priority);
  if (params.project) qs.set("project", params.project);
  if (params.search) qs.set("search", params.search);
  if (params.assignee) qs.set("assignee", params.assignee);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const taskService = {
  async list(params?: TaskListParams): Promise<Task[]> {
    try {
      const res = await api.get<Envelope<{ tasks: Task[] }>>(
        `/api/tasks${buildQuery(params)}`,
      );
      return res.data.tasks;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to load tasks"));
    }
  },

  async create(input: {
    title: string;
    description?: string;
    projectId: string;
    assigneeId?: string | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
  }): Promise<Task> {
    try {
      const res = await api.post<Envelope<{ task: Task }>>("/api/tasks", input);
      return res.data.task;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to create task"));
    }
  },

  async update(id: string, patch: Partial<{
    title: string;
    description: string;
    projectId: string;
    assigneeId: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
  }>): Promise<Task> {
    try {
      const res = await api.put<Envelope<{ task: Task }>>(
        `/api/tasks/${id}`,
        patch,
      );
      return res.data.task;
    } catch (e) {
      throw new Error(errMsg(e, "Failed to update task"));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete<Envelope<null>>(`/api/tasks/${id}`);
    } catch (e) {
      throw new Error(errMsg(e, "Failed to delete task"));
    }
  },
};
