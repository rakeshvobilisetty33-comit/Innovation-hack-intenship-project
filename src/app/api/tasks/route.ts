// Tasks API — list (with filters) + create.
// All routes are server-only Route Handlers (no 'use client').

import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import type { ZodError } from "zod";

import { connectDB } from "@/lib/db";
import { Project, Task, User } from "@/models";
import {
  ok,
  created,
  err,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { createTaskSchema, parseBody } from "@/lib/schemas";
import { serializeTask, logActivity } from "@/lib/serializers";

const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

/**
 * Adapt a populated Mongoose lean task into the shape serializeTask expects.
 *
 * After `.populate([{ path: "projectId", select: "name" }, { path: "assigneeId", select: "name" }]).lean()`:
 *   - task.projectId  = { _id, name }                 (populated Project doc)
 *   - task.assigneeId = { _id, name } | null          (populated User doc or null)
 *
 * serializeTask reads:
 *   - id(task.projectId)  -> projectId must be string/ObjectId (.toString() → hex)
 *   - task.project?.name  -> project must be { name } | null
 *   - task.assigneeId ? id(task.assigneeId) : "unassigned"  -> assigneeId must be id|null
 *   - task.assignee?.name -> assignee must be { name } | null
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

// ── GET /api/tasks ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    // Restrict to projects owned by the authenticated user.
    const userProjectIds = (await Project.find({ ownerId: user._id })
      .select("_id")
      .lean()).map((p) => p._id);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const project = url.searchParams.get("project");
    const search = url.searchParams.get("search");
    const assignee = url.searchParams.get("assignee");

    const query: Record<string, any> = {};

    // Project filter: must intersect with the user's owned projects.
    if (project && mongoose.isValidObjectId(project)) {
      const owns = await Project.exists({ _id: project, ownerId: user._id });
      if (!owns) {
        // Project doesn't exist or user doesn't own it — return empty list.
        return ok({ tasks: [] }, "Tasks fetched");
      }
      query.projectId = project;
    } else {
      query.projectId = { $in: userProjectIds };
    }

    if (status && (TASK_STATUSES as readonly string[]).includes(status)) {
      query.status = status;
    }
    if (priority && (PRIORITIES as readonly string[]).includes(priority)) {
      query.priority = priority;
    }
    if (search) {
      // Escape regex metacharacters to avoid ReDoS / surprising matches.
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: esc, $options: "i" } },
        { description: { $regex: esc, $options: "i" } },
      ];
    }
    if (assignee) {
      if (assignee === "unassigned") {
        query.assigneeId = null;
      } else if (mongoose.isValidObjectId(assignee)) {
        query.assigneeId = assignee;
      }
      // else: ignore invalid assignee id silently.
    }

    const tasks = await Task.find(query)
      .populate([
        { path: "projectId", select: "name" },
        { path: "assigneeId", select: "name" },
      ])
      .sort({ updatedAt: -1 })
      .lean();

    const serialized = tasks.map((t) => serializeTask(adaptTaskForSerialize(t)));
    return ok({ tasks: serialized }, "Tasks fetched");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed to fetch tasks");
  }
}

// ── POST /api/tasks ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400, "invalid_json");
    }

    let parsed;
    try {
      parsed = parseBody(createTaskSchema, body);
    } catch (e) {
      return validationError(e as ZodError);
    }

    // Verify project exists AND the user owns it.
    const project = await Project.findById(parsed.projectId).lean();
    if (!project) return notFound("Project not found");
    if (String(project.ownerId) !== String(user._id)) {
      return forbidden("You don't have access to this project");
    }

    // Resolve assigneeId (optional). Verify it's a valid user when provided.
    let assigneeId: mongoose.Types.ObjectId | null = null;
    if (parsed.assigneeId) {
      if (!mongoose.isValidObjectId(parsed.assigneeId)) {
        return err("assigneeId: Invalid id", 422, "invalid_assignee_id");
      }
      const assignee = await User.findById(parsed.assigneeId).select("_id").lean();
      if (!assignee) return notFound("Assignee not found");
      assigneeId = assignee._id as mongoose.Types.ObjectId;
    }

    const dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;

    const task = await Task.create({
      title: parsed.title,
      description: parsed.description ?? "",
      projectId: parsed.projectId,
      assigneeId,
      status: parsed.status,
      priority: parsed.priority,
      dueDate,
    });

    await logActivity({
      userId: String(user._id),
      action: "created",
      entityType: "task",
      entityId: String(task._id),
      description: `created task "${task.title}"`,
    });

    // Re-fetch with populate so the response includes project/assignee names.
    const full = await Task.findById(task._id)
      .populate([
        { path: "projectId", select: "name" },
        { path: "assigneeId", select: "name" },
      ])
      .lean();

    const serialized = serializeTask(adaptTaskForSerialize(full));
    return created({ task: serialized }, "Task created");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed to create task");
  }
}
