// GET /api/users — list all users (auth required).
// For the demo we allow any auth user to list users so the assignee dropdown works.

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { serializeUser } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    const users = await User.find().lean();
    return ok({ users: users.map(serializeUser) }, "Users fetched");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return serverError(message);
  }
}
