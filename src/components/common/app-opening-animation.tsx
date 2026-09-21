"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function AppOpeningAnimation({ onFinish }: { onFinish?: () => void }) {
  const [stage, setStage] = React.useState<"enter" | "exit" | "done">("enter");

  React.useEffect(() => {
    // Stage 1: Hold the opening screen for 750ms
    const timer1 = setTimeout(() => {
      setStage("exit");
    }, 750);

    // Stage 2: After 500ms exit animation, unmount and callback
    const timer2 = setTimeout(() => {
      setStage("done");
      onFinish?.();
    }, 1250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  if (stage === "done") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background select-none",
        stage === "exit" && "animate-splash-exit pointer-events-none",
      )}
      aria-hidden="true"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[420px] rounded-full bg-brand/15 blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[260px] rounded-full bg-[color-mix(in_oklch,var(--brand)_50%,var(--chart-2))]/20 blur-[60px]" />
      </div>

      {/* Main logo & branding container */}
      <div className="relative z-10 flex flex-col items-center animate-scale-in">
        {/* Glowing Logo Icon */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-brand via-[color-mix(in_oklch,var(--brand)_70%,var(--chart-2))] to-[color-mix(in_oklch,var(--brand)_40%,var(--chart-1))] text-brand-foreground shadow-2xl animate-logo-pulse flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width={34}
              height={34}
              className="text-white"
            >
              <path
                d="M5 4.5 5 19.5 19 12 5 4.5Z"
                fill="currentColor"
                opacity="0.95"
              />
              <path
                d="M8.5 8.2 14.5 12 8.5 15.8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-1">
          <span>DevFlow</span>
          <span className="text-brand">AI</span>
        </h1>

        <p className="mt-1 text-xs text-muted-foreground font-medium tracking-wide">
          Developer Intelligence Platform
        </p>

        {/* Shimmer progress line */}
        <div className="mt-6 w-44 h-1 rounded-full bg-muted/60 overflow-hidden relative">
          <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-brand to-transparent rounded-full animate-progress-shimmer" />
        </div>

        <span className="mt-2.5 text-[11px] text-muted-foreground/70 tracking-tight">
          Initializing workspace…
        </span>
      </div>
    </div>
  );
}
