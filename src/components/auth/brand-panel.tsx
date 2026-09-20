"use client";

import * as React from "react";
import { FolderKanban, ListChecks, Sparkles, Check } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Project management",
    description:
      "Plan projects with timelines, milestones, owners and live progress — all in one workspace.",
  },
  {
    icon: ListChecks,
    title: "Task tracking",
    description:
      "Track work across a Kanban board with priorities, due dates and instant status updates.",
  },
  {
    icon: Sparkles,
    title: "AI task generation",
    description:
      "Describe a project in one sentence and let AI draft a complete, reviewable task breakdown.",
  },
];

const STATS = [
  { value: "1,200+", label: "developers" },
  { value: "98%", label: "uptime" },
  { value: "12k+", label: "projects shipped" },
];

const PREVIEW_PROGRESS = [
  { label: "DevFlow AI Web App", value: 62, tone: "brand" as const },
  { label: "Design System v2", value: 74, tone: "chart" as const },
];

/**
 * Brand marketing panel — left side of the logged-out experience.
 * Hidden below `lg`. Renders an animated gradient + .bg-grid overlay,
 * headline, feature bullets, faux stats and a faux mini dashboard card.
 */
export function BrandPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative isolate hidden h-full min-h-screen overflow-hidden border-r border-border bg-card lg:flex lg:flex-col",
        className,
      )}
    >
      {/* Animated gradient base */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-br from-brand/10 via-card to-card"
      />
      {/* Grid overlay */}
      <div
        aria-hidden
        className="bg-grid absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_75%)]"
      />
      {/* Animated glow */}
      <div
        aria-hidden
        className="absolute -right-24 -top-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-16 -z-10 h-72 w-72 rounded-full bg-chart-2/15 blur-3xl"
      />

      {/* Top-right theme toggle */}
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative z-[1] flex h-full flex-col justify-between p-10 xl:p-14">
        <div
        >
          <Logo size={40} />
        </div>

        <div className="max-w-xl">
          <h1
            className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight xl:text-[2.6rem]"
          >
            Plan. Track. Ship —{" "}
            <span className="text-gradient-brand">with AI on your side.</span>
          </h1>

          <p
            className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground"
          >
            DevFlow AI brings project planning, task tracking and AI-assisted
            breakdowns together — so your team can move from idea to shipped
            without the busywork.
          </p>

          {/* Feature bullets */}
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map((f, i) => (
              <li
                key={f.title}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
                  <f.icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium leading-tight">{f.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Faux mini dashboard preview + trusted-by stats */}
        <div
          className="mt-10"
        >
          <div className="rounded-2xl border border-border bg-card/70 p-4 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                This week
              </p>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-2 w-2 rounded-full bg-brand" />
                <span className="inline-flex h-2 w-2 rounded-full bg-chart-2/70" />
                <span className="inline-flex h-2 w-2 rounded-full bg-chart-3/70" />
              </div>
            </div>

            {/* Stat chips */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Tasks done", value: "24" },
                { label: "In progress", value: "11" },
                { label: "Overdue", value: "2" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border bg-background/60 px-3 py-2"
                >
                  <p className="text-lg font-semibold leading-none">{s.value}</p>
                  <p className="mt-1 text-[11px] leading-none text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Progress bars */}
            <div className="mt-4 space-y-3">
              {PREVIEW_PROGRESS.map((p) => (
                <div key={p.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{p.label}</span>
                    <span className="font-medium tabular-nums">{p.value}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        p.tone === "brand" ? "bg-brand" : "bg-chart-2",
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trusted-by stats */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-foreground font-semibold tabular-nums">
                  {s.value}
                </span>
                <span>{s.label}</span>
                {i < STATS.length - 1 && (
                  <span className="ml-2 hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact brand header — shown above the auth card on mobile (<lg). */
export function MobileBrandHeader() {
  return (
    <div
      className="mb-7 flex flex-col items-center gap-3 text-center"
    >
      <Logo size={36} />
      <p className="max-w-xs text-sm text-muted-foreground">
        Plan. Track. Ship —{" "}
        <span className="text-gradient-brand font-medium">
          with AI on your side.
        </span>
      </p>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-brand" aria-hidden />
        Free during beta
      </div>
    </div>
  );
}
