// GET /api/dashboard — aggregated dashboard stats for the authenticated user.
// Returns:
//   stats           — { totalProjects, activeProjects, completedProjects,
//                       totalTasks, completedTasks, pendingTasks, overdueTasks,
//                       overallProgress, completionRate }
//   tasksByStatus   — [{ status: "todo"|"in-progress"|"done", count }]
//   tasksByPriority — [{ priority: "low"|"medium"|"high"|"urgent", count }]
//   recentActivities — latest 6 activities (serialized, with userName)
//   topProjects     — top 6 projects by updatedAt desc (serialized, with ownerName)
// All data is scoped to the authenticated user's projects and their tasks.

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Project, Task, Activity } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api-response";
import { serializeProject, serializeActivity } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    await connectDB();

    const userId = user._id;

    // User's projects (need full docs for progress, plus ids for task filtering).
    const projects = await Project.find({ ownerId: userId }).lean();
    const projectIds = projects.map((p) => p._id);

    // Tasks across all the user's projects.
    const tasks = await Task.find({ projectId: { $in: projectIds } }).lean();

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const completedProjects = projects.filter((p) => p.status === "completed").length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const pendingTasks = totalTasks - completedTasks;
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now,
    ).length;

    const overallProgress = totalProjects
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects)
      : 0;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      overallProgress,
      completionRate,
    };

    // Tasks grouped by status (always all three buckets, even if zero).
    const tasksByStatus = (["todo", "in-progress", "done"] as const).map((status) => ({
      status,
      count: tasks.filter((t) => t.status === status).length,
    }));

    // Tasks grouped by priority (always all four buckets, even if zero).
    const tasksByPriority = (["low", "medium", "high", "urgent"] as const).map((priority) => ({
      priority,
      count: tasks.filter((t) => t.priority === priority).length,
    }));

    // Recent activities for the user (latest 6), populated with user name.
    const recentRaw = await Activity.find({ userId })
      .populate({ path: "userId", select: "name" })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    const recentActivities = recentRaw.map((a) => {
      const populated = a.userId as unknown as { _id: { toString(): string }; name?: string } | null;
      return serializeActivity({
        ...a,
        userId: populated ? populated._id : null,
        user: populated ? { name: populated.name ?? null } : null,
      } as Parameters<typeof serializeActivity>[0]);
    });

    // Top 6 projects by updatedAt. All of them belong to the current user, so we
    // already know the owner name — no populate needed (avoids replacing the
    // ObjectId `ownerId` with a populated doc, which serializeProject doesn't
    // expect). We attach the owner doc to `owner` so the serializer can read
    // `ownerName` from it.
    const topRaw = await Project.find({ ownerId: userId })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();
    const topProjects = topRaw.map((p) =>
      serializeProject({
        ...p,
        owner: { name: user.name },
      } as Parameters<typeof serializeProject>[0]),
    );

    return ok(
      { stats, tasksByStatus, tasksByPriority, recentActivities, topProjects },
      "Dashboard stats",
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return serverError(message);
  }
}
