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
  hydrate: () => Promise<void>;

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

export const useDataStore = create<DataState>((set, get) => ({
  projects: [],
  tasks: [],
  activities: [],
  users: [],
  hydrated: false,
  loading: false,
  error: null,

  hydrate: async () => {
    if (get().hydrated || get().loading) return;
    set({ loading: true, error: null });
    try {
      const [projects, tasks, activities, users] = await Promise.all([
        projectService.list(),
        taskService.list(),
        activityService.list({ limit: 30 }),
        userService.list().catch(() => [] as User[]),
      ]);
      // Augment each project with a `members` list computed from the
      // owner's name + the unique set of task assignee names. The list API
      // doesn't return members (only the detail API does), but the views
      // read `project.members` directly — so we synthesize it here to
      // avoid touching the views.
      const withMembers = projects.map((p) => ({
        ...p,
        members: computeMembersFromTasks(p, tasks),
      }));
      set({
        projects: withMembers,
        tasks,
        activities,
        users,
        hydrated: true,
        loading: false,
        error: null,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load workspace data",
        hydrated: true,
      });
    }
  },

  addProject: async (input, _ownerName) => {
    const created = await projectService.create(input);
    // New project has no tasks yet, so members is just the owner.
    const augmented = { ...created, members: created.ownerName ? [created.ownerName] : [] };
    useDataStore.setState((s) => ({ projects: [augmented, ...s.projects] }));
    void refreshActivities();
    return augmented;
  },

  updateProject: async (id, patch) => {
    const updated = await projectService.update(id, patch);
    useDataStore.setState((s) => ({
      projects: s.projects.map((p) => {
        if (p.id !== id) return p;
        // Preserve the existing members list — it's a frontend-only
        // augmentation derived from tasks (see hydrate()). The API does
        // not return it on PUT.
        return { ...updated, members: p.members };
      }),
    }));
    void refreshActivities();
  },

  deleteProject: async (id) => {
    await projectService.remove(id);
    useDataStore.setState((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.project !== id),
    }));
    void refreshActivities();
  },

  getProject: (id) => get().projects.find((p) => p.id === id),

  tasksForProject: (projectId) => get().tasks.filter((t) => t.project === projectId),

  addTask: async (input, _assignedName, _projectName) => {
    const { users } = get();
    const assigneeId = resolveAssigneeId(users, input.assignedTo);
    const created = await taskService.create({
      title: input.title,
      description: input.description ?? "",
      projectId: input.project,
      assigneeId: assigneeId ?? null,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
    });
    useDataStore.setState((s) => {
      const tasks = [created, ...s.tasks];
      return {
        tasks,
        projects: recomputeMembersFor(s.projects, tasks, created.project),
      };
    });
    void refreshActivities();
    return created;
  },

  updateTask: async (id, patch) => {
    const { users } = get();
    const apiPatch: Record<string, unknown> = {};
    if (patch.title !== undefined) apiPatch.title = patch.title;
    if (patch.description !== undefined) apiPatch.description = patch.description;
    if (patch.project !== undefined) apiPatch.projectId = patch.project;
    if (patch.assignedTo !== undefined) {
      apiPatch.assigneeId = resolveAssigneeId(users, patch.assignedTo);
    }
    if (patch.status !== undefined) apiPatch.status = patch.status;
    if (patch.priority !== undefined) apiPatch.priority = patch.priority;
    if (patch.dueDate !== undefined) apiPatch.dueDate = patch.dueDate;
    const updated = await taskService.update(id, apiPatch);
    useDataStore.setState((s) => {
      // If the task moved projects, recompute members for both old and new.
      const old = s.tasks.find((t) => t.id === id);
      const affected = new Set<string>();
      if (old) affected.add(old.project);
      affected.add(updated.project);
      const tasks = s.tasks.map((t) => (t.id === id ? updated : t));
      return {
        tasks,
        projects: recomputeMembersForMany(s.projects, tasks, [...affected]),
      };
    });
    void refreshActivities();
  },

  setTaskStatus: async (id, status) => {
    const updated = await taskService.update(id, { status });
    useDataStore.setState((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
    }));
    void refreshActivities();
  },

  deleteTask: async (id) => {
    const prev = get().tasks.find((t) => t.id === id);
    await taskService.remove(id);
    useDataStore.setState((s) => {
      const tasks = s.tasks.filter((t) => t.id !== id);
      const affected = prev ? [prev.project] : [];
      return {
        tasks,
        projects: recomputeMembersForMany(s.projects, tasks, affected),
      };
    });
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

  // The server logs activities on every mutation; this is a no-op kept for
  // view compatibility (older code paths may still call it).
  logActivity: () => {
    /* no-op — activities come from /api/activities */
  },
}));

// Refresh the activity feed in the background after a mutation. Non-fatal.
async function refreshActivities() {
  try {
    const acts = await activityService.list({ limit: 30 });
    useDataStore.setState({ activities: acts });
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
