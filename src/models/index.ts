// Mongoose models for DevFlow AI.
// Relationships use ObjectId refs:
//   User → Projects (ownerId), Project → Tasks (projectId),
//   User → assigned Tasks (assigneeId), Activity → User (userId).

import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// ── User ────────────────────────────────────────────────────────────────
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

// Always exclude password from toJSON.
userSchema.method("toJSON", function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
});

export const User = models.User || model("User", userSchema);

// ── Project ──────────────────────────────────────────────────────────────
const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 1000 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "archived"],
      default: "planning",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true },
);

export const Project = models.Project || model("Project", projectSchema);

// ── Task ─────────────────────────────────────────────────────────────────
const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Task = models.Task || model("Task", taskSchema);

// ── Activity ──────────────────────────────────────────────────────────────
const activitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true }, // created | updated | deleted | completed | generated
    entityType: {
      type: String,
      enum: ["project", "task", "user", "ai"],
      required: true,
    },
    entityId: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ entityType: 1, entityId: 1 });

export const Activity = models.Activity || model("Activity", activitySchema);
