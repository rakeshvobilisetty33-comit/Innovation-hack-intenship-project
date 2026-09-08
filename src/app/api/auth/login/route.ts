// POST /api/auth/login — verify credentials, issue JWT, set cookie.

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { ok, unauthorized, validationError, serverError, err } from "@/lib/api-response";
import { verifyPassword, signToken, sanitizeUser } from "@/lib/auth";
import { loginSchema, parseBody } from "@/lib/schemas";

const COOKIE_NAME = "devflow.token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err("body: Invalid JSON body", 422, "Invalid JSON body");
    }

    let parsed;
    try {
      parsed = parseBody(loginSchema, body);
    } catch (e) {
      return validationError(e as never);
    }

    const { email, password } = parsed;
    const emailLower = email.toLowerCase();

    const user = await User.findOne({ email: emailLower }).select("+password").lean();
    if (!user) {
      return unauthorized("Invalid email or password");
    }

    if (!(await verifyPassword(password, user.password))) {
      return unauthorized("Invalid email or password");
    }

    const token = signToken({ sub: String(user._id), email: emailLower });

    const res = ok({ token, user: sanitizeUser(user as never) }, "Login successful");
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Login failed");
  }
}
