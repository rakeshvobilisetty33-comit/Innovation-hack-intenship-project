// Centralized API response helpers.
// Every API route returns the envelope: { success, message, data, error }.

import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string | null;
}

export function ok<T>(data: T, message = "OK", init?: ResponseInit) {
  const body: ApiEnvelope<T> = { success: true, message, data, error: null };
  return NextResponse.json(body, { status: 200, ...init });
}

export function created<T>(data: T, message = "Created") {
  const body: ApiEnvelope<T> = { success: true, message, data, error: null };
  return NextResponse.json(body, { status: 201 });
}

export function err(message: string, status = 400, error: string | null = null) {
  const body: ApiEnvelope<null> = { success: false, message, data: null, error };
  return NextResponse.json(body, { status });
}

export function validationError(zodErr: ZodError) {
  const first = zodErr.issues[0];
  const message = first
    ? `${first.path.join(".") || "field"}: ${first.message}`.replace(/^:\s/, "")
    : "Validation failed";
  return err(message, 422, JSON.stringify(zodErr.issues));
}

export function unauthorized(message = "Unauthorized") {
  return err(message, 401);
}

export function forbidden(message = "Forbidden") {
  return err(message, 403);
}

export function notFound(message = "Not found") {
  return err(message, 404);
}

export function conflict(message = "Conflict") {
  return err(message, 409);
}

export function serverError(message = "Internal server error") {
  return err(message, 500);
}
