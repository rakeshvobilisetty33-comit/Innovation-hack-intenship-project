// GET / PUT / DELETE /api/users/[id] — user profile management.
// - GET: any auth user can fetch a single user (for assignee lookups).
// - PUT: self-only (auth user must match the :id).
// - DELETE: self-only; cascades their projects, tasks (owned projects' tasks),
//   unassigns tasks assigned to them, removes their activities, then deletes the user.

import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { User, Project, Task, Activity } from "@/models";
import { getAuthUser } from "@/lib/auth";
import {
  ok,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
} from "@/lib/api-response";
import { serializeUser, logActivity } from "@/lib/serializers";
import { updateProfileSchema, parseBody } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return notFound("User not found");
    await connectDB();

    const found = await User.findById(id).lean();
    if (!found) return notFound("User not found");
    return ok({ user: serializeUser(found) }, "User fetched");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return serverError(message);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const { id } = await params;
    if (String(user._id) !== id) return forbidden("You can only edit your own profile");
    if (!mongoose.isValidObjectId(id)) return notFound("User not found");
    await connectDB();

    const body = await req.json().catch(() => null);
    let validated;
    try {
      validated = parseBody(updateProfileSchema, body);
    } catch (e) {
      return validationError(e as unknown as Parameters<typeof validationError>[0]);
    }

    // Drop undefined fields so we don't blow away unset values.
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(validated)) {
      if (v !== undefined) update[k] = v;
    }

    const updated = await User.findByIdAndUpdate(id, update, {
      returnDocument: "after",
    }).lean();
    if (!updated) return notFound("User not found");

    await logActivity({
      userId: String(user._id),
      action: "updated",
      entityType: "user",
      entityId: String(updated._id),
      description: "updated their profile",
    });

    return ok({ user: serializeUser(updated) }, "Profile updated");
  } catch (e) {
    const err = e as { code?: number; message?: string };
    if (err && err.code === 11000) {
      return conflict("Email already registered");
    }
    const message = e instanceof Error ? e.message : "Internal server error";
    return serverError(message);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const { id } = await params;
    if (String(user._id) !== id) return forbidden("You can only delete your own account");
    if (!mongoose.isValidObjectId(id)) return notFound("User not found");
    await connectDB();

    const existing = await User.findById(id).lean();
    if (!existing) return notFound("User not found");

    // Cascade: collect owned project ids → delete their tasks → delete their
    // projects → unassign tasks pointed at this user → wipe their activity log.
    const ownedProjects = await Project.find({ ownerId: id }).select("_id").lean();
    const projectIds = ownedProjects.map((p) => p._id);
    if (projectIds.length) {
      await Task.deleteMany({ projectId: { $in: projectIds } });
    }
    await Project.deleteMany({ ownerId: id });
    await Task.updateMany({ assigneeId: id }, { $set: { assigneeId: null } });
    await Activity.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    return ok(null, "Account deleted");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return serverError(message);
  }
}
