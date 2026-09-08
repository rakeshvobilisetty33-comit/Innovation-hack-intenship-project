import type {
  Priority,
  ProjectStatus,
  TaskStatus,
} from "@/lib/types";

// Centralized metadata for status/priority badges + filters + charts.
// `badge` = tailwind classes (stateless), `dot` = solid color indicator.

export const PROJECT_STATUSES: Record<
  ProjectStatus,
  { label: string; badge: string; dot: string; chartColor?: string }
> = {
  planning: {
    label: "Planning",
    badge:
      "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/25",
    dot: "bg-amber-500",
  },
  active: {
    label: "Active",
    badge:
      "bg-brand/12 text-brand dark:text-[color-mix(in_oklch,var(--brand)_65%,white)] border-brand/25",
    dot: "bg-brand",
  },
  completed: {
    label: "Completed",
    badge:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  archived: {
    label: "Archived",
    badge:
      "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 border-zinc-500/25",
    dot: "bg-zinc-400",
  },
};

export const TASK_STATUSES: Record<
  TaskStatus,
  { label: string; badge: string; dot: string }
> = {
  todo: {
    label: "To Do",
    badge: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 border-zinc-500/25",
    dot: "bg-zinc-400",
  },
  "in-progress": {
    label: "In Progress",
    badge:
      "bg-blue-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25",
    dot: "bg-sky-500",
  },
  done: {
    label: "Done",
    badge:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    dot: "bg-emerald-500",
  },
};

export const PRIORITIES: Record<
  Priority,
  { label: string; badge: string; dot: string; weight: number }
> = {
  low: {
    label: "Low",
    badge: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 border-zinc-500/25",
    dot: "bg-zinc-400",
    weight: 1,
  },
  medium: {
    label: "Medium",
    badge:
      "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/25",
    dot: "bg-sky-500",
    weight: 2,
  },
  high: {
    label: "High",
    badge:
      "bg-orange-500/12 text-orange-700 dark:text-orange-300 border-orange-500/25",
    dot: "bg-orange-500",
    weight: 3,
  },
  urgent: {
    label: "Urgent",
    badge: "bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/25",
    dot: "bg-red-500",
    weight: 4,
  },
};

export const PROJECT_STATUS_LIST = Object.keys(PROJECT_STATUSES) as ProjectStatus[];
export const TASK_STATUS_LIST = Object.keys(TASK_STATUSES) as TaskStatus[];
export const PRIORITY_LIST = Object.keys(PRIORITIES) as Priority[];

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = d - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const suffix = diff >= 0 ? "" : " ago";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m${suffix}`;
  if (hrs < 24) return `${hrs}h${suffix}`;
  if (days < 30) return `${days}d${suffix}`;
  return formatDate(iso);
}

export function isOverdue(dueDate?: string | null, status?: string): boolean {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate).getTime() < Date.now();
}
