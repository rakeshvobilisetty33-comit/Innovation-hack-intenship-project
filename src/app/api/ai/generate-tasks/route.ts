import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { logActivity } from "@/lib/serializers";
import { ok, validationError, unauthorized, serverError } from "@/lib/api-response";
import { generateTasks, type GeneratedTask } from "@/services/aiService";
import { z } from "zod";

const generateSchema = z.object({
  prompt: z.string().min(3, "Describe your project in a few words").max(400),
  count: z.number().int().min(1).max(12).optional(),
  projectName: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  await connectDB();

  try {
    const { tasks, source } = await generateTasks({
      prompt: parsed.data.prompt,
      count: parsed.data.count,
      projectName: parsed.data.projectName,
    });

    await logActivity({
      userId: String(user._id),
      action: "generated",
      entityType: "ai",
      entityId: `ai_${Date.now()}`,
      description: `generated ${tasks.length} tasks with AI for “${parsed.data.prompt.slice(0, 60)}”`,
    });

    const payload: { tasks: GeneratedTask[]; source: string } = { tasks, source };
    return ok(payload, "Tasks generated");
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "AI generation failed");
  }
}
