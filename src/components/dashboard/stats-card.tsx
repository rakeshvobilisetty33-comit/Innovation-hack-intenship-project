"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/common/animated-counter";
import { cn } from "@/lib/utils";

export type StatsCardAccent = "brand" | "neutral" | "success" | "warning";

const ACCENT_ICON: Record<StatsCardAccent, string> = {
  brand: "bg-brand/10 text-brand ring-brand/15",
  neutral: "bg-muted text-muted-foreground ring-border",
  success:
    "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  warning:
    "bg-amber-500/12 text-amber-600 dark:text-amber-400 ring-amber-500/20",
};

export interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  caption?: string;
  accent?: StatsCardAccent;
  trend?: { dir: "up" | "down"; text: string };
  className?: string;
}

export function StatsCard({
  icon,
  label,
  value,
  caption,
  accent = "brand",
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn("h-full", className)}
    >
      <Card className="relative h-full gap-0 overflow-hidden p-5 shadow-soft transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="truncate text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              <AnimatedCounter value={value} />
            </div>
          </div>
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1",
              ACCENT_ICON[accent],
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                trend.dir === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {trend.dir === "up" ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {trend.text}
            </span>
          )}
          {caption && (
            <span className="text-muted-foreground">{caption}</span>
          )}
        </div>
      </Card>
    </div>
  );
}
