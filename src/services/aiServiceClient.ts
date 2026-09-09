"use client";

import { api } from "@/services/api";
import type { Priority } from "@/lib/types";

export interface GeneratedTask {
  title: string;
  description: string;
  priority: Priority;
}

export interface GenerateTasksResult {
  tasks: GeneratedTask[];
  source: "ai" | "heuristic";
}

// Frontend service for AI task generation. Calls the server-side route which
// uses z-ai-web-dev-sdk (the key never reaches the client).
export const aiService = {
  generateTasks(input: {
    prompt: string;
    count?: number;
    projectName?: string;
  }): Promise<GenerateTasksResult> {
    return api.post<import("@/lib/types").ApiResponse<GenerateTasksResult>>(
      "/api/ai/generate-tasks",
      input,
    ).then((res) => res.data);
  },
};
