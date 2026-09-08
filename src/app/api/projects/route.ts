// GET /api/projects   — list projects for the authenticated user (filter: ?status, ?search)
// POST /api/projects  — create a new project owned by the authenticated user

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Project } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { createProjectSchema, parseBody, PROJECT_STATUSES } from "@/lib/schemas";
import { serializeProject, logActivity } from "@/lib/serializers";
import {
  ok,
  created,
  unauthorized,
  validationError,
  serverError,
} from "@/lib/api-response";

// ---------------------------------------------------------------------------
// Local serializer adapter.
//
// `serializeProject` (in @/lib/serializers) reads `project.owner?.name` for the
// ownerName field and calls `id(project.ownerId)` for the owner id field.
// After Mongoose `.populate("ownerId").lean()`, the populated user document
// replaces the `ownerId` field (so `project.ownerId` becomes the user object
// and `project.owner` is undefined). We split the populated user doc into
// `owner` (the populated user object, for `.name`) and restore `ownerId` to
// the raw ObjectId (so `id(project.ownerId)` returns the user's hex id).
// This keeps `owner` and `ownerName` correct without touching shared lib code.
// ---------------------------------------------------------------------------
function toSerializableProject(doc: any) {
  if (!doc) return doc;
  const ownerIdField = doc.ownerId;
  if (
    ownerIdField &&
    typeof ownerIdField === "object" &&
    "_id" in ownerIdField &&
    !("toHexString" in ownerIdField) // ObjectId does not have _id, the populated doc does
  ) {
    return serializeProject({
      ...doc,
      ownerId: ownerIdField._id,
      owner: ownerIdField,
    });
  }
  return serializeProject(doc);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status")?.trim() || "";
    const searchParam = url.searchParams.get("search")?.trim() || "";

    const query: Record<string, any> = { ownerId: user._id };

    if (statusParam) {
      if (!PROJECT_STATUSES.includes(statusParam as never)) {
        return validationError({
          issues: [
            {
              code: "invalid_enum_value",
              path: ["status"],
              message: `status must be one of ${PROJECT_STATUSES.join(", ")}`,
              options: [...PROJECT_STATUSES],
              received: statusParam,
            },
          ],
        } as never);
      }
      query.status = statusParam;
    }

    if (searchParam) {
      const re = new RegExp(escapeRegex(searchParam), "i");
      query.$or = [{ name: re }, { description: re }];
    }

    const projects = await Project.find(query)
      .populate("ownerId")
      .sort({ updatedAt: -1 })
      .lean();

    return ok(
      { projects: projects.map(toSerializableProject) },
      "Projects fetched",
    );
  } catch (e) {
    console.error("[projects GET]", e);
    return serverError(
      e instanceof Error ? e.message : "Failed to fetch projects",
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

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
      validated = parseBody(createProjectSchema, body);
    } catch (e) {
      return validationError(e as any);
    }

    const project = await Project.create({
      ...validated,
      ownerId: user._id,
    });

    await logActivity({
      userId: String(user._id),
      action: "created",
      entityType: "project",
      entityId: String(project._id),
      description: `created project "${project.name}"`,
    });

    // Re-fetch with populate so the response includes ownerName.
    const full = await Project.findById(project._id).populate("ownerId").lean();

    return created(
      { project: toSerializableProject(full) },
      "Project created",
    );
  } catch (e) {
    console.error("[projects POST]", e);
    return serverError(
      e instanceof Error ? e.message : "Failed to create project",
    );
  }
}
