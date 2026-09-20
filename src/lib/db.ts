// MongoDB connection via Mongoose.
// Uses MONGODB_URI if provided (production Atlas). Otherwise spins up an
// in-process mongodb-memory-server (a REAL MongoDB binary) for local dev.
// The connection is cached across hot-reloads and auto-seeds on first connect.

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import { User, Project, Task, Activity } from "@/models";

const MONGODB_URI = process.env.MONGODB_URI;
const GLOBAL_KEY = "__devflow_mongo__";

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memServer: MongoMemoryServer | null;
  seeded: boolean;
};

const globalCache = globalThis as unknown as { [GLOBAL_KEY]?: Cached };
const cache: Cached = globalCache[GLOBAL_KEY] ?? {
  conn: null,
  promise: null,
  memServer: null,
  seeded: false,
};
if (!globalCache[GLOBAL_KEY]) globalCache[GLOBAL_KEY] = cache;

async function resolveUri(): Promise<string> {
  if (MONGODB_URI) return MONGODB_URI;
  if (!cache.memServer) {
    cache.memServer = await MongoMemoryServer.create({
      instance: { dbName: "devflow_ai" },
    });
    console.log("[mongo] In-memory MongoDB started");
  }
  return cache.memServer.getUri();
}

async function seedIfEmpty() {
  if (cache.seeded) return;
  cache.seeded = true;
  const userCount = await User.countDocuments();
  if (userCount > 0) return; // Don't seed if data already exists.
  console.log("[mongo] Seeding demo data…");
  const day = 86_400_000;
  const iso = (offsetMs: number) => new Date(Date.now() + offsetMs);
  const passwordHash = await bcrypt.hash("password", 10);

  const alex = await User.create({
    name: "Alex Rivera", email: "alex@devflow.ai", password: passwordHash,
    role: "Software Engineer",
    bio: "Full-stack developer building delightful products. Coffee-driven.",
  });
  const maya = await User.create({ name: "Maya Chen", email: "maya@devflow.ai", password: passwordHash, role: "Product Designer" });
  const jordan = await User.create({ name: "Jordan Park", email: "jordan@devflow.ai", password: passwordHash, role: "Backend Engineer" });
  const sam = await User.create({ name: "Sam Okafor", email: "sam@devflow.ai", password: passwordHash, role: "QA Engineer" });

  const projects = await Project.create([
    { name: "DevFlow AI Web App", description: "Build the core DevFlow AI SaaS dashboard with projects, tasks, kanban and AI task generation.", ownerId: alex._id, status: "active", progress: 62, createdAt: iso(-30 * day), updatedAt: iso(-2 * day) },
    { name: "Mobile Companion App", description: "React Native companion for on-the-go task triage and notifications.", ownerId: alex._id, status: "planning", progress: 12, createdAt: iso(-14 * day), updatedAt: iso(-1 * day) },
    { name: "Marketing Website", description: "Landing page, pricing, blog and docs for the DevFlow AI launch.", ownerId: alex._id, status: "active", progress: 38, createdAt: iso(-21 * day), updatedAt: iso(-6 * day) },
    { name: "Internal Admin Tools", description: "Operational dashboards for support, billing analytics and user management.", ownerId: alex._id, status: "completed", progress: 100, createdAt: iso(-90 * day), updatedAt: iso(-12 * day) },
    { name: "Legacy Migration", description: "Sunset the v1 monolith and migrate data to the new platform.", ownerId: alex._id, status: "archived", progress: 100, createdAt: iso(-180 * day), updatedAt: iso(-60 * day) },
    { name: "Design System v2", description: "Token-driven theming, accessible components and dark mode polish.", ownerId: alex._id, status: "active", progress: 74, createdAt: iso(-45 * day), updatedAt: iso(-3 * day) },
  ]);
  const [p1, p2, p3, p4, , p6] = projects;

  await Task.create([
    { title: "Design dashboard layout", description: "Create the dashboard grid, stat cards and chart layout.", projectId: p1._id, assigneeId: maya._id, status: "done", priority: "high", dueDate: iso(-5 * day), createdAt: iso(-20 * day), updatedAt: iso(-4 * day) },
    { title: "Implement auth flow", description: "Register, login, JWT, protected routes and logout.", projectId: p1._id, assigneeId: alex._id, status: "in-progress", priority: "urgent", dueDate: iso(2 * day), createdAt: iso(-18 * day), updatedAt: iso(-1 * day) },
    { title: "Build project CRUD", description: "Create, read, update, delete projects with validation.", projectId: p1._id, assigneeId: jordan._id, status: "in-progress", priority: "high", dueDate: iso(4 * day), createdAt: iso(-16 * day), updatedAt: iso(-2 * day) },
    { title: "Kanban drag & drop", description: "Implement the kanban board with @dnd-kit and status sync.", projectId: p1._id, assigneeId: alex._id, status: "todo", priority: "medium", dueDate: iso(7 * day), createdAt: iso(-10 * day), updatedAt: iso(-3 * day) },
    { title: "AI task generation", description: "Wire the AI service and the generate-tasks review modal.", projectId: p1._id, assigneeId: alex._id, status: "todo", priority: "high", dueDate: iso(10 * day), createdAt: iso(-8 * day), updatedAt: iso(-2 * day) },
    { title: "Analytics charts", description: "Recharts for tasks by status/priority and project progress.", projectId: p1._id, assigneeId: maya._id, status: "done", priority: "medium", dueDate: iso(-2 * day), createdAt: iso(-12 * day), updatedAt: iso(-1 * day) },
    { title: "Push notifications", description: "Realtime notification center and toast system.", projectId: p2._id, assigneeId: sam._id, status: "todo", priority: "low", dueDate: iso(14 * day), createdAt: iso(-5 * day), updatedAt: iso(-1 * day) },
    { title: "Offline sync", description: "Queue actions offline and reconcile on reconnect.", projectId: p2._id, assigneeId: jordan._id, status: "todo", priority: "medium", dueDate: iso(20 * day), createdAt: iso(-4 * day), updatedAt: iso(-2 * day) },
    { title: "Landing hero section", description: "Animated hero with gradient and CTA.", projectId: p3._id, assigneeId: maya._id, status: "in-progress", priority: "high", dueDate: iso(-1 * day), createdAt: iso(-15 * day), updatedAt: iso(-1 * day) },
    { title: "Pricing page", description: "Three-tier pricing table with monthly/yearly toggle.", projectId: p3._id, assigneeId: maya._id, status: "todo", priority: "medium", dueDate: iso(5 * day), createdAt: iso(-7 * day), updatedAt: iso(-3 * day) },
    { title: "Tokenize color palette", description: "Move all colors to OKLCH tokens with dark mode variants.", projectId: p6._id, assigneeId: maya._id, status: "done", priority: "medium", dueDate: iso(-3 * day), createdAt: iso(-30 * day), updatedAt: iso(-2 * day) },
    { title: "Accessibility audit", description: "WCAG AA pass on all interactive components.", projectId: p6._id, assigneeId: sam._id, status: "in-progress", priority: "high", dueDate: iso(3 * day), createdAt: iso(-9 * day), updatedAt: iso(-1 * day) },
    { title: "Component docs", description: "Document props, variants and usage examples.", projectId: p6._id, assigneeId: maya._id, status: "todo", priority: "low", dueDate: iso(12 * day), createdAt: iso(-6 * day), updatedAt: iso(-2 * day) },
    { title: "Billing analytics view", description: "MRR, churn and revenue charts for the admin panel.", projectId: p4._id, assigneeId: jordan._id, status: "done", priority: "high", dueDate: iso(-20 * day), createdAt: iso(-40 * day), updatedAt: iso(-15 * day) },
  ]);

  await Activity.create([
    { userId: alex._id, action: "completed", entityType: "task", entityId: "task_seed", description: "completed task “Analytics charts” in DevFlow AI Web App", createdAt: iso(-2 * 3_600_000) },
    { userId: jordan._id, action: "updated", entityType: "task", entityId: "task_seed", description: "moved “Build project CRUD” to In Progress", createdAt: iso(-5 * 3_600_000) },
    { userId: alex._id, action: "created", entityType: "project", entityId: String(p6._id), description: "created project “Design System v2”", createdAt: iso(-26 * 3_600_000) },
    { userId: maya._id, action: "updated", entityType: "project", entityId: String(p3._id), description: "updated progress on “Marketing Website” to 38%", createdAt: iso(-30 * 3_600_000) },
    { userId: sam._id, action: "created", entityType: "task", entityId: "task_seed", description: "created task “Push notifications”", createdAt: iso(-48 * 3_600_000) },
    { userId: alex._id, action: "generated", entityType: "ai", entityId: "ai_seed", description: "generated 9 tasks with AI for “Build an e-commerce website”", createdAt: iso(-50 * 3_600_000) },
    { userId: jordan._id, action: "completed", entityType: "project", entityId: String(p4._id), description: "marked project “Internal Admin Tools” as completed", createdAt: iso(-70 * 3_600_000) },
  ]);
  console.log("[mongo] Seed complete: 4 users, 6 projects, 14 tasks, 7 activities");
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = (async () => {
      const uri = await resolveUri();
      mongoose.set("strictQuery", true);
      const conn = await mongoose.connect(uri, {
        bufferCommands: false,
        autoIndex: true,
      });
      return conn;
    })();
  }
  try {
    cache.conn = await cache.promise;
    await seedIfEmpty();
  } catch (e) {
    cache.promise = null;
    throw e;
  }
  return cache.conn;
}
