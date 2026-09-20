# DevFlow AI — Developer Project & Task Management Platform

A modern, AI-powered SaaS application for developers, students, freelancers and small teams to plan projects, manage tasks, and generate work with AI. Built as a full-stack monorepo with a polished, responsive UI inspired by Linear / Notion / Vercel.

> **Internship project — Full Stack Development (1 month).** This single connected application satisfies all four internship tasks: Modern Frontend, REST API, MongoDB Database, and AI-Powered Full-Stack.

---

## Project Overview

DevFlow AI brings project planning, task tracking and AI-assisted breakdowns together so your team can move from idea to shipped without the busywork. Users can register, log in, create projects, manage tasks with a Kanban board, search and filter work, track progress with analytics, and use **AI to generate structured tasks** from a short project description.

### Highlights

- **Authentication** — JWT + bcrypt, protected routes, session persistence.
- **Dashboard analytics** — live stats, Recharts visualizations, recent activity.
- **Project management** — full CRUD, progress tracking, members, per-project details.
- **Task management** — full CRUD, search, multi-filter, drag-and-drop Kanban (To Do / In Progress / Done).
- **AI task generation** — describe a project, AI returns structured tasks you review and add.
- **Responsive design** — mobile drawer, stacking cards, touch-friendly, sticky footer.
- **Dark / light mode** — theme toggle with system preference.
- **Animations** — Framer Motion page transitions, micro-interactions, loading skeletons.
- **States everywhere** — loading, empty, error states; toast notifications.

---

## Features

### Authentication & Authorization
- Register, Login, Logout, Get current user
- Passwords hashed with bcrypt; JWT tokens (30-day expiry)
- Protected routes via auth middleware; session persists across reloads
- Demo account seeded: `alex@devflow.ai` / `password`

### Dashboard
- Total / Active / Completed projects, Total / Completed / Pending / Overdue tasks
- Overall progress ring, task completion rate, quick actions
- **Recharts**: tasks by status (donut), tasks by priority (bar)
- Recent activity feed, top projects with progress bars
- Animated stat counters; all data computed from the database (no fake stats)

### Projects
- Create / Read / Update / Delete with validation and confirmation dialogs
- Filter by status, search by name/description, active filter chips
- Project details: stats strip, members, inline task list, recent activity
- Color-coded status badges, progress bars, member avatar stacks

### Tasks
- Create / Read / Update / Delete, assign to users, set priority + due date
- Search by title/description, filter by status / priority / project / assignee
- **Kanban board** with `@dnd-kit` drag-and-drop (pointer + keyboard sensors)
- Inline status & priority dropdowns (accessible non-drag fallback)
- Color-coded, accessible priority (low → urgent) and status (To Do → Done) badges

### AI Task Generation (primary AI feature)
- "Generate Tasks with AI" button on the Projects page
- Describe a project (e.g. "Build an e-commerce website") → AI returns structured tasks
- Review generated tasks, edit priorities, select/deselect, then add to a project
- Buttons: **Generate Tasks** / **Regenerate** / **Add Selected** / **Cancel**
- AI loading animation, error handling, heuristic offline fallback
- AI provider is abstracted behind a service layer (swap providers without touching call sites)
- **API key configured via environment variable — never hard-coded**

### Profile & Settings
- Profile: avatar, stats (projects owned, tasks assigned, completed, completion rate), bio, inline edit
- Settings: Appearance (light/dark/system), Profile, Notifications (switches), Account (change password, delete account)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Next.js 16 (App Router), TypeScript 5, Tailwind CSS 4, shadcn/ui (New York), Lucide icons |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **State** | Zustand (auth, UI, data) |
| **Server data** | Custom service layer (fetch-based) |
| **Backend** | Node.js, Next.js Route Handlers (REST API) |
| **Auth** | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| **Validation** | Zod |
| **Database** | MongoDB + Mongoose 9 (MongoDB Atlas compatible) |
| **AI** | `z-ai-web-dev-sdk` (LLM) behind an abstracted service |

> **Note on architecture:** The original internship brief specified React+Vite + a separate Express backend + MongoDB. This implementation uses **Next.js 16 App Router** (one connected app) with **Route Handlers** providing the same REST API contract, and **Mongoose + MongoDB** for the database (exactly as required). All REST endpoints, models, relationships, and behaviors match the spec.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Next.js App Router)                       │
│  - Single "/" route with a client-side view router           │
│  - Zustand stores (auth, UI, data)                            │
│  - Service layer (auth/project/task/activity/dashboard/ai)   │
└─────────────────────────────────────────────────────────────┘
                           │  fetch (relative /api/*, Bearer JWT)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  REST API (Next.js Route Handlers)                           │
│  - /api/auth/*  /api/projects/*  /api/tasks/*                │
│  - /api/users/*  /api/activities  /api/dashboard  /api/ai/*   │
│  - JWT auth middleware, Zod validation, centralized errors   │
│  - Standard envelope: { success, message, data, error }      │
└─────────────────────────────────────────────────────────────┘
                           │  Mongoose
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MongoDB (Mongoose models)                                   │
│  - User → Projects (ownerId) → Tasks (projectId)             │
│  - User → assigned Tasks (assigneeId)                        │
│  - Activity (userId, entityType, entityId)                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Model (Mongoose, ObjectId references)

```
User  { name, email (unique), password (hashed), avatar, bio, role }
  └── Project { name, description, ownerId→User, status, progress }
        └── Task { title, description, projectId→Project, assigneeId→User,
                   status, priority, dueDate }
  └── Activity { userId→User, action, entityType, entityId, description }
```

---

## Folder Structure

```
devflow-ai/
├── prisma/                  (removed — using Mongoose)
├── src/
│   ├── app/
│   │   ├── api/              REST API (Route Handlers)
│   │   │   ├── auth/         register, login, logout, me
│   │   │   ├── projects/     CRUD + filters
│   │   │   ├── tasks/        CRUD + filters
│   │   │   ├── users/        CRUD
│   │   │   ├── activities/   list
│   │   │   ├── dashboard/    aggregated stats
│   │   │   ├── ai/           generate-tasks
│   │   │   └── health/       DB check
│   │   ├── layout.tsx        root layout (fonts, ThemeProvider, toasters)
│   │   ├── page.tsx          root: auth shell OR app shell + view router
│   │   └── globals.css       Tailwind + brand tokens (emerald, dark/light)
│   ├── components/
│   │   ├── ui/               shadcn/ui primitives
│   │   ├── common/           Logo, ThemeToggle, badges, EmptyState, ConfirmDialog, AnimatedCounter
│   │   ├── layout/           AppShell, Sidebar, Topbar, MobileNav, UserMenu
│   │   ├── auth/             AuthShell, brand panel, mode tabs
│   │   ├── dashboard/        StatsCard, ProgressCard, RecentActivity, ProjectOverview, TaskOverview
│   │   ├── projects/         ProjectCard, ProjectForm
│   │   ├── tasks/            TaskCard, TaskForm, TaskFilters, TaskList, KanbanBoard, GenerateTasksDialog
│   │   └── profile|settings/ profile/settings helpers
│   ├── pages/               view components (auth, dashboard, projects, tasks, profile, settings, not-found)
│   ├── store/               Zustand stores (auth, ui, data)
│   ├── services/             API client + service layer (auth, project, task, user, activity, dashboard, aiService + aiServiceClient)
│   ├── models/               Mongoose models (User, Project, Task, Activity)
│   └── lib/                  types, constants, db (Mongoose connect + auto-seed), auth, schemas (zod), serializers, api-response, seed
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites
- Node.js 18+ (Node 24 recommended for native TypeScript in the seed script)
- MongoDB 6+ **OR** leave `MONGODB_URI` unset to use the built-in in-memory MongoDB (auto-seeds demo data)

### Steps

```bash
# 1. Clone
git clone <your-repo-url> devflow-ai
cd devflow-ai

# 2. Install dependencies
bun install          # or: npm install / pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET. Leave MONGODB_URI empty for local dev.

# 4. (Optional) Seed the database manually
bun run db:seed      # uses Node's native TS support; clears + reseeds demo data
# Note: the app also auto-seeds on first connect if the DB is empty.

# 5. Start the dev server
bun run dev          # or: npm run dev
# Open http://localhost:3000
```

### Demo login
- **Email:** `alex@devflow.ai`
- **Password:** `password`

Other seeded users: `maya@devflow.ai`, `jordan@devflow.ai`, `sam@devflow.ai` (all `password`).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | No | MongoDB connection string. Empty → in-memory MongoDB (dev). Production: Atlas URI. |
| `JWT_SECRET` | **Yes** | Secret used to sign JWT auth tokens. Use a long random string. |
| `AI_ENABLED` | No | Set to `"true"` to use the live AI provider for task generation. Empty → heuristic generator. |
| `AI_API_KEY` | No | AI provider API key (server-side only, never exposed to client). |
| `NEXT_PUBLIC_API_URL` | No | Public backend origin if frontend deployed separately. Empty for monorepo. |
| `PORT` | No | Server port (default 3000). |

---

## Running Frontend

```bash
bun run dev
```
The frontend and backend run together in the Next.js dev server on `http://localhost:3000`.

## Running Backend

The backend is the Next.js Route Handlers under `/api/*` — it runs as part of the same dev server. There is no separate backend process to start.

To seed the database independently:
```bash
bun run db:seed
```

---

## API Documentation

All endpoints use the response envelope:
```json
{ "success": boolean, "message": string, "data": object|null, "error": string|null }
```

### Auth

| Method | Endpoint | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | — | `{ name, email, password }` | 201 `{ token, user }` | 409 email exists, 422 validation |
| POST | `/api/auth/login` | — | `{ email, password }` | 200 `{ token, user }` | 401 invalid creds, 422 validation |
| POST | `/api/auth/logout` | — | — | 200 | — |
| GET | `/api/auth/me` | Bearer | — | 200 `{ user }` | 401 |

### Users

| Method | Endpoint | Auth | Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/users` | Bearer | — | 200 `{ users }` | 401 |
| GET | `/api/users/:id` | Bearer | — | 200 `{ user }` | 404, 401 |
| PUT | `/api/users/:id` | Bearer (self) | `{ name?, email?, bio?, role?, avatar? }` | 200 `{ user }` | 403, 409 email, 422 |
| DELETE | `/api/users/:id` | Bearer (self) | — | 200 | 403 |

### Projects

| Method | Endpoint | Auth | Query / Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/projects` | Bearer | `?status=`, `?search=` | 200 `{ projects }` | 401 |
| GET | `/api/projects/:id` | Bearer (owner) | — | 200 `{ project, taskCounts, members, tasks }` | 404, 403 |
| POST | `/api/projects` | Bearer | `{ name, description?, status?, progress? }` | 201 `{ project }` | 422 |
| PUT | `/api/projects/:id` | Bearer (owner) | partial | 200 `{ project }` | 404, 403, 422 |
| DELETE | `/api/projects/:id` | Bearer (owner) | — | 200 | 404, 403 |

### Tasks

| Method | Endpoint | Auth | Query / Body | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/tasks` | Bearer | `?status=`, `?priority=`, `?project=`, `?search=`, `?assignee=` | 200 `{ tasks }` | 401 |
| GET | `/api/tasks/:id` | Bearer (owner) | — | 200 `{ task }` | 404, 403 |
| POST | `/api/tasks` | Bearer | `{ title, description?, projectId, assigneeId?, status?, priority?, dueDate? }` | 201 `{ task }` | 404 project, 403, 422 |
| PUT | `/api/tasks/:id` | Bearer (owner) | partial | 200 `{ task }` | 404, 403, 422 |
| DELETE | `/api/tasks/:id` | Bearer (owner) | — | 200 | 404, 403 |

### Activities

| Method | Endpoint | Auth | Query | Success |
|---|---|---|---|---|
| GET | `/api/activities` | Bearer | `?limit=`, `?entityType=` | 200 `{ activities }` |

### Dashboard

| Method | Endpoint | Auth | Success |
|---|---|---|---|
| GET | `/api/dashboard` | Bearer | 200 `{ stats, tasksByStatus, tasksByPriority, recentActivities, topProjects }` |

### AI

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/api/ai/generate-tasks` | Bearer | `{ prompt, count?, projectName? }` | 200 `{ tasks: GeneratedTask[], source }` |

### Health

| Method | Endpoint | Success |
|---|---|---|
| GET | `/api/health` | 200 `{ users, projects, tasks, activities }` |

### HTTP Status Codes used
`200` success · `201` created · `400` bad request · `401` unauthorized · `403` forbidden · `404` not found · `409` conflict · `422` validation error · `500` server error.

---

## AI Feature

### How AI task generation works

1. The user clicks **"AI"** on the Projects page → opens the **Generate Tasks with AI** dialog.
2. The user describes a project (e.g. *"Build an e-commerce website"*) and picks how many tasks to generate (3–12), and which project to add them to.
3. On **Generate**, the frontend calls `POST /api/ai/generate-tasks` with the prompt.
4. The server-side **`aiService`** (an abstraction layer so the provider can be swapped) calls the configured AI provider (`z-ai-web-dev-sdk`) with a strict JSON-only system prompt:
   ```
   Generate exactly N tasks as JSON: {"tasks":[{"title","description","priority"}]}
   ```
5. The AI returns structured tasks; the server parses + validates them and logs an activity (`generated`).
6. The user reviews the tasks (each with title, description, priority badge), can **edit priorities**, **select/deselect**, then clicks **Add Selected**.
7. Selected tasks are created via the task API and appear in the project board. **Nothing is inserted without user confirmation.**

### Buttons (per spec)
- **Generate Tasks** — initial generation
- **Regenerate** — re-run with the same prompt
- **Add Selected (N)** — adds the chosen tasks to the selected project
- **Cancel** — closes without adding

### Fallback & resilience
- If the live AI provider is unavailable or errors, the service falls back to a **deterministic heuristic generator** that produces sensible, structured tasks based on keywords in the prompt (web / mobile / API / e-commerce / AI projects). This keeps the feature demoable offline.
- Set `AI_ENABLED="true"` in `.env` to use the live LLM; leave empty for the heuristic generator.
- The AI API key comes from the environment (`AI_API_KEY`) — **never hard-coded**, never sent to the client.

---

## Screenshots

> _Insert screenshots here when preparing the demo._ Suggested shots:
>
> 1. **Login / Register** — the two-column auth shell with brand hero
> 2. **Dashboard** — stats cards, progress ring, charts, recent activity
> 3. **Projects** — project cards grid with filters
> 4. **Project details** — header, stats strip, task list
> 5. **Tasks — List view** — filtered task list
> 6. **Tasks — Board view** — Kanban with drag-and-drop
> 7. **AI Generate dialog** — generating + generated task review
> 8. **Profile** — profile header + stats
> 9. **Settings** — Appearance / Notifications / Account tabs
> 10. **Mobile** — drawer navigation + stacked cards

---

## Deployment

### Frontend + Backend → Vercel
This is a single Next.js app (frontend + API routes together), so deploy the whole app to **Vercel**:

1. Push the repo to GitHub.
2. In Vercel, **New Project** → import the repo.
3. Set environment variables (Project → Settings → Environment Variables):
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — a long random string
   - `AI_ENABLED` — `true`
   - `AI_API_KEY` — your AI provider key
4. Deploy. Vercel auto-detects Next.js.

### Database → MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add a database user and allow network access (`0.0.0.0/0` for testing, or restrict to Vercel IPs).
3. Copy the connection string → set as `MONGODB_URI` on Vercel.

### Alternative: Backend → Render (if splitting)
If you prefer a separate Express-style backend on Render, you can extract the `/api` routes — but the included Next.js Route Handlers are production-ready and simpler to deploy as one app on Vercel.

### Production checklist
- [ ] Set a strong `JWT_SECRET`
- [ ] Set `MONGODB_URI` to your Atlas cluster
- [ ] Set `AI_ENABLED=true` and `AI_API_KEY`
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Review CORS (same-origin on Vercel; configure if split)
- [ ] Remove the demo seed or guard it behind `NODE_ENV !== "production"` (the auto-seed only runs if the DB is empty, so it's safe — it won't overwrite real data)

---

## Demo Video

> _Add a link to your demo video here (Loom / YouTube / Google Drive)._ Suggested flow:
> 1. Register a new account (or login with the demo account)
> 2. Walk through the dashboard
> 3. Create a project, create a task, move it on the Kanban board
> 4. Open the AI dialog, generate tasks for "Build an e-commerce website", add a few
> 5. Toggle dark mode; resize to mobile

---

## Security

This project implements production-minded security practices:

- **Password hashing** — bcrypt (10 rounds); passwords are `select: false` in the schema and never serialized.
- **JWT authentication** — 30-day tokens, signed with `JWT_SECRET`; verified on every protected route.
- **Authorization** — ownership checks on project/task mutations (403 if not the owner).
- **Input validation** — Zod schemas on every write endpoint; valid enums for status/priority.
- **Centralized error handling** — consistent envelope, correct HTTP codes, no stack traces leaked.
- **Environment variables** — all secrets via env; `.env` in `.gitignore`; `.env.example` provided.
- **No exposed secrets** — API keys/JWT secret/database credentials never reach the client.
- **HTTP-only auth cookie** — `devflow.token` cookie is `httpOnly` + `sameSite=lax` (Bearer header also supported).

### Production hardening still recommended
- Add **Helmet**-style security headers (Vercel adds most automatically).
- Add **rate limiting** to auth + AI endpoints.
- Add **CORS** configuration if splitting frontend/backend across origins.
- Run the MongoDB connection over TLS (Atlas does this by default).
- Rotate `JWT_SECRET` periodically.

---

## Testing

Manual end-to-end testing was performed covering:

- ✅ Authentication: register (new + duplicate + validation), login (valid + invalid + validation), logout, /me
- ✅ Project CRUD: create, read (list + details), update, delete (with ownership 403/404)
- ✅ Task CRUD: create, read, update, delete (with ownership + project validation)
- ✅ Task status updates (Kanban drag-and-drop + inline dropdown)
- ✅ Task filtering: status, priority, project, search, assignee (and combinations)
- ✅ Authorization: protected routes return 401 without token; ownership returns 403
- ✅ Validation: all 422 paths (zod)
- ✅ MongoDB operations: Mongoose models, ObjectId refs, populate, indexes
- ✅ AI task generation: live AI provider + heuristic fallback
- ✅ Responsive: mobile drawer, stacked cards, touch targets
- ✅ Dark/light mode toggle

To run lint:
```bash
bun run lint
```

---

## Future Improvements

- **Real-time collaboration** — WebSocket/SSE for live multi-user task boards
- **AI task summarization** — summarize a project's task list into a status report
- **AI project description generation** — draft a project description from a title
- **AI productivity suggestions** — suggest next actions / prioritization
- **Email notifications** — integrate an email provider for reminders
- **Pagination** — for large task/project lists
- **Team invitations** — invite users to a workspace (currently single-owner projects)
- **Audit log** — detailed change history per entity
- **Mobile app** — React Native companion (the API is ready)
- **Internationalization** — `next-intl` is already installed
- **OpenAPI/Swagger** — auto-generated API docs

---

## License

MIT — free to use for learning and portfolios.
