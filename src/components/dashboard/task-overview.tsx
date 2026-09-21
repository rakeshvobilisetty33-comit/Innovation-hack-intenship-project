"use client";

import * as React from "react";
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

// ── Donut chart (pure SVG, no recharts) ────────────────────────────────
function DonutChart({
  data,
  total,
  size = 180,
}: {
  data: { label: string; value: number; color: string }[];
  total: number;
  size?: number;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = data.filter((d) => d.value > 0);
  // Cumulative offsets (no mutation during render).
  const offsets = segments.reduce<number[]>((arr, d) => {
    const prev = arr.length > 0 ? arr[arr.length - 1] : 0;
    const frac = total > 0 ? d.value / total : 0;
    arr.push(prev + frac * circumference);
    return arr;
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="color-mix(in oklch, var(--muted-foreground) 12%, transparent)"
          strokeWidth={stroke}
        />
        {segments.map((d, i) => {
          const frac = total > 0 ? d.value / total : 0;
          const len = frac * circumference;
          const gap = circumference - len;
          const seg = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={hover === i ? stroke + 4 : stroke}
              strokeDasharray={`${Math.max(len - 2, 0.5)} ${gap + 2}`}
              strokeDashoffset={-offsets[i]}
              strokeLinecap="butt"
              style={{
                transition: "stroke-width 150ms ease",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          );
          return seg;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        {hover !== null ? (
          <>
            <span className="text-2xl font-semibold tabular-nums">
              {segments[hover].value}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {segments[hover].label}
            </span>
          </>
        ) : (
          <>
            <span className="text-2xl font-semibold tabular-nums">{total}</span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              tasks
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Bar chart (pure SVG, no recharts) ──────────────────────────────────
function BarChart({
  data,
  total,
  height = 200,
}: {
  data: { label: string; value: number; color: string }[];
  total: number;
  height?: number;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 48;
  const gap = 16;
  const chartH = height - 32; // leave room for labels
  const width = data.length * barWidth + (data.length - 1) * gap + 16;

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="mx-auto"
        style={{ maxWidth: width }}
      >
        {/* Y gridlines (3 levels) */}
        {[0, 0.5, 1].map((g) => (
          <line
            key={g}
            x1={8}
            x2={width - 8}
            y1={8 + g * (chartH - 16)}
            y2={8 + g * (chartH - 16)}
            stroke="color-mix(in oklch, var(--muted-foreground) 10%, transparent)"
            strokeWidth={1}
          />
        ))}
        {data.map((d, i) => {
          const rawH = (d.value / max) * (chartH - 16);
          const h = d.value > 0 ? Math.max(rawH, 4) : 0;
          const x = 8 + i * (barWidth + gap);
          const y = chartH - h + 4;
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Subtle background track */}
              <rect
                x={x}
                y={8}
                width={barWidth}
                height={chartH - 4}
                rx={6}
                fill="color-mix(in oklch, var(--muted-foreground) 4%, transparent)"
              />
              {/* Animated active bar */}
              <rect
                x={x}
                y={d.value > 0 ? y : chartH + 2}
                width={barWidth}
                height={d.value > 0 ? h : 2}
                rx={6}
                fill={d.color}
                opacity={hover === null || hover === i ? 1 : 0.45}
                style={{
                  transition:
                    "height 350ms cubic-bezier(0.4, 0, 0.2, 1), y 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease",
                }}
              />
              {/* Value label on top (when hovered or always for non-zero) */}
              {(hover === i || d.value > 0) && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--foreground)"
                  className="tabular-nums select-none"
                  style={{
                    transition: "y 350ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {d.value}
                </text>
              )}
              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize={11}
                fill="var(--muted-foreground)"
                className="select-none"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
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

  const statusAria = statusData.map((d) => `${d.label} ${d.value}`).join(", ");
  const priorityAria = priorityData.map((d) => `${d.label} ${d.value}`).join(", ");

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
            <ChartPanel title="By status" caption={`${totalTasks} total`}>
              <div
                className="flex flex-col items-center"
                role="img"
                aria-label={`Tasks by status donut chart: ${statusAria}`}
              >
                <DonutChart data={statusData} total={totalTasks} />
                <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
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
              </div>
            </ChartPanel>

            {/* Bar: Tasks by Priority */}
            <ChartPanel title="By priority" caption="across all projects">
              <div
                role="img"
                aria-label={`Tasks by priority bar chart: ${priorityAria}`}
              >
                <BarChart data={priorityData} total={totalTasks} />
                <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
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
              </div>
            </ChartPanel>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
