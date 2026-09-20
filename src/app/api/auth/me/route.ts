// GET /api/auth/me — return the authenticated user's profile.

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { getAuthUser, sanitizeUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) {
      return unauthorized();
    }
    return ok({ user: sanitizeUser(user) }, "Authenticated user");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Failed to fetch user");
  }
}
