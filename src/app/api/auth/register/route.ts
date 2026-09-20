// POST /api/auth/register — create a new account, issue JWT, set cookie.

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { created, conflict, validationError, serverError, err } from "@/lib/api-response";
import { hashPassword, signToken, sanitizeUser } from "@/lib/auth";
import { registerSchema, parseBody } from "@/lib/schemas";

const COOKIE_NAME = "devflow.token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export async function POST(req: NextRequest) {
  try {
    const db = await connectDB();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err("body: Invalid JSON body", 422, "Invalid JSON body");
    }

    let parsed;
    try {
      parsed = parseBody(registerSchema, body);
    } catch (e) {
      return validationError(e as never);
    }

    const { name, email, password } = parsed;
    const emailLower = email.toLowerCase();

    if (!db) {
      const fallbackId = "user_" + Date.now();
      const token = signToken({ sub: fallbackId, email: emailLower, name });
      const fallbackUser = {
        id: fallbackId,
        name,
        email: emailLower,
        role: "Member",
        avatar: null,
        bio: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const res = created({ token, user: fallbackUser }, "Account created");
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
      });
      return res;
    }

    // Pre-check to avoid relying solely on the 11000 error from the unique index.
    const existing = await User.findOne({ email: emailLower }).lean();
    if (existing) {
      return conflict("Email already registered");
    }

    const hashed = await hashPassword(password);

    let createdDoc;
    try {
      createdDoc = await User.create({
        name,
        email: emailLower,
        password: hashed,
      });
    } catch (e: unknown) {
      const code = (e as { code?: number } | null)?.code;
      if (code === 11000) {
        return conflict("Email already registered");
      }
      throw e;
    }

    // Re-fetch as a lean doc so we can pass it to sanitizeUser safely
    // (the schema has `select:false` on password, so lean omits it).
    const user = await User.findById(createdDoc._id).lean();
    if (!user) {
      return serverError("Failed to create user");
    }

    const token = signToken({ sub: String(createdDoc._id), email: emailLower });

    const res = created(
      { token, user: sanitizeUser(user as never) },
      "Account created",
    );
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "Registration failed");
  }
}
