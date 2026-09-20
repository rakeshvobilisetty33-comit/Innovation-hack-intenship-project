// POST /api/auth/logout — clear the auth cookie. JWT is stateless, so the
// client should also discard the in-memory token.

import { ok } from "@/lib/api-response";

const COOKIE_NAME = "devflow.token";

export async function POST() {
  const res = ok(null, "Logged out");
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
