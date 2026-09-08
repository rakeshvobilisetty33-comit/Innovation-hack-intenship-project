// Zod schemas shared by API routes (validation) — single source of truth.

import { z } from "zod";

export const PROJECT_STATUSES = ["planning", "active", "completed", "archived"] as const;
export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const ENTITY_TYPES = ["project", "task", "user", "ai"] as const;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(120),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(280).optional().nullable(),
  role: z.string().max(80).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().max(1000).optional().default(""),
  status: z.enum(PROJECT_STATUSES).optional().default("planning"),
  progress: z.number().int().min(0).max(100).optional().default(0),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  description: z.string().max(2000).optional().default(""),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES).optional().default("todo"),
  priority: z.enum(PRIORITIES).optional().default("medium"),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

// Strict body parser: validates and returns data, throws ZodError otherwise.
export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
