// Domain types for DevFlow AI.
// These mirror the Mongoose models (User, Project, Task, Activity) in src/models/index.ts.

export type ProjectStatus = "planning" | "active" | "completed" | "archived";
export type TaskStatus = "todo" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  role?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string; // User id
  ownerName?: string;
  status: ProjectStatus;
  progress: number; // 0-100
  members?: string[]; // user names for display
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project: string; // Project id
  projectName?: string;
  assignedTo: string; // User id or name
  assignedName?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  user: string; // User id
  userName?: string;
  action: string; // e.g. "created", "updated", "completed", "deleted"
  entityType: "project" | "task" | "user" | "ai";
  entityId: string;
  description: string;
  createdAt: string;
}

// Standard API envelope (matches the centralized error-handling contract).
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  overallProgress: number;
  completionRate: number;
}
