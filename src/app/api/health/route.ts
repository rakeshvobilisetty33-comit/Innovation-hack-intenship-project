import { connectDB } from "@/lib/db";
import { User, Project, Task, Activity } from "@/models";
import { ok, serverError } from "@/lib/api-response";

export async function GET() {
  try {
    await connectDB();
    const [users, projects, tasks, activities] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Task.countDocuments(),
      Activity.countDocuments(),
    ]);
    return ok({ users, projects, tasks, activities }, "DB connected via Mongoose");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "DB error");
  }
}
