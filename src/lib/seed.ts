// DevFlow AI — Mongoose seed (Node-native, no path aliases).
// Run with: node --experimental-strip-types --no-warnings src/lib/seed.ts

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";

// Models inlined here so Node's native TS stripper doesn't need path aliases.
const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 280 },
    role: { type: String, default: "Member", maxlength: 80 },
  },
  { timestamps: true },
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 1000 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["planning", "active", "completed", "archived"], default: "planning" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true },
);

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

const activitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    entityType: { type: String, enum: ["project", "task", "user", "ai"], required: true },
    entityId: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const User = models.User || model("User", userSchema);
const Project = models.Project || model("Project", projectSchema);
const Task = models.Task || model("Task", taskSchema);
const Activity = models.Activity || model("Activity", activitySchema);

const day = 86_400_000;
const iso = (offsetMs) => new Date(Date.now() + offsetMs);

async function main() {
  console.log("🌱 Seeding DevFlow AI (MongoDB)...");
  const mem = await MongoMemoryServer.create({ instance: { dbName: "devflow_ai" } });
  const uri = await mem.getUri();
  console.log(`[mongo] ${uri}`);
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  await Promise.all([
    Activity.deleteMany({}),
    Task.deleteMany({}),
    Project.deleteMany({}),
    User.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("password", 10);

  const alex = await User.create({ name: "Alex Rivera", email: "alex@devflow.ai", password: passwordHash, role: "Software Engineer", bio: "Full-stack developer building delightful products. Coffee-driven." });
  const maya = await User.create({ name: "Maya Chen", email: "maya@devflow.ai", password: passwordHash, role: "Product Designer" });
  const jordan = await User.create({ name: "Jordan Park", email: "jordan@devflow.ai", password: passwordHash, role: "Backend Engineer" });
  const sam = await User.create({ name: "Sam Okafor", email: "sam@devflow.ai", password: passwordHash, role: "QA Engineer" });
  console.log("  ✓ 4 users");

  const projects = await Project.create([
    { name: "DevFlow AI Web App", description: "Build the core DevFlow AI SaaS dashboard with projects, tasks, kanban and AI task generation.", ownerId: alex._id, status: "active", progress: 62, createdAt: iso(-30 * day), updatedAt: iso(-2 * day) },
    { name: "Mobile Companion App", description: "React Native companion for on-the-go task triage and notifications.", ownerId: alex._id, status: "planning", progress: 12, createdAt: iso(-14 * day), updatedAt: iso(-1 * day) },
    { name: "Marketing Website", description: "Landing page, pricing, blog and docs for the DevFlow AI launch.", ownerId: alex._id, status: "active", progress: 38, createdAt: iso(-21 * day), updatedAt: iso(-6 * day) },
    { name: "Internal Admin Tools", description: "Operational dashboards for support, billing analytics and user management.", ownerId: alex._id, status: "completed", progress: 100, createdAt: iso(-90 * day), updatedAt: iso(-12 * day) },
    { name: "Legacy Migration", description: "Sunset the v1 monolith and migrate data to the new platform.", ownerId: alex._id, status: "archived", progress: 100, createdAt: iso(-180 * day), updatedAt: iso(-60 * day) },
    { name: "Design System v2", description: "Token-driven theming, accessible components and dark mode polish.", ownerId: alex._id, status: "active", progress: 74, createdAt: iso(-45 * day), updatedAt: iso(-3 * day) },
  ]);
  const [p1, p2, p3, p4, , p6] = projects;
  console.log(`  ✓ ${projects.length} projects`);

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
  console.log("  ✓ 14 tasks");

  await Activity.create([
    { userId: alex._id, action: "completed", entityType: "task", entityId: "task_seed", description: "completed task “Analytics charts” in DevFlow AI Web App", createdAt: iso(-2 * 3_600_000) },
    { userId: jordan._id, action: "updated", entityType: "task", entityId: "task_seed", description: "moved “Build project CRUD” to In Progress", createdAt: iso(-5 * 3_600_000) },
    { userId: alex._id, action: "created", entityType: "project", entityId: String(p6._id), description: "created project “Design System v2”", createdAt: iso(-26 * 3_600_000) },
    { userId: maya._id, action: "updated", entityType: "project", entityId: String(p3._id), description: "updated progress on “Marketing Website” to 38%", createdAt: iso(-30 * 3_600_000) },
    { userId: sam._id, action: "created", entityType: "task", entityId: "task_seed", description: "created task “Push notifications”", createdAt: iso(-48 * 3_600_000) },
    { userId: alex._id, action: "generated", entityType: "ai", entityId: "ai_seed", description: "generated 9 tasks with AI for “Build an e-commerce website”", createdAt: iso(-50 * 3_600_000) },
    { userId: jordan._id, action: "completed", entityType: "project", entityId: String(p4._id), description: "marked project “Internal Admin Tools” as completed", createdAt: iso(-70 * 3_600_000) },
  ]);
  console.log("  ✓ 7 activities");

  console.log("\n✅ Seed complete. Demo login: alex@devflow.ai / password");
  await mongoose.disconnect();
  await mem.stop();
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
