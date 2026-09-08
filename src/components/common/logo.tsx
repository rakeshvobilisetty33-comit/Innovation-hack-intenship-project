"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
  size = 28,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className="relative inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[color-mix(in_oklch,var(--brand)_55%,var(--chart-2))] text-brand-foreground shadow-brand"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          width={size * 0.62}
          height={size * 0.62}
          className="text-brand-foreground"
        >
          <path
            d="M5 4.5 5 19.5 19 12 5 4.5Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M8.5 8.2 14.5 12 8.5 15.8"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight">
          DevFlow<span className="text-brand"> AI</span>
        </span>
      )}
    </div>
  );
}
