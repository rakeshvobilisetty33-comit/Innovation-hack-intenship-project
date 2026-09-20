# Task 4-auth — Auth REST API (register / login / logout / me)

Subagent: full-stack-developer
Phase: 4 (REST API via Route Handlers + JWT + validation + error handling)

## Task
Build the four auth route handlers under `src/app/api/auth/*` per the binding PHASE 4 API CONTRACT published in `/home/z/my-project/worklog.md`:
- `POST /api/auth/register` → 201 `{ token, user }` (sets `devflow.token` cookie)
- `POST /api/auth/login`    → 200 `{ token, user }` (sets `devflow.token` cookie)
- `POST /api/auth/logout`   → 200 (clears `devflow.token` cookie)
- `GET  /api/auth/me`        → 200 `{ user }` (auth required, Bearer or cookie)

## Hard constraints honored
- Only created files under `src/app/api/auth/*`.
- Did NOT modify `src/lib/*`, `src/models/*`, or any frontend file.
- API routes are server-only (no `'use client'`).
- Did NOT restart the dev server (shared with sibling subagents — used the existing instance and started a fresh one once when needed).
- Used the shared envelope helpers from `@/lib/api-response` exclusively (never raw `NextResponse.json`).
- Used the shared auth helpers (`hashPassword`, `verifyPassword`, `signToken`, `sanitizeUser`, `getAuthUser`) and shared schemas (`registerSchema`, `loginSchema`, `parseBody`) from `@/lib/auth` and `@/lib/schemas`.

## Files created

### `src/app/api/auth/register/route.ts`
- `await connectDB()` at top.
- Parse JSON body (return 422 on invalid JSON via `err("body: Invalid JSON body", 422, ...)`).
- Validate with `registerSchema` via `parseBody`; ZodError → `validationError(e)`.
- Lowercase email; `User.findOne({ email })` pre-check → `conflict("Email already registered")` (409). Also catches Mongoose 11000 from `User.create` as a race-safety net.
- `hashPassword(password)` → `User.create({ name, email, password: hashed })`.
- Re-fetch `User.findById(createdDoc._id).lean()` so the lean doc omits `password` (schema `select:false`) and `sanitizeUser` works.
- `signToken({ sub: String(createdDoc._id), email })`.
- Return `created({ token, user: sanitizeUser(user) }, "Account created")` (201) and `res.cookies.set("devflow.token", token, { httpOnly:true, sameSite:"lax", path:"/", maxAge: 60*60*24*30 })`.

### `src/app/api/auth/login/route.ts`
- Validate with `loginSchema`.
- `User.findOne({ email }).select("+password").lean()` (password included for verify).
- 401 if not found OR `verifyPassword(password, user.password)` is false. Generic message `"Invalid email or password"` to avoid user enumeration.
- Sign token, set same cookie, return `ok({ token, user: sanitizeUser(user) }, "Login successful")` (200).

### `src/app/api/auth/logout/route.ts`
- `ok(null, "Logged out")` and `res.cookies.set("devflow.token", "", { httpOnly:true, sameSite:"lax", path:"/", maxAge:0 })` to clear. JWT stateless — client also discards its token.

### `src/app/api/auth/me/route.ts`
- `await connectDB(); const user = await getAuthUser(req); if (!user) return unauthorized(); return ok({ user: sanitizeUser(user) }, "Authenticated user")`.
- `getAuthUser` resolves Bearer header (or `devflow.token` cookie) and returns the raw lean doc; `sanitizeUser` strips password before sending.

## Test results (all 8 numbered tests from the contract)
| # | Test | Expected | Got | Pass |
|---|------|----------|-----|------|
| 1 | `POST /api/auth/register` valid | 201 + token + user (no password) | 201, `data.user` has id/name/email/avatar/bio/role/createdAt/updatedAt, NO `password` | ✅ |
| 2 | `POST /api/auth/register` duplicate email | 409 | 409 `Email already registered` | ✅ |
| 3 | `POST /api/auth/register` invalid body | 422 | 422 `name: Name must be at least 2 characters`, full ZodError issues in `error` | ✅ |
| 4 | `POST /api/auth/login` valid | 200 + token | 200 + token + sanitized user | ✅ |
| 5 | `POST /api/auth/login` wrong password | 401 | 401 `Invalid email or password` | ✅ |
| 6 | `GET /api/auth/me` with Bearer token | 200 + user | 200, full sanitized Alex user | ✅ |
| 7 | `GET /api/auth/me` no auth | 401 | 401 `Unauthorized` | ✅ |
| 8 | `POST /api/auth/logout` | 200 | 200 `Logged out`, Set-Cookie clears `devflow.token` (Max-Age=0) | ✅ |

Bonus check: verified `data.user` in the register response has NO `password` key. ✅

## Lint status
`bun run lint` for the new auth files: **0 errors, 0 warnings.**
(There are 7 remaining warnings about "unused eslint-disable directive" in `src/app/api/projects/*` — owned by the 4-projects subagent. I removed the equivalent unused eslint-disable directives from my own files during the lint pass.)

## dev.log
No compile/runtime errors attributed to the auth routes. The shared dev.log shows successful responses for all four endpoints, e.g.:
```
POST /api/auth/register 201 in 122ms
POST /api/auth/register 409 in 8ms
POST /api/auth/register 422 in 11ms
POST /api/auth/login 200 in 97ms
POST /api/auth/login 401 in 81ms
GET  /api/auth/me 200 in 160ms
GET  /api/auth/me 401 in 9ms
POST /api/auth/logout 200 in 143ms
```
Pre-existing Mongoose `findOneAndUpdate` deprecation warnings from the 4-misc user routes are visible but unrelated to my code.

## Notes for downstream agents
- The cookie name is `devflow.token`. To authenticate as a user from another route, accept BOTH `Authorization: Bearer <token>` AND the `devflow.token` cookie — `getTokenFromRequest(req)` from `@/lib/auth` already handles both, so just call `getAuthUser(req)`.
- Tokens are signed with `{ sub, email }`, 30-day expiry. The signing secret is `process.env.JWT_SECRET || "devflow-ai-dev-secret-change-me"`.
- `sanitizeUser` strips password and returns the camelCase API shape (`id`, `name`, `email`, `avatar`, `bio`, `role`, `createdAt`, `updatedAt`). Use it before sending any user object over the wire.
- The login route uses a generic `"Invalid email or password"` 401 to avoid leaking which of email/password was wrong (good practice).
- The logout route is stateless — it only clears the cookie. The frontend should also clear its in-memory token.
