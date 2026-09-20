// Tasks API — single task: GET / PUT / DELETE.
// Ownership is derived via the task's project ownerId.
// Server-only Route Handlers (no 'use client').

import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import type { ZodError } from "zod";

import { connectDB } from "@/lib/db";
import { Project, Task } from "@/models";
import {
  ok,
  err,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { updateTaskSchema, parseBody } from "@/lib/schemas";
import { serializeTask, logActivity } from "@/lib/serializers";

/**
 * Adapt a populated Mongoose lean task into the shape serializeTask expects.
 * (See src/app/api/tasks/route.ts for the full rationale.)
 */
function adaptTaskForSerialize(t: any) {
  const projectDoc = t?.projectId;
  const assigneeDoc = t?.assigneeId;
  const projectId =
    projectDoc && typeof projectDoc === "object" && "_id" in projectDoc
      ? projectDoc._id
      : projectDoc;
  const assigneeId =
    assigneeDoc && typeof assigneeDoc === "object" && "_id" in assigneeDoc
      ? assigneeDoc._id
      : assigneeDoc;
  return {
    ...t,
    projectId,
    project:
      projectDoc && typeof projectDoc === "object" && "name" in projectDoc
        ? projectDoc
        : null,
    assigneeId,
    assignee:
      assigneeDoc && typeof assigneeDoc === "object" && "name" in assigneeDoc
        ? assigneeDoc
        : null,
  };
}

// Resolve a populated task's projectId (populated doc → underlying _id; otherwise raw id).
function projectIdOf(task: any) {
  const p = task?.projectId;
  if (p && typeof p === "object" && "_id" in p) return p._id;
  return p;
}

type OwnedTaskResult =
  | { ok: true; task: any }
  | { ok: false; code: "invalid" | "notfound" | "forbidden" };

// Fetch the task, populate project + assignee, verify the user owns the project.
async function getOwnedTask(id: string, user: { _id: any }): Promise<OwnedTaskResult> {
  if (!mongoose.isValidObjectId(id)) return { ok: false, code: "invalid" };
  const task = await Task.findById(id)
    .populate([
      { path: "projectId", select: "name" },
      { path: "assigneeId", select: "name" },
    ])
    .lean();
  if (!task) return { ok: false, code: "notfound" };
  const project = await Project.findById(projectIdOf(task)).lean();
  if (!project || String(project.ownerId) !== String(user._id)) {
    return { ok: false, code: "forbidden" };
  }
  return { ok: true, task };
}

// ── GET /api/tasks/[id] ────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();
    const { id } = await params;

    const result = await getOwnedTask(id, user);
    if (!result.ok) {
      if (result.code === "forbidden") return forbidden();
      return notFound("Task not found");
    }
    const serialized = serializeTask(adaptTaskForSerialize(result.task));
    return ok({ task: serialized }, "Task fetched");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed to fetch task");
  }
}

// ── PUT /api/tasks/[id] ─────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) return notFound("Task not found");

    // Fetch existing task to check ownership BEFORE applying the update.
    const existing = await Task.findById(id).lean();
    if (!existing) return notFound("Task not found");
    const project = await Project.findById(existing.projectId).lean();
    if (!project || String(project.ownerId) !== String(user._id)) {
      return forbidden();
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400, "invalid_json");
    }

    let parsed;
    try {
      parsed = parseBody(updateTaskSchema, body);
    } catch (e) {
      return validationError(e as ZodError);
    }

    const update: Record<string, any> = {};
    if (parsed.title !== undefined) update.title = parsed.title;
    if (parsed.description !== undefined) update.description = parsed.description;
    if (parsed.projectId !== undefined) {
      // If moving to a different project, the user must own the new project.
      const newProject = await Project.findById(parsed.projectId).lean();
      if (!newProject) return notFound("Project not found");
      if (String(newProject.ownerId) !== String(user._id)) {
        return forbidden("You don't have access to this project");
      }
      update.projectId = parsed.projectId;
    }
    if (parsed.assigneeId !== undefined) {
      if (parsed.assigneeId === null || parsed.assigneeId === "") {
        update.assigneeId = null;
      } else {
        if (!mongoose.isValidObjectId(parsed.assigneeId)) {
          return err("assigneeId: Invalid id", 422, "invalid_assignee_id");
        }
        update.assigneeId = parsed.assigneeId;
      }
    }
    if (parsed.status !== undefined) update.status = parsed.status;
    if (parsed.priority !== undefined) update.priority = parsed.priority;
    if (parsed.dueDate !== undefined) {
      update.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
    }

    const wasDone = existing.status === "done";
    const isNowDone = parsed.status === "done";

    const updated = await Task.findByIdAndUpdate(id, update, { new: true })
      .populate([
        { path: "projectId", select: "name" },
        { path: "assigneeId", select: "name" },
      ])
      .lean();

    if (!updated) return notFound("Task not found");

    if (isNowDone && !wasDone) {
      await logActivity({
        userId: String(user._id),
        action: "completed",
        entityType: "task",
        entityId: String(updated._id),
        description: `completed task "${updated.title}"`,
      });
    } else {
      await logActivity({
        userId: String(user._id),
        action: "updated",
        entityType: "task",
        entityId: String(updated._id),
        description: `updated task "${updated.title}"`,
      });
    }

    const serialized = serializeTask(adaptTaskForSerialize(updated));
    return ok({ task: serialized }, "Task updated");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed to update task");
  }
}

// ── DELETE /api/tasks/[id] ──────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();
    const { id } = await params;

    const result = await getOwnedTask(id, user);
    if (!result.ok) {
      if (result.code === "forbidden") return forbidden();
      return notFound("Task not found");
    }
    const task = result.task;
    const title = task.title;

    await Task.findByIdAndDelete(id);

    await logActivity({
      userId: String(user._id),
      action: "deleted",
      entityType: "task",
      entityId: String(id),
      description: `deleted task "${title}"`,
    });

    return ok(null, "Task deleted");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed to delete task");
  }
}
