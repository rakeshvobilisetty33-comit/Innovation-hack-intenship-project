"use client";

import { create } from "zustand";
import type {
  Activity,
  DashboardStats,
  Priority,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  User,
} from "@/lib/types";
import { projectService } from "@/services/projectService";
import { taskService } from "@/services/taskService";
import { activityService } from "@/services/activityService";
import { userService } from "@/services/userService";
import {
  projects as fallbackProjects,
  tasks as fallbackTasks,
  activities as fallbackActivities,
  teamMembers as fallbackUsers,
} from "@/lib/mock-data";
import { useNotificationStore } from "@/store/notification-store";

// Phase 6 — real REST API backing store. The public method signatures are
// preserved (addProject, updateProject, deleteProject, getProject,
// tasksForProject, addTask, updateTask, setTaskStatus, deleteTask, stats,
// logActivity) so view components don't need to change. Internally the
// mutations now hit /api/projects and /api/tasks; activities are refreshed
// in the background after each mutation since the server logs them.

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
  users: User[];
  hydrated: boolean;
  loading: boolean;
  error: string | null;

  // Hydrate everything from the API in parallel.
  hydrate: (force?: boolean) => Promise<void>;

  // Projects
  addProject: (input: ProjectInput, ownerName?: string) => Promise<Project>;
  updateProject: (id: string, patch: Partial<ProjectInput>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  tasksForProject: (projectId: string) => Task[];

  // Tasks
  addTask: (input: TaskInput, assignedName?: string, projectName?: string) => Promise<Task>;
  updateTask: (id: string, patch: Partial<TaskInput>) => Promise<void>;
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Stats
  stats: () => DashboardStats;
  logActivity: (a: Omit<Activity, "id" | "createdAt">) => void;
}

// Resolve a typed assignee name (or current-user fallback) into a user id
// by looking up the in-memory users cache. Returns null when no match.
function resolveAssigneeId(users: User[], assignedTo?: string): string | null {
  if (!assignedTo) return null;
  const name = assignedTo.trim().toLowerCase();
  if (!name) return null;
  // Exact match first.
  const exact = users.find((u) => u.name.toLowerCase() === name);
  if (exact) return exact.id;
  // Email match (some callers may pass an email).
  const byEmail = users.find((u) => u.email.toLowerCase() === name);
  if (byEmail) return byEmail.id;
  // Substring match (e.g. typed "Alex" matches "Alex Rivera").
  const partial = users.find((u) => u.name.toLowerCase().includes(name));
  if (partial) return partial.id;
  // No match: leave unassigned — the API requires a valid user id.
  return null;
}

export function getActiveUser(): { id: string; name: string; email: string } {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("devflow-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.isAuthenticated && parsed?.state?.user) {
          const u = parsed.state.user;
          return {
            id: u.id || u._id || (u.email ? "user_" + u.email.replace(/[^a-zA-Z0-9]/g, "_") : "guest"),
            name: u.name || "User",
            email: u.email || "",
          };
        }
      }
    } catch {
      // ignore
    }
  }
  return { id: "guest", name: "Guest User", email: "" };
}

export function isDemoUser(user: { id: string; name?: string; email?: string }): boolean {
  return (
    user.id === "user_demo_1" ||
    user.email?.toLowerCase() === "alex.rivera@example.com"
  );
}

export function getUserWorkspaceKey(user?: { id?: string; email?: string } | null): string {
  const active = user || getActiveUser();
  const rawKey = (active.email ? active.email.toLowerCase() : "") || active.id || "guest";
  return `devflow_workspace_${rawKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export function loadUserWorkspace(user?: { id?: string; email?: string } | null): {
  projects?: Project[];
  tasks?: Task[];
  activities?: Activity[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getUserWorkspaceKey(user);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveUserWorkspace(
  data: { projects: Project[]; tasks: Task[]; activities: Activity[] },
  user?: { id?: string; email?: string } | null,
) {
  if (typeof window === "undefined") return;
  try {
    const key = getUserWorkspaceKey(user);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function persistCurrentWorkspace() {
  const { projects, tasks, activities } = useDataStore.getState();
  saveUserWorkspace({ projects, tasks, activities });
}

export const useDataStore = create<DataState>((set, get) => ({
  projects: [],
  tasks: [],
  activities: [],
  users: [],
  hydrated: false,
  loading: false,
  error: null,

  hydrate: async (force?: boolean) => {
    if (!force && (get().hydrated || get().loading)) return;
    set({ loading: true, error: null });
    const activeUser = getActiveUser();
    const isDemo = isDemoUser(activeUser);

    try {
      const [apiProjects, apiTasks, apiActivities, users] = await Promise.all([
        projectService.list().catch(() => null),
        taskService.list().catch(() => null),
        activityService.list({ limit: 30 }).catch(() => null),
        userService.list().catch(() => [] as User[]),
      ]);

      const cached = loadUserWorkspace(activeUser);

      // Projects: use server results if available, otherwise check isolated user cache
      let finalProjects: Project[] = [];
      if (apiProjects !== null) {
        finalProjects = apiProjects;
      } else if (cached?.projects) {
        finalProjects = cached.projects;
      }

      // Tasks: use server results if available, otherwise check isolated user cache
      let finalTasks: Task[] = [];
      if (apiTasks !== null) {
        finalTasks = apiTasks;
      } else if (cached?.tasks) {
        finalTasks = cached.tasks;
      }

      // Activities: use server results if available, otherwise check isolated user cache
      let finalActivities: Activity[] = [];
      if (apiActivities !== null) {
        finalActivities = apiActivities;
      } else if (cached?.activities) {
        finalActivities = cached.activities;
      }

      // STRICT ISOLATION: Only the explicit demo account (alex.rivera@example.com)
      // receives fallback mock data if completely empty.
      // Every other newly created account will be completely empty (0 projects, 0 tasks)!
      if (isDemo && finalProjects.length === 0 && finalTasks.length === 0) {
        finalProjects = fallbackProjects;
        finalTasks = fallbackTasks;
        finalActivities = fallbackActivities;
      }

      const finalUsers = users.length > 0 ? users : fallbackUsers;

      const withMembers = finalProjects.map((p) => ({
        ...p,
        members: computeMembersFromTasks(p, finalTasks),
      }));

      set({
        projects: withMembers,
        tasks: finalTasks,
        activities: finalActivities,
        users: finalUsers,
        hydrated: true,
        loading: false,
        error: null,
      });

      // Persist to user-isolated storage
      saveUserWorkspace(
        {
          projects: withMembers,
          tasks: finalTasks,
          activities: finalActivities,
        },
        activeUser,
      );
    } catch {
      const cached = loadUserWorkspace(activeUser);
      const finalProjects = cached?.projects ?? (isDemo ? fallbackProjects : []);
      const finalTasks = cached?.tasks ?? (isDemo ? fallbackTasks : []);
      const finalActivities = cached?.activities ?? (isDemo ? fallbackActivities : []);

      const withMembers = finalProjects.map((p) => ({
        ...p,
        members: computeMembersFromTasks(p, finalTasks),
      }));

      set({
        projects: withMembers,
        tasks: finalTasks,
        activities: finalActivities,
        users: fallbackUsers,
        loading: false,
        error: null,
        hydrated: true,
      });

      saveUserWorkspace(
        {
          projects: withMembers,
          tasks: finalTasks,
          activities: finalActivities,
        },
        activeUser,
      );
    }
  },

  addProject: async (input, ownerName) => {
    const activeUser = getActiveUser();
    const resolvedOwner = ownerName ?? activeUser.name;

    const localProject: Project = {
      id: "proj_local_" + Date.now(),
      name: input.name,
      description: input.description ?? "",
      owner: activeUser.id,
      ownerName: resolvedOwner,
      status: input.status ?? "planning",
      progress: input.progress ?? 0,
      members: [resolvedOwner],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newAct: Activity = {
      id: "act_local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      user: activeUser.id,
      userName: resolvedOwner,
      action: "created",
      entityType: "project",
      entityId: localProject.id,
      description: `created project “${localProject.name}”`,
      createdAt: new Date().toISOString(),
    };

    useDataStore.setState((s) => ({
      projects: [localProject, ...s.projects],
      activities: [newAct, ...s.activities],
    }));
    persistCurrentWorkspace();

    try {
      useNotificationStore.getState().addNotification({
        title: "Project Created",
        message: `Project “${localProject.name}” has been created.`,
        type: "project",
        targetView: "projects",
        targetId: localProject.id,
      });
    } catch {
      // ignore
    }

    try {
      const created = await projectService.create(input);
      if (created && created.id) {
        const augmented = {
          ...created,
          members: created.ownerName ? [created.ownerName] : [resolvedOwner],
        };
        useDataStore.setState((s) => ({
          projects: s.projects.map((p) => (p.id === localProject.id ? augmented : p)),
        }));
        persistCurrentWorkspace();
      }
    } catch (err) {
      console.warn("[data-store] Server create project failed, kept local project:", err);
    }
    void refreshActivities();
    return localProject;
  },

  updateProject: async (id, patch) => {
    const activeUser = getActiveUser();
    useDataStore.setState((s) => {
      const target = s.projects.find((p) => p.id === id);
      const name = patch.name || target?.name || "project";
      const newAct: Activity = {
        id: "act_local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        user: activeUser.id,
        userName: activeUser.name,
        action: "updated",
        entityType: "project",
        entityId: id,
        description:
          patch.progress !== undefined
            ? `updated progress on “${name}” to ${patch.progress}%`
            : `updated project “${name}”`,
        createdAt: new Date().toISOString(),
      };

      return {
        projects: s.projects.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            ...patch,
            updatedAt: new Date().toISOString(),
          };
        }),
        activities: [newAct, ...s.activities],
      };
    });
    persistCurrentWorkspace();

    try {
      const updated = await projectService.update(id, patch);
      if (updated) {
        useDataStore.setState((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            return { ...updated, members: p.members };
          }),
        }));
        persistCurrentWorkspace();
      }
    } catch (err) {
      console.warn("[data-store] Server update project failed, kept local change:", err);
    }
    void refreshActivities();
  },

  deleteProject: async (id) => {
    const activeUser = getActiveUser();
    useDataStore.setState((s) => {
      const target = s.projects.find((p) => p.id === id);
      const name = target?.name || "project";
      const newAct: Activity = {
        id: "act_local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        user: activeUser.id,
        userName: activeUser.name,
        action: "deleted",
        entityType: "project",
        entityId: id,
        description: `deleted project “${name}”`,
        createdAt: new Date().toISOString(),
      };

      return {
        projects: s.projects.filter((p) => p.id !== id),
        tasks: s.tasks.filter((t) => t.project !== id),
        activities: [newAct, ...s.activities],
      };
    });
    persistCurrentWorkspace();

    try {
      await projectService.remove(id);
    } catch (err) {
      console.warn("[data-store] Server delete project failed, kept local change:", err);
    }
    void refreshActivities();
  },

  getProject: (id) => get().projects.find((p) => p.id === id),

  tasksForProject: (projectId) => get().tasks.filter((t) => t.project === projectId),

  addTask: async (input, assignedName, projectName) => {
    const { users, projects } = get();
    const activeUser = getActiveUser();
    const assigneeId = resolveAssigneeId(users, input.assignedTo);
    const targetProject = projects.find((p) => p.id === input.project);
    const resolvedProjectName = projectName || targetProject?.name || "";
    const resolvedAssigneeName =
      assignedName ||
      users.find((u) => u.id === assigneeId || u.name === input.assignedTo)?.name ||
      input.assignedTo ||
      null;

    const localTask: Task = {
      id: "task_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      title: input.title,
      description: input.description ?? "",
      project: input.project,
      projectName: resolvedProjectName || undefined,
      assignedTo: assigneeId ?? (input.assignedTo ? String(input.assignedTo) : null),
      assignedName: resolvedAssigneeName,
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const taskActivity: Activity = {
      id: "act_local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      user: activeUser.id,
      userName: resolvedAssigneeName || activeUser.name,
      action: "created",
      entityType: "task",
      entityId: localTask.id,
      description: `created task “${localTask.title}”${resolvedProjectName ? ` in ${resolvedProjectName}` : ""}`,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update state immediately!
    useDataStore.setState((s) => {
      const tasks = [localTask, ...s.tasks];
      return {
        tasks,
        activities: [taskActivity, ...s.activities],
        projects: recomputeMembersFor(s.projects, tasks, localTask.project),
      };
    });
    persistCurrentWorkspace();

    try {
      useNotificationStore.getState().addNotification({
        title: "New Task Created",
        message: `“${localTask.title}” was created${resolvedProjectName ? ` in ${resolvedProjectName}` : ""}.`,
        type: "task",
        targetView: "tasks",
        targetId: localTask.id,
      });
    } catch {
      // ignore
    }

    try {
      const created = await taskService.create({
        title: input.title,
        description: input.description ?? "",
        projectId: input.project,
        assigneeId: assigneeId ?? null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
      });
      if (created && created.id) {
        useDataStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === localTask.id
              ? {
                  ...created,
                  projectName: resolvedProjectName || created.projectName,
                  assignedName: resolvedAssigneeName ?? created.assignedName,
                }
              : t,
          ),
        }));
        persistCurrentWorkspace();
      }
    } catch (err) {
      console.warn("[data-store] Server task creation failed, kept optimistic task:", err);
    }

    void refreshActivities();
    return localTask;
  },

  updateTask: async (id, patch) => {
    const { users } = get();
    const activeUser = getActiveUser();
    const assigneeId = resolveAssigneeId(users, patch.assignedTo);

    useDataStore.setState((s) => {
      const old = s.tasks.find((t) => t.id === id);
      const affected = new Set<string>();
      if (old) affected.add(old.project);
      if (patch.project) affected.add(patch.project);

      const tasks = s.tasks.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          ...patch,
          project: patch.project ?? t.project,
          assignedTo: patch.assignedTo ? assigneeId ?? patch.assignedTo : t.assignedTo,
          assignedName: patch.assignedTo ?? t.assignedName,
          updatedAt: new Date().toISOString(),
        };
      });

      let action = "updated";
      let description = `updated task “${patch.title || old?.title || "task"}”`;

      if (patch.status && old && patch.status !== old.status) {
        if (patch.status === "done") {
          action = "completed";
          description = `completed task “${old.title}”`;
        } else {
          action = "updated";
          const statusLabel =
            patch.status === "in-progress"
              ? "In Progress"
              : patch.status === "todo"
              ? "To Do"
              : patch.status;
          description = `moved “${old.title}” to ${statusLabel}`;
        }
      } else if (patch.priority && old && patch.priority !== old.priority) {
        action = "updated";
        const pLabel =
          patch.priority.charAt(0).toUpperCase() + patch.priority.slice(1);
        description = `changed priority of “${old.title}” to ${pLabel}`;
      } else if (patch.title && old && patch.title !== old.title) {
        description = `renamed task “${old.title}” to “${patch.title}”`;
      }

      const newAct: Activity = {
        id: "act_local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        user: activeUser.id,
        userName: old?.assignedName || activeUser.name,
        action,
        entityType: "task",
        entityId: id,
        description,
        createdAt: new Date().toISOString(),
      };

      return {
        tasks,
        activities: [newAct, ...s.activities],
        projects: recomputeMembersForMany(s.projects, tasks, [...affected]),
      };
    });
    persistCurrentWorkspace();

    try {
      useNotificationStore.getState().addNotification({
        title: action === "completed" ? "Task Completed" : "Task Updated",
        message: description,
        type: action === "completed" ? "success" : "info",
        targetView: "tasks",
        targetId: id,
      });
    } catch {
      // ignore
    }

    try {
      const apiPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) apiPatch.title = patch.title;
      if (patch.description !== undefined) apiPatch.description = patch.description;
      if (patch.project !== undefined) apiPatch.projectId = patch.project;
      if (patch.assignedTo !== undefined) {
        apiPatch.assigneeId = assigneeId;
      }
      if (patch.status !== undefined) apiPatch.status = patch.status;
      if (patch.priority !== undefined) apiPatch.priority = patch.priority;
      if (patch.dueDate !== undefined) apiPatch.dueDate = patch.dueDate;
      await taskService.update(id, apiPatch);
    } catch (err) {
      console.warn("[data-store] Server task update failed, kept local change:", err);
    }
    void refreshActivities();
  },

  setTaskStatus: async (id, status) => {
    const activeUser = getActiveUser();

    useDataStore.setState((s) => {
      const task = s.tasks.find((t) => t.id === id);
      const title = task?.title || "task";
      const isDone = status === "done";
      const statusLabel =
        status === "in-progress" ? "In Progress" : status === "todo" ? "To Do" : status;

      const act: Activity = {
        id: "act_local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        user: activeUser.id,
        userName: task?.assignedName || activeUser.name,
        action: isDone ? "completed" : "updated",
        entityType: "task",
        entityId: id,
        description: isDone
          ? `completed task “${title}”`
          : `moved “${title}” to ${statusLabel}`,
        createdAt: new Date().toISOString(),
      };

      return {
        tasks: s.tasks.map((t) =>
          t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t,
        ),
        activities: [act, ...s.activities],
      };
    });
    persistCurrentWorkspace();

    try {
      useNotificationStore.getState().addNotification({
        title: isDone ? "Task Completed" : "Task Status Updated",
        message: isDone ? `“${title}” was marked as completed!` : `“${title}” moved to ${statusLabel}.`,
        type: isDone ? "success" : "task",
        targetView: "tasks",
        targetId: id,
      });
    } catch {
      // ignore
    }

    try {
      await taskService.update(id, { status });
    } catch (err) {
      console.warn("[data-store] Server status update failed, kept local change:", err);
    }
    void refreshActivities();
  },

  deleteTask: async (id) => {
    const activeUser = getActiveUser();
    const prev = get().tasks.find((t) => t.id === id);

    useDataStore.setState((s) => {
      const tasks = s.tasks.filter((t) => t.id !== id);
      const affected = prev ? [prev.project] : [];

      const act: Activity = {
        id: "act_local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        user: activeUser.id,
        userName: activeUser.name,
        action: "deleted",
        entityType: "task",
        entityId: id,
        description: `deleted task “${prev?.title || "task"}”`,
        createdAt: new Date().toISOString(),
      };

      return {
        tasks,
        activities: [act, ...s.activities],
        projects: recomputeMembersForMany(s.projects, tasks, affected),
      };
    });
    persistCurrentWorkspace();

    try {
      await taskService.remove(id);
    } catch (err) {
      console.warn("[data-store] Server task removal failed, kept local removal:", err);
    }
    void refreshActivities();
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
    const completionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
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
    const activeUser = getActiveUser();
    const newAct: Activity = {
      id: "act_local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      user: a.user || activeUser.id,
      userName: a.userName || activeUser.name,
      action: a.action || "updated",
      entityType: a.entityType || "task",
      entityId: a.entityId || "",
      description: a.description || "",
      createdAt: new Date().toISOString(),
    };
    useDataStore.setState((s) => ({
      activities: [newAct, ...s.activities].slice(0, 40),
    }));
    persistCurrentWorkspace();
  },
}));

// Refresh the activity feed in the background after a mutation. Non-fatal.
async function refreshActivities() {
  try {
    const acts = await activityService.list({ limit: 30 });
    if (acts && acts.length > 0) {
      useDataStore.setState((s) => {
        const localOnly = s.activities.filter(
          (a) => a.id.startsWith("act_local_") || !acts.some((srv) => srv.id === a.id),
        );
        const combined = [...localOnly, ...acts];
        const seen = new Set<string>();
        const unique: Activity[] = [];
        for (const item of combined) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        }
        unique.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        return { activities: unique.slice(0, 40) };
      });
      persistCurrentWorkspace();
    }
  } catch {
    // ignore — background refresh
  }
}

// Compute the `members` array for a project from the project owner + the
// unique set of task assignee names. The /api/projects list endpoint does
// not include `members` (only /api/projects/:id does), so the store
// synthesizes it from the loaded tasks to keep the existing views working.
function computeMembersFromTasks(project: Project, allTasks: Task[]): string[] {
  const set = new Set<string>();
  if (project.ownerName) set.add(project.ownerName);
  for (const t of allTasks) {
    if (t.project !== project.id) continue;
    if (t.assignedName) set.add(t.assignedName);
  }
  return [...set];
}

// Recompute members for a single project (by id) — returns a new projects
// array with that one project's `members` updated.
function recomputeMembersFor(
  projects: Project[],
  tasks: Task[],
  projectId: string,
): Project[] {
  return projects.map((p) =>
    p.id === projectId
      ? { ...p, members: computeMembersFromTasks(p, tasks) }
      : p,
  );
}

// Recompute members for multiple projects (by id) — used after task
// mutations that may affect several projects (e.g. moving a task).
function recomputeMembersForMany(
  projects: Project[],
  tasks: Task[],
  projectIds: string[],
): Project[] {
  const affected = new Set(projectIds);
  return projects.map((p) =>
    affected.has(p.id)
      ? { ...p, members: computeMembersFromTasks(p, tasks) }
      : p,
  );
}
