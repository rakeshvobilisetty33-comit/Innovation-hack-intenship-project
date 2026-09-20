// GET    /api/projects/[id]  — fetch a single project (auth + ownership)
// PUT    /api/projects/[id]  — update a project (auth + ownership)
// DELETE /api/projects/[id]  — delete a project and its tasks (auth + ownership)

import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Project, Task } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { updateProjectSchema, parseBody } from "@/lib/schemas";
import {
  serializeProject,
  serializeTask,
  computeMembers,
  logActivity,
} from "@/lib/serializers";
import {
  ok,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  serverError,
} from "@/lib/api-response";

// ---------------------------------------------------------------------------
// Local serializer adapters.
//
// `serializeProject` reads `project.owner?.name` and `id(project.ownerId)`.
// After `.populate("ownerId").lean()`, `project.ownerId` becomes the user
// object (so `id()` would return "[object Object]"). We split it into
// `owner: <user doc>` and restore `ownerId: <ObjectId>` so both the `owner`
// id and `ownerName` resolve correctly. Same idea for `serializeTask`
// (`projectId` → `project`, `assigneeId` → `assignee`).
// ---------------------------------------------------------------------------
function toSerializableProject(doc: any) {
  if (!doc) return doc;
  const ownerIdField = doc.ownerId;
  if (
    ownerIdField &&
    typeof ownerIdField === "object" &&
    "_id" in ownerIdField &&
    !("toHexString" in ownerIdField) // raw ObjectId has no `_id`; populated doc does
  ) {
    return serializeProject({
      ...doc,
      ownerId: ownerIdField._id,
      owner: ownerIdField,
    });
  }
  return serializeProject(doc);
}

function toSerializableTask(task: any) {
  if (!task) return task;
  const out: Record<string, any> = { ...task };
  const projectIdField = task.projectId;
  if (
    projectIdField &&
    typeof projectIdField === "object" &&
    "_id" in projectIdField &&
    !("toHexString" in projectIdField)
  ) {
    out.projectId = projectIdField._id;
    out.project = projectIdField;
  }
  const assigneeIdField = task.assigneeId;
  if (
    assigneeIdField &&
    typeof assigneeIdField === "object" &&
    "_id" in assigneeIdField &&
    !("toHexString" in assigneeIdField)
  ) {
    out.assigneeId = assigneeIdField._id;
    out.assignee = assigneeIdField;
  }
  return serializeTask(out);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return notFound("Invalid project id");
    }

    const project = await Project.findById(id).populate("ownerId").lean();
    if (!project) return notFound("Project not found");

    // Ownership: project.ownerId is the populated user doc here.
    const ownerId =
      project.ownerId && (project.ownerId as { _id?: unknown })._id
        ? (project.ownerId as { _id: mongoose.Types.ObjectId })._id
        : (project.ownerId as mongoose.Types.ObjectId);
    if (!ownerId || String(ownerId) !== String(user._id)) {
      return forbidden("You don't have access to this project");
    }

    // Tasks: populate assigneeId so we can compute members and assignee names.
    const tasks = await Task.find({ projectId: id })
      .populate([{ path: "assigneeId", select: "name" }])
      .lean();

    const taskCounts = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "done").length,
      pending: tasks.filter((t) => t.status !== "done").length,
      overdue: tasks.filter(
        (t) =>
          t.status !== "done" &&
          t.dueDate &&
          new Date(t.dueDate).getTime() < Date.now(),
      ).length,
    };

    const ownerName =
      project.ownerId && (project.ownerId as { name?: string }).name
        ? (project.ownerId as { name: string }).name
        : null;
    const members = computeMembers(
      { name: ownerName },
      tasks.map((t) => ({
        assignee:
          t.assigneeId &&
          typeof t.assigneeId === "object" &&
          "name" in (t.assigneeId as object)
            ? (t.assigneeId as { name: string })
            : null,
      })),
    );

    return ok(
      {
        project: toSerializableProject(project),
        taskCounts,
        members,
        tasks: tasks.map(toSerializableTask),
      },
      "Project fetched",
    );
  } catch (e) {
    console.error("[projects GET /:id]", e);
    return serverError(
      e instanceof Error ? e.message : "Failed to fetch project",
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return notFound("Invalid project id");
    }

    const existing = await Project.findById(id).populate("ownerId").lean();
    if (!existing) return notFound("Project not found");

    const existingOwnerId =
      existing.ownerId && (existing.ownerId as { _id?: unknown })._id
        ? (existing.ownerId as { _id: mongoose.Types.ObjectId })._id
        : (existing.ownerId as mongoose.Types.ObjectId);
    if (!existingOwnerId || String(existingOwnerId) !== String(user._id)) {
      return forbidden("You don't have access to this project");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError({
        issues: [{ code: "custom", path: [], message: "Invalid JSON body" }],
      } as never);
    }

    let validated;
    try {
      validated = parseBody(updateProjectSchema, body);
    } catch (e) {
      return validationError(e as any);
    }

    const updated = await Project.findByIdAndUpdate(id, validated, {
      new: true,
    })
      .populate("ownerId")
      .lean();

    await logActivity({
      userId: String(user._id),
      action: "updated",
      entityType: "project",
      entityId: String(id),
      description: `updated project "${updated?.name ?? ""}"`,
    });

    return ok(
      { project: toSerializableProject(updated) },
      "Project updated",
    );
  } catch (e) {
    console.error("[projects PUT /:id]", e);
    return serverError(
      e instanceof Error ? e.message : "Failed to update project",
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return notFound("Invalid project id");
    }

    const project = await Project.findById(id).populate("ownerId").lean();
    if (!project) return notFound("Project not found");

    const projectOwnerId =
      project.ownerId && (project.ownerId as { _id?: unknown })._id
        ? (project.ownerId as { _id: mongoose.Types.ObjectId })._id
        : (project.ownerId as mongoose.Types.ObjectId);
    if (!projectOwnerId || String(projectOwnerId) !== String(user._id)) {
      return forbidden("You don't have access to this project");
    }

    const projectName = project.name;

    // Cascade: delete tasks, then the project.
    await Task.deleteMany({ projectId: id });
    await Project.findByIdAndDelete(id);

    await logActivity({
      userId: String(user._id),
      action: "deleted",
      entityType: "project",
      entityId: String(id),
      description: `deleted project "${projectName}"`,
    });

    return ok(null, "Project deleted");
  } catch (e) {
    console.error("[projects DELETE /:id]", e);
    return serverError(
      e instanceof Error ? e.message : "Failed to delete project",
    );
  }
}
