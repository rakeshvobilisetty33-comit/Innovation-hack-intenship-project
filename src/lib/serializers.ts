// Serializers map Mongoose lean docs to the API response shape the frontend expects.
// Activity logger is centralized here for use by mutation routes.

import { connectDB } from "@/lib/db";
import { Activity } from "@/models";
import type { LeanDocument } from "mongoose";

type UserDoc = {
  _id: { toString(): string };
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  role?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectDoc = {
  _id: { toString(): string };
  name: string;
  description: string;
  ownerId: { toString(): string };
  status: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  owner?: UserDoc | null;
};

type TaskDoc = {
  _id: { toString(): string };
  title: string;
  description: string;
  projectId: { toString(): string };
  assigneeId: { toString(): string } | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: { name: string } | null;
  assignee?: { name: string } | null;
};

type ActivityDoc = {
  _id: { toString(): string };
  userId: { toString(): string };
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: Date;
  user?: { name: string } | null;
};

function id(v: { toString(): string } | string): string {
  return typeof v === "string" ? v : v.toString();
}

export function serializeUser(user: UserDoc) {
  return {
    id: id(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    bio: user.bio ?? null,
    role: user.role ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function serializeProject(project: ProjectDoc) {
  return {
    id: id(project._id),
    name: project.name,
    description: project.description,
    owner: id(project.ownerId),
    ownerName: project.owner?.name ?? null,
    status: project.status,
    progress: project.progress,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

// Members computed from owner + unique task assignees.
export function computeMembers(
  owner: { name: string } | null | undefined,
  tasks: { assignee: { name: string } | null }[],
): string[] {
  const set = new Set<string>();
  if (owner?.name) set.add(owner.name);
  for (const t of tasks) if (t.assignee?.name) set.add(t.assignee.name);
  return [...set];
}

export function serializeTask(task: TaskDoc) {
  return {
    id: id(task._id),
    title: task.title,
    description: task.description,
    project: id(task.projectId),
    projectName: task.project?.name ?? null,
    assignedTo: task.assigneeId ? id(task.assigneeId) : "unassigned",
    assignedName: task.assignee?.name ?? null,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function serializeActivity(activity: ActivityDoc) {
  return {
    id: id(activity._id),
    user: id(activity.userId),
    userName: activity.user?.name ?? null,
    action: activity.action,
    entityType: activity.entityType,
    entityId: activity.entityId,
    description: activity.description,
    createdAt: activity.createdAt.toISOString(),
  };
}

// Centralized activity logging used by mutation routes. Non-fatal.
export async function logActivity(input: {
  userId: string;
  action: string;
  entityType: "project" | "task" | "user" | "ai";
  entityId: string;
  description: string;
}) {
  try {
    await connectDB();
    return await Activity.create(input);
  } catch {
    return null;
  }
}
