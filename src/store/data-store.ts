"use client";

import { create } from "zustand";
import type { Activity, DashboardStats, Priority, Project, ProjectStatus, Task, TaskStatus } from "@/lib/types";
import { activities as seedActivities, projects as seedProjects, tasks as seedTasks } from "@/lib/mock-data";

// Phase 1 in-memory data store (mock). Phase 6 swaps these internals to
// TanStack Query hitting /api/projects and /api/tasks — the method signatures
// stay async-compatible so the UI components don't change.

export interface ProjectInput {
  name: string;
  description: string;
  status?: ProjectStatus;
  progress?: number;
}
export interface TaskInput {
  title: string;
  description?: string;
  project: string;
  assignedTo?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
}

interface DataState {
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  hydrated: boolean;

  // Projects
  addProject: (input: ProjectInput, ownerName?: string) => Project;
  updateProject: (id: string, patch: Partial<ProjectInput>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  tasksForProject: (projectId: string) => Task[];

  // Tasks
  addTask: (input: TaskInput, assignedName?: string, projectName?: string) => Task;
  updateTask: (id: string, patch: Partial<TaskInput>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;

  // Stats
  stats: () => DashboardStats;
  logActivity: (a: Omit<Activity, "id" | "createdAt">) => void;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const useDataStore = create<DataState>((set, get) => ({
  projects: seedProjects,
  tasks: seedTasks,
  activities: seedActivities,
  hydrated: true,

  addProject: (input, ownerName) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uid("proj"),
      name: input.name,
      description: input.description,
      owner: "user_demo_1",
      ownerName: ownerName ?? "Alex Rivera",
      status: input.status ?? "planning",
      progress: input.progress ?? 0,
      members: [ownerName ?? "Alex Rivera"],
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ projects: [project, ...s.projects] }));
    get().logActivity({
      user: "user_demo_1",
      userName: ownerName ?? "Alex Rivera",
      action: "created",
      entityType: "project",
      entityId: project.id,
      description: `created project “${project.name}”`,
    });
    return project;
  },

  updateProject: (id, patch) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    }));
    const p = get().getProject(id);
    if (p) {
      get().logActivity({
        user: "user_demo_1",
        userName: "Alex Rivera",
        action: "updated",
        entityType: "project",
        entityId: id,
        description: `updated project “${p.name}”`,
      });
    }
  },

  deleteProject: (id) => {
    const p = get().getProject(id);
    set((s) => ({
      projects: s.projects.filter((x) => x.id !== id),
      tasks: s.tasks.filter((t) => t.project !== id),
    }));
    if (p) {
      get().logActivity({
        user: "user_demo_1",
        userName: "Alex Rivera",
        action: "deleted",
        entityType: "project",
        entityId: id,
        description: `deleted project “${p.name}”`,
      });
    }
  },

  getProject: (id) => get().projects.find((p) => p.id === id),
  tasksForProject: (projectId) => get().tasks.filter((t) => t.project === projectId),

  addTask: (input, assignedName, projectName) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: uid("task"),
      title: input.title,
      description: input.description ?? "",
      project: input.project,
      projectName:
        projectName ?? get().getProject(input.project)?.name ?? "Unassigned",
      assignedTo: input.assignedTo ?? "user_demo_1",
      assignedName: assignedName ?? "Alex Rivera",
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ tasks: [task, ...s.tasks] }));
    get().logActivity({
      user: "user_demo_1",
      userName: "Alex Rivera",
      action: "created",
      entityType: "task",
      entityId: task.id,
      description: `created task “${task.title}”`,
    });
    return task;
  },

  updateTask: (id, patch) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      ),
    }));
    const t = get().tasks.find((x) => x.id === id);
    if (t) {
      get().logActivity({
        user: "user_demo_1",
        userName: "Alex Rivera",
        action: "updated",
        entityType: "task",
        entityId: id,
        description: `updated task “${t.title}”`,
      });
    }
  },

  setTaskStatus: (id, status) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t,
      ),
    }));
    const t = get().tasks.find((x) => x.id === id);
    if (t) {
      const verb = status === "done" ? "completed" : "moved";
      const detail = status === "done" ? "" : ` to ${status.replace("-", " ")}`;
      get().logActivity({
        user: "user_demo_1",
        userName: "Alex Rivera",
        action: status === "done" ? "completed" : "updated",
        entityType: "task",
        entityId: id,
        description: `${verb} “${t.title}”${detail}`,
      });
    }
  },

  deleteTask: (id) => {
    const t = get().tasks.find((x) => x.id === id);
    set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }));
    if (t) {
      get().logActivity({
        user: "user_demo_1",
        userName: "Alex Rivera",
        action: "deleted",
        entityType: "task",
        entityId: id,
        description: `deleted task “${t.title}”`,
      });
    }
  },

  stats: () => {
    const { projects, tasks } = get();
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const completedProjects = projects.filter((p) => p.status === "completed").length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(
      (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate).getTime() < Date.now(),
    ).length;
    const overallProgress =
      totalProjects === 0
        ? 0
        : Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / totalProjects);
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      overallProgress,
      completionRate,
    };
  },

  logActivity: (a) => {
    const activity: Activity = {
      ...a,
      id: uid("act"),
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ activities: [activity, ...s.activities].slice(0, 60) }));
  },
}));
