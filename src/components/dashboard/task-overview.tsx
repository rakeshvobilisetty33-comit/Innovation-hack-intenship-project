"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PRIORITY_LIST,
  PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LIST,
} from "@/lib/constants";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

// Status colors mirror the dot indicators from constants.
// Sky is permitted (in-progress). Emerald = brand. Slate = neutral.
const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "oklch(0.7 0.01 250)",
  "in-progress": "oklch(0.68 0.13 232)",
  done: "var(--brand)",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "oklch(0.7 0.01 250)",
  medium: "oklch(0.68 0.13 232)",
  high: "oklch(0.7 0.18 55)",
  urgent: "oklch(0.62 0.22 25)",
};

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  payload?: { label?: string; value?: number; color?: string };
}

function ChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  total: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const label = item?.payload?.label ?? item?.name ?? "";
  const value = item?.payload?.value ?? item?.value ?? 0;
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="recharts-default-tooltip min-w-[10rem] rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-soft">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: item?.payload?.color }}
        />
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
        <span>{value} tasks</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}

function ChartPanel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{caption}</p>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export interface TaskOverviewProps {
  tasks: Task[];
  className?: string;
}

export function TaskOverview({ tasks, className }: TaskOverviewProps) {
  const totalTasks = tasks.length;

  const statusData = React.useMemo(
    () =>
      TASK_STATUS_LIST.map((status) => ({
        status,
        label: TASK_STATUSES[status].label,
        value: tasks.filter((t) => t.status === status).length,
        color: STATUS_COLOR[status],
      })),
    [tasks],
  );

  const priorityData = React.useMemo(
    () =>
      PRIORITY_LIST.map((priority) => ({
        priority,
        label: PRIORITIES[priority].label,
        value: tasks.filter((t) => t.priority === priority).length,
        color: PRIORITY_COLOR[priority],
      })),
    [tasks],
  );

  const statusAria = statusData
    .map((d) => `${d.label} ${d.value}`)
    .join(", ");
  const priorityAria = priorityData
    .map((d) => `${d.label} ${d.value}`)
    .join(", ");

  return (
    <Card className={cn("h-full gap-0 p-5 sm:p-6", className)}>
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-semibold">Tasks overview</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {totalTasks === 0 ? (
          <div className="flex h-[280px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>No tasks yet.</p>
            <p className="mt-1 text-xs">
              Create a task or use AI generation from a project.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Donut: Tasks by Status */}
            <ChartPanel
              title="By status"
              caption={`${totalTasks} total`}
            >
              <div
                className="relative h-[220px] w-full"
                role="img"
                aria-label={`Tasks by status donut chart: ${statusAria}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={56}
                      outerRadius={84}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive
                      animationDuration={700}
                    >
                      {statusData.map((entry) => (
                        <Cell key={`status-${entry.status}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip total={totalTasks} />}
                      cursor={false}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold tabular-nums">
                    {totalTasks}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    tasks
                  </span>
                </div>
              </div>
              {/* Custom legend */}
              <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                {statusData.map((d) => (
                  <li
                    key={`legend-status-${d.status}`}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium tabular-nums">{d.value}</span>
                  </li>
                ))}
              </ul>
            </ChartPanel>

            {/* Bar: Tasks by Priority */}
            <ChartPanel
              title="By priority"
              caption="across all projects"
            >
              <div
                className="h-[220px] w-full"
                role="img"
                aria-label={`Tasks by priority bar chart: ${priorityAria}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorityData}
                    margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                  >
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      dy={6}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                      width={32}
                    />
                    <Tooltip
                      content={<ChartTooltip total={totalTasks} />}
                      cursor={{
                        fill: "color-mix(in oklch, var(--brand) 8%, transparent)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={56}
                      isAnimationActive
                      animationDuration={700}
                    >
                      {priorityData.map((entry) => (
                        <Cell
                          key={`priority-${entry.priority}`}
                          fill={entry.color}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                {priorityData.map((d) => (
                  <li
                    key={`legend-priority-${d.priority}`}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium tabular-nums">{d.value}</span>
                  </li>
                ))}
              </ul>
            </ChartPanel>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
