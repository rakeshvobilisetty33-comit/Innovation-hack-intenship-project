// AI service abstraction (Phase 10).
//
// Implements AI-ASSISTED TASK GENERATION. The provider is abstracted so it can
// be swapped without touching call sites. The primary provider is z-ai-web-dev-sdk
// (LLM), keyed via environment variables. If the SDK/key is unavailable, the
// service falls back to a deterministic heuristic generator so the feature stays
// demoable offline.
//
// IMPORTANT: The z-ai-web-dev-sdk is loaded via a DYNAMIC import and ONLY when
// AI_ENABLED="true". This keeps the large SDK out of the bundler graph (and the
// dev-server heap) when the live AI provider isn't being used.
//
// NEVER hard-code API keys. The SDK reads its credentials from the environment.
// z-ai-web-dev-sdk MUST run on the server only (this file is server-only).

import {
  heuristicTasks,
  type GeneratedTask,
  type GenerateTasksInput,
} from "@/services/ai-heuristic";

export type { GeneratedTask, GenerateTasksInput };

// Lazy-loaded AI provider — only imported when AI_ENABLED="true".
async function generateWithAI(input: GenerateTasksInput): Promise<GeneratedTask[]> {
  const ZAI = (await import("z-ai-web-dev-sdk")).default;
  const zai = await ZAI.create();
  const count = input.count && input.count > 0 ? Math.min(input.count, 12) : 8;
  const systemPrompt = `You are an expert project planner and senior software engineer. Break a project description into a structured list of actionable development tasks. Respond with VALID JSON ONLY — no prose, no code fences. Schema: {"tasks":[{"title":string,"description":string,"priority":"low"|"medium"|"high"|"urgent"}]}. Produce exactly ${count} tasks in logical execution order. Titles concise (max 60 chars). Descriptions 1-2 sentences. Priorities distributed sensibly (a few high/medium, fewer urgent/low).`;
  const userPrompt = `Project description: "${input.prompt}"${input.projectName ? `\nProject name: ${input.projectName}` : ""}\n\nGenerate ${count} tasks as JSON.`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    thinking: { type: "disabled" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");

  // Defensive JSON extraction (strip code fences, grab first {...} block).
  let t = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = t.search(/[{[]/);
  if (start === -1) throw new Error("No JSON in AI response");
  const open = t[start];
  const close = open === "{" ? "}" : "]";
  const end = t.lastIndexOf(close);
  if (end === -1 || end <= start) throw new Error("Truncated JSON in AI response");
  const parsed = JSON.parse(t.slice(start, end + 1)) as { tasks?: unknown };
  const arr = Array.isArray(parsed?.tasks) ? parsed.tasks : Array.isArray(parsed) ? parsed : null;
  if (!arr) throw new Error("AI response missing tasks array");

  const validPriorities = new Set<GeneratedTask["priority"]>(["low", "medium", "high", "urgent"]);
  const tasks: GeneratedTask[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const t2 = item as Record<string, unknown>;
    const title = typeof t2.title === "string" ? t2.title.trim().slice(0, 200) : "";
    const description = typeof t2.description === "string" ? t2.description.trim().slice(0, 2000) : "";
    let priority: GeneratedTask["priority"] = "medium";
    if (typeof t2.priority === "string" && validPriorities.has(t2.priority as GeneratedTask["priority"])) {
      priority = t2.priority as GeneratedTask["priority"];
    }
    if (!title) continue;
    tasks.push({ title, description: description || title, priority });
    if (tasks.length >= count) break;
  }
  if (tasks.length === 0) throw new Error("AI produced no valid tasks");
  return tasks;
}

// ──────────────────────────────────────────────────────────────────────
// Public API. Tries the AI provider first; on any error falls back to the
// heuristic generator so the feature is always demoable.
//
// Set AI_ENABLED="true" to use the live LLM provider; otherwise (and on any
// error) the heuristic generator is used. In production set AI_ENABLED="true"
// with the SDK's key (AI_API_KEY).
// ──────────────────────────────────────────────────────────────────────
export async function generateTasks(input: GenerateTasksInput): Promise<{
  tasks: GeneratedTask[];
  source: "ai" | "heuristic";
}> {
  if (process.env.AI_ENABLED !== "true" || process.env.AI_DISABLED === "true") {
    return { tasks: heuristicTasks(input), source: "heuristic" };
  }
  try {
    const tasks = await generateWithAI(input);
    return { tasks, source: "ai" };
  } catch (e) {
    console.error("[ai] generation failed, using heuristic fallback:", e);
    return { tasks: heuristicTasks(input), source: "heuristic" };
  }
}
