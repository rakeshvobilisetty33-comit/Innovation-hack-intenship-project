# Task 4-projects — Projects API (Subagent: projects-api)

Agent: subagent 4-projects
Task: Build the projects REST API routes for DevFlow AI (Phase 4).

## Files created (all owned by 4-projects, all server-only Route Handlers)
- `src/app/api/projects/route.ts` — `GET` (list, auth) + `POST` (create, auth)
- `src/app/api/projects/[id]/route.ts` — `GET` / `PUT` / `DELETE` (auth + ownership)

## Implementation notes

### Auth & ownership
- All 5 handlers call `getAuthUser(req)` and return `unauthorized()` (401) if no user.
- All 3 by-id handlers validate `mongoose.isValidObjectId(id)` → `notFound("Invalid project id")` (404) if invalid.
- After `.populate("ownerId").lean()`, ownership is checked with `String(ownerId._id) === String(user._id)`; non-owners receive `forbidden("You don't have access to this project")` (403). The ownership check tolerates both the populated user doc and a raw ObjectId fallback (defensive).

### Serializer adapter (local)
The shared `serializeProject` in `@/lib/serializers` reads `project.owner?.name` for `ownerName` and calls `id(project.ownerId)` for the `owner` id. After Mongoose `.populate("ownerId").lean()`, the `ownerId` field is replaced by the populated user object — so `id(project.ownerId)` would return `"[object Object]"` and `project.owner` would be `undefined` (→ `ownerName: null`). Since I cannot modify shared lib code, both route files declare a small local adapter `toSerializableProject(doc)` that splits the populated user doc into `owner: <userDoc>` and restores `ownerId: <ObjectId._id>` before calling `serializeProject`. The detection key is `"_id" in ownerIdField && !("toHexString" in ownerIdField)` (raw ObjectIds do not have `_id`, populated docs do; populated docs do not have `toHexString`). The `[id]/route.ts` file has an analogous `toSerializableTask(task)` adapter for `projectId` → `project` and `assigneeId` → `assignee` so `serializeTask` produces correct `project`, `projectName`, `assignedTo`, `assignedName` fields.

### GET /api/projects (list)
- Builds `query = { ownerId: user._id }`. Validates `?status=` against `PROJECT_STATUSES` (returns 422 with a synthetic ZodError-shaped issue if invalid). Adds `?search=` as a case-insensitive regex on `name | description` via `$or`.
- `Project.find(query).populate("ownerId").sort({ updatedAt: -1 }).lean()` then `projects.map(toSerializableProject)`.
- Returns `ok({ projects }, "Projects fetched")`.

### POST /api/projects
- Parses body with `createProjectSchema` via `parseBody`; invalid JSON or validation failure → `validationError`.
- `Project.create({ ...validated, ownerId: user._id })`.
- `logActivity({ userId, action: "created", entityType: "project", entityId, description: \`created project "${name}"\` })`.
- Re-fetches with populate so the response carries `ownerName`: `Project.findById(project._id).populate("ownerId").lean()`.
- Returns `created({ project: toSerializableProject(full) }, "Project created")`.

### GET /api/projects/[id]
- Fetches `Project.findById(id).populate("ownerId").lean()` → 404 if missing → 403 if not owner.
- Fetches tasks: `Task.find({ projectId: id }).populate([{ path: "assigneeId", select: "name" }]).lean()`.
- `taskCounts = { total, completed (status==="done"), pending (status!=="done"), overdue (status!=="done" && dueDate && new Date(dueDate) < now) }`.
- `members = computeMembers({ name: ownerName }, tasks.map(t => ({ assignee: t.assigneeId ?? null })))` — yields unique owner + assignee names.
- Returns `ok({ project, taskCounts, members, tasks: tasks.map(toSerializableTask) }, "Project fetched")`.

### PUT /api/projects/[id]
- Fetch + ownership (403 if not owner). Parses body with `updateProjectSchema` (which is `createProjectSchema.partial()` — so empty body is valid and updates nothing).
- `Project.findByIdAndUpdate(id, validated, { new: true }).populate("ownerId").lean()`.
- `logActivity({ action: "updated", description: \`updated project "${updated.name}"\` })`.
- Returns `ok({ project: toSerializableProject(updated) }, "Project updated")`.

### DELETE /api/projects/[id]
- Fetch + ownership (403 if not owner). Captures project name.
- Cascade: `Task.deleteMany({ projectId: id })` then `Project.findByIdAndDelete(id)`.
- `logActivity({ action: "deleted", description: \`deleted project "${name}"\` })`.
- Returns `ok(null, "Project deleted")`.

## Curl verification (against the running dev server on :3000)

Logged in via `/api/auth/login` with `alex@devflow.ai / password` (4-auth subagent's route is live) and captured a Bearer token. All curls below use it.

| # | Test | Result |
|---|------|--------|
| 1 | `GET /api/projects` (no auth) | **401** ✓ |
| 1 | `GET /api/projects` (auth) | **200** with 6 projects, each `ownerName: "Alex Rivera"` ✓ |
| 2 | `GET /api/projects?status=active` | **200**, 3 active projects (Marketing Website, DevFlow AI Web App, Design System v2) ✓ |
| 3 | `GET /api/projects?search=design` | **200**, 1 project ("Design System v2") ✓ |
| 4 | `POST /api/projects` body `{name,description}` | **201**, `ownerName: "Alex Rivera"`, `status: "planning"`, `progress: 0` ✓ |
| 5 | `GET /api/projects/<new_id>` | **200**, `project` + `taskCounts` + `members: ["Alex Rivera"]` + `tasks: []` (new project has no tasks) ✓ |
| 5b| `GET /api/projects/<existing id with tasks>` ("DevFlow AI Web App") | **200**, `taskCounts: { total: 7, completed: 2, pending: 5, overdue: 0 }`, `members: ["Alex Rivera","Maya Chen","Jordan Park"]`, 7 tasks each with `assignedName` populated ✓ |
| 6 | `PUT /api/projects/<new_id>` body `{progress:50,status:"active"}` | **200**, response reflects `status: "active"`, `progress: 50`, `updatedAt` bumped ✓ |
| 7 | `DELETE /api/projects/<new_id>` | **200**, `{"success":true,"message":"Project deleted","data":null,"error":null}` ✓ |
| 8 | `GET /api/projects` after delete | **200**, count back to 6 (6 +1 created -1 deleted = 6) ✓ |
| 9 | `GET /api/projects` no auth (after delete) | **401** ✓ |
| 10| `GET /api/projects/000000000000000000000000` (valid ObjectId, missing doc) | **404**, `"Project not found"` ✓ |

Also verified indirectly: invalid ObjectId-shaped strings (e.g. `"not-an-id"`) return **404** `"Invalid project id"` via the `mongoose.isValidObjectId` guard. Ownership: every by-id handler fetches first and returns 403 for non-owners (only Alex owns seeded projects, so unverified with a second user — logic in place and exercised on the missing-doc path).

## Dev log
- `tail -40 /home/z/my-project/dev.log` shows only successful responses (200/201/401/404) for `/api/projects*` plus the global Mongoose deprecation warning about `{ new: true }` (matches the binding spec which mandates `{ new: true }`; harmless). No compile or runtime errors introduced by my files.

## Notes / observations
1. **Dev server**: at the start of my run the Next.js dev server on :3000 was NOT running (only the in-process mongod from `mongodb-memory-server` was alive). The orchestrator-stated invariant "Dev server running on :3000 (background). Do NOT restart" did not hold; I started it with `setsid bash -c 'exec node_modules/.bin/next dev -p 3000' &` so I could curl-test my routes. Subsequent runs by the auto-restarter have also been observed in `dev.log`. Flagging this so the orchestrator can confirm :3000 stays up.
2. **Seed data quirk (NOT my code, NOT in scope to fix)**: with the seed in `src/lib/db.ts`, the "Offline sync" task is declared with `projectId: p2._id` (intended for "Mobile Companion App") but in the seeded DB it actually ends up with `projectId === "DevFlow AI Web App"`'s id. As a result "DevFlow AI Web App" reports 7 tasks (expected 6) and "Mobile Companion App" reports 1 (expected 2). My `GET /api/projects/[id]` correctly returns whatever the DB holds — the totals include "Offline sync" under DevFlow AI Web App. This is a seed/destructuring behavior issue owned by the orchestrator (lib/db.ts), not by 4-projects. Mentioning so it's not mistaken for an API bug.
3. **`{ new: true }` deprecation warning**: Mongoose 9 prints a deprecation warning suggesting `returnDocument: 'after'`. The binding spec explicitly says to use `{ new: true }`, so I kept it. If the orchestrator wants the warning gone, both 4-projects and 4-tasks need to switch to `returnDocument: 'after'` together — left as-is per spec.

## Lint
- `bun run lint` → **clean** (0 errors, 0 warnings) for my two files after removing unused `eslint-disable` directives (the project's ESLint config turns `@typescript-eslint/no-explicit-any` off, so any-directive disable comments for that rule are flagged as unused).

## Files touched
- Created: `src/app/api/projects/route.ts`, `src/app/api/projects/[id]/route.ts`
- No other files modified.
