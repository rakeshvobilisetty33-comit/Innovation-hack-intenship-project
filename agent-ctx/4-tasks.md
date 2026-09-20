# Task 4-tasks — Work Record

**Agent:** full-stack-developer (subagent)
**Task ID:** 4-tasks
**Task:** Build the Tasks REST API (`src/app/api/tasks/route.ts` GET/POST + `src/app/api/tasks/[id]/route.ts` GET/PUT/DELETE) on Next.js 16 App Router + MongoDB + Mongoose. Auth via JWT. Ownership via the task's project ownerId. Filters + search + creation + update + delete with activity logging.

## Files Created

1. `src/app/api/tasks/route.ts`
   - `GET /api/tasks` — list, scoped to the authenticated user's projects. Filters: `?status`, `?priority`, `?project`, `?search`, `?assignee` (including `unassigned`). Populates `projectId` (name) + `assigneeId` (name). Sorts by `updatedAt` desc.
   - `POST /api/tasks` — create. Validates with `createTaskSchema`; verifies the project exists AND is owned by the user (404 if not found, 403 if not owner); validates assigneeId when provided; converts `dueDate` ISO string to `Date`; logs activity "created"; re-fetches with populate for the response (201).

2. `src/app/api/tasks/[id]/route.ts`
   - `GET /api/tasks/[id]` — fetch one task. Validates ObjectId; populates project+assignee; ownership via the project ownerId; 404 if not found, 403 if not owner.
   - `PUT /api/tasks/[id]` — update. Validates with `updateTaskSchema` (partial); re-checks ownership BEFORE applying; supports moving to a different owned project; supports reassigning / unassigning; logs "completed" when status transitions to "done", otherwise "updated". Returns the populated updated task.
   - `DELETE /api/tasks/[id]` — delete. Verifies ownership via the project ownerId; logs "deleted" with the task title in the description.

## Helper Notes

- `adaptTaskForSerialize(t)` rewrites a populated Mongoose lean task so that:
  - `t.projectId` = the underlying `_id` (so `id(t.projectId).toString()` returns the hex string instead of `[object Object]`)
  - `t.project` = the populated project doc (`{ _id, name }`) so `serializeTask` can read `.name`
  - `t.assigneeId` = the underlying id or null
  - `t.assignee` = the populated assignee doc (`{ _id, name }`) or null
  This is needed because `.populate("projectId").lean()` replaces the ObjectId with the populated doc, but `serializeTask` was written assuming `projectId` is still an id and `project` is a separate field with `.name`.

- `getOwnedTask(id, user)` (in [id]/route.ts) is a small discriminated-union helper that fetches + populates a task, looks up its project, and returns one of: `{ ok: true, task }` / `{ ok: false, code: "invalid" | "notfound" | "forbidden" }`. Invalid ObjectId and not-found both map to 404 (per spec test #10); ownership failure maps to 403.

- Filters handle invalid values gracefully:
  - `?status=bogus` → ignored (no tasks filtered out)
  - `?priority=bogus` → ignored
  - `?project=<invalid ObjectId>` → ignored (still scoped via `$in: userProjectIds`)
  - `?project=<valid ObjectId of someone else's project>` → returns empty list (does NOT leak the project's existence)
  - `?assignee=unassigned` → filters by `assigneeId: null`
  - `?assignee=<invalid>` → ignored
  - `?search=<text>` → regex on title+description, case-insensitive, regex-meta-escaped

- Activity logging uses the shared `logActivity` helper (non-fatal, swallows errors).

## Mongoose Notes

- `findByIdAndUpdate(id, update, { new: true })` triggers a Mongoose 9 deprecation warning (`new` is deprecated, use `returnDocument: 'after'`). I kept `{ new: true }` because the spec explicitly says to use it. The warning is non-fatal and the behavior is correct.

## Lint

- `bunx eslint src/app/api/tasks/**/*.ts` → 0 errors, 0 warnings on my files.
- Full project `bun run lint` → 0 errors, 7 warnings — all in `src/app/api/projects/*` (owned by the 4-projects agent) and `src/app/api/auth/*` (owned by the 4-auth agent). None introduced by me.

## Curl Test Results

All 11 spec tests passed:

| # | Test | Result |
|---|------|--------|
| 1 | `GET /api/tasks` (auth) | ✅ 14 tasks returned |
| 2 | `GET /api/tasks?status=done` | ✅ 4 done tasks (Analytics charts, Design dashboard layout, Tokenize color palette, Billing analytics view) |
| 3 | `GET /api/tasks?priority=urgent` | ✅ 1 urgent task (Implement auth flow) |
| 4 | `GET /api/tasks?search=auth` | ✅ 1 task matching "auth" (Implement auth flow) |
| 5 | `GET /api/tasks?project=<projid>` | ✅ 6 tasks in the DevFlow AI Web App project |
| 6 | `POST /api/tasks` create | ✅ 201, returns the new task with populated projectName + assignedName=null + dueDate=null |
| 7 | `PUT /api/tasks/<id>` mark done | ✅ 200, status: done |
| 8 | `DELETE /api/tasks/<id>` | ✅ 200, message "Task deleted" |
| 9 | `GET /api/tasks` no auth | ✅ 401 |
| 10 | `GET /api/tasks/000000000000000000000000` | ✅ 404 |
| 11 | `GET /api/tasks?status=todo&priority=high` | ✅ 1 task (AI task generation) |

Extra edge-case tests (all passed):
- `?assignee=unassigned` → 0 tasks (no seed tasks are unassigned; correct).
- `?assignee=<Maya's id>` → 6 tasks assigned to Maya Chen.
- `?project=<invalid ObjectId>` → ignored, returns 14.
- POST with `assigneeId` → creates task with `assignedTo=<id>`, `assignedName="Maya Chen"`, `dueDate` parsed.
- POST with valid title + non-existent `projectId` → 404 "Project not found".
- POST with `{"title":"x"}` (missing projectId + title too short) → 422 validation error.
- PUT with invalid status `"bogus"` → 422.
- PUT changing only priority (no status change) → 200, priority updated.
- PUT moving task to a different owned project → 200, projectName updated.

## Dev Log

- All my requests logged with the correct HTTP codes (200/201/401/404/422). No 500s, no compile errors.
- The only warning in the log is the Mongoose 9 deprecation warning for `{ new: true }` (kept per spec).

## Stage Summary

- 2 files created under `src/app/api/tasks/*` only (no other files touched).
- All 11 spec tests + extra edge-case tests pass.
- Lint clean on my files.
- Dev server healthy.
- API contract (response envelope, HTTP codes, auth helpers, serializers, zod schemas, ownership) all honored.
