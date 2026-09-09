"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "register";

interface AuthModeTabsProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  className?: string;
}

const TABS: { id: AuthMode; label: string }[] = [
  { id: "login", label: "Sign in" },
  { id: "register", label: "Create account" },
];

/**
 * Segmented pill toggle with an animated sliding active background.
 * Keyboard accessible (native buttons); aria-selected reflects active tab.
 */
export function AuthModeTabs({ mode, onModeChange, className }: AuthModeTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className={cn(
        "relative grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1",
        className,
      )}
    >
      {TABS.map((tab) => {
        const active = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onModeChange(tab.id)}
            className={cn(
              "relative z-10 rounded-lg px-4 py-2 text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/40",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {active && (
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg bg-background shadow-soft ring-1 ring-border"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
