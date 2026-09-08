// GET /api/activities — list the authenticated user's activity feed.
// Query params:
//   ?limit=N    — number of records to return (default 20, max 100).
//   ?entityType — one of project | task | user | ai (optional filter).

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Activity } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, validationError, serverError } from "@/lib/api-response";
import { serializeActivity } from "@/lib/serializers";
import { ENTITY_TYPES } from "@/lib/schemas";

const ALLOWED_ENTITY_TYPES = new Set<string>(ENTITY_TYPES);

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    const url = req.nextUrl;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 100);
    const entityType = url.searchParams.get("entityType");
    if (entityType && !ALLOWED_ENTITY_TYPES.has(entityType)) {
      return validationError({
        issues: [
          {
            code: "invalid_enum_value",
            path: ["entityType"],
            message: `entityType must be one of: ${ENTITY_TYPES.join(", ")}`,
            received: entityType,
            options: [...ENTITY_TYPES],
          },
        ],
      } as unknown as Parameters<typeof validationError>[0]);
    }

    const query: Record<string, unknown> = { userId: user._id };
    if (entityType) query.entityType = entityType;

    const activities = await Activity.find(query)
      .populate({ path: "userId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // serializeActivity expects `userId` to be the raw id and `user.name`
    // to carry the populated name. The populate above replaces userId with
    // the populated doc, so we re-shape: keep the populated doc as `user`,
    // and restore userId as the raw _id string.
    const reshaped = activities.map((a) => {
      const populated = a.userId as unknown as { _id: { toString(): string }; name?: string } | null;
      return {
        ...a,
        userId: populated ? populated._id : null,
        user: populated ? { name: populated.name ?? null } : null,
      };
    });

    return ok({ activities: reshaped.map(serializeActivity) }, "Activities fetched");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return serverError(message);
  }
}
