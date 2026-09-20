"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedCounter } from "@/components/common/animated-counter";
import { cn } from "@/lib/utils";

export interface ProgressCardProps {
  overallProgress: number;
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  className?: string;
}

const RING_SIZE = 144;
const STROKE = 12;
const R = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function Metric({
  icon,
  label,
  value,
  suffix,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-semibold tabular-nums">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

export function ProgressCard({
  overallProgress,
  completionRate,
  completedTasks,
  totalTasks,
  pendingTasks,
  overdueTasks,
  className,
}: ProgressCardProps) {
  const offset = CIRC * (1 - overallProgress / 100);
  const gradientId = React.useId();

  return (
    <Card className={cn("h-full gap-0 p-5 sm:p-6", className)}>
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-base font-semibold">
          Progress overview
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div
            className="relative mx-auto flex size-36 items-center justify-center"
            role="img"
            aria-label={`Overall workspace progress ${overallProgress} percent`}
          >
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="-rotate-90"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={`progressGradient-${gradientId}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="var(--brand)" />
                  <stop offset="100%" stopColor="var(--chart-2)" />
                </linearGradient>
              </defs>
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={R}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={STROKE}
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={R}
                fill="none"
                stroke={`url(#progressGradient-${gradientId})`}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-semibold tabular-nums">
                <AnimatedCounter value={overallProgress} suffix="%" />
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Overall
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric
              icon={<CheckCircle2 className="size-4 text-emerald-500" />}
              label="Completion rate"
              value={completionRate}
              suffix="%"
              sub={`${completedTasks} of ${totalTasks} tasks done`}
            />
            <Metric
              icon={<Clock className="size-4 text-muted-foreground" />}
              label="Pending"
              value={pendingTasks}
              sub="in your queue"
            />
            <Metric
              icon={<AlertTriangle className="size-4 text-amber-500" />}
              label="Overdue"
              value={overdueTasks}
              sub={
                overdueTasks > 0 ? "needs attention" : "all on track"
              }
            />
            <Metric
              icon={<CheckCircle2 className="size-4 text-brand" />}
              label="Done"
              value={completedTasks}
              sub="tasks completed"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
