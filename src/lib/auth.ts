// Authentication helpers: password hashing, JWT sign/verify, request user extraction.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import type { LeanDocument } from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "devflow-ai-dev-secret-change-me";
const TOKEN_EXPIRY = "30d";

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

type UserDoc = {
  _id: { toString(): string };
  name: string;
  email: string;
  password?: string;
  avatar?: string | null;
  bio?: string | null;
  role?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const cookie = req.cookies.get("devflow.token")?.value;
  return cookie ?? null;
}

// Resolves the authenticated user (raw Mongoose doc, password selected explicitly when needed).
export async function getAuthUser(req: NextRequest): Promise<UserDoc | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  await connectDB();
  const user = await User.findById(payload.sub).select("+password").lean<UserDoc>();
  return user ?? null;
}

// Strips sensitive fields before sending to the client.
export function sanitizeUser(user: UserDoc) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    bio: user.bio ?? null,
    role: user.role ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
