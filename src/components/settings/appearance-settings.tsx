"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type ThemeChoice = "light" | "dark" | "system";

interface OptionDef {
  value: ThemeChoice;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: OptionDef[] = [
  { value: "light", label: "Light", description: "Bright surfaces for daytime.", Icon: Sun },
  { value: "dark", label: "Dark", description: "Easy on the eyes at night.", Icon: Moon },
  { value: "system", label: "System", description: "Match your OS preference.", Icon: Monitor },
];

function MiniPreview({ theme }: { theme: ThemeChoice }) {
  // A tiny window preview that visually matches the chosen theme.
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  return (
    <div
      className={cn(
        "relative h-20 w-full overflow-hidden rounded-md border",
        isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200",
      )}
      aria-hidden
    >
      <div className="flex h-full w-full">
        {/* faux sidebar */}
        <div className={cn("w-1/3 border-r p-1.5", isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-zinc-50 border-zinc-200")}>
          <div className={cn("mb-1 h-1.5 w-3/4 rounded-full", isDark ? "bg-zinc-700" : "bg-zinc-300")} />
          <div className={cn("mb-1 h-1.5 w-2/3 rounded-full", isDark ? "bg-zinc-700" : "bg-zinc-300")} />
          <div className={cn("h-1.5 w-3/5 rounded-full", "bg-brand/70")} />
        </div>
        {/* faux content */}
        <div className="flex-1 p-2">
          <div className={cn("mb-1.5 h-2 w-1/2 rounded-full", isDark ? "bg-zinc-700" : "bg-zinc-300")} />
          <div className={cn("mb-1 h-1.5 w-3/4 rounded-full", isDark ? "bg-zinc-800" : "bg-zinc-200")} />
          <div className={cn("h-1.5 w-2/3 rounded-full", isDark ? "bg-zinc-800" : "bg-zinc-200")} />
          <div className="mt-2 h-2.5 w-12 rounded-md bg-brand" />
        </div>
      </div>
    </div>
  );
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Avoid hydration mismatch — render the interactive UI only once mounted.
  const current = (mounted ? theme : "dark") as ThemeChoice | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold">Theme</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how DevFlow AI looks. System follows your operating system setting.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Theme"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {OPTIONS.map((opt, idx) => {
          const active = current === opt.value;
          const Icon = opt.Icon;
          return (
            <motion.button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={opt.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "group relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-brand bg-brand/5 shadow-soft"
                  : "border-border bg-card hover:border-brand/40 hover:bg-accent/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                    active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                {active ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border" aria-hidden />
                )}
              </div>
              <div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{opt.description}</div>
              </div>
              <MiniPreview theme={opt.value} />
            </motion.button>
          );
        })}
      </div>

      {/* Brand accent swatch */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-foreground shadow-brand"
              aria-hidden
            >
              <SparklesGlyph />
            </span>
            <div>
              <Label className="text-sm font-medium">Brand accent — emerald</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The primary accent color used across buttons, focus rings and highlights.
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Swatch label="Brand" className="bg-brand" />
            <Swatch label="Brand 12%" className="bg-brand/15" />
            <Swatch label="Accent" className="bg-accent" />
            <Swatch label="Ring" className="bg-ring" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Swatch({ label, className }: { label: string; className?: string }) {
  return (
    <div className="flex flex-col items-center gap-1" title={label}>
      <span className={cn("h-6 w-6 rounded-md border border-border/60", className)} aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function SparklesGlyph() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
      <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3z" opacity="0.95" />
      <path d="M18 14l.9 2.4L21 17.3l-2.1.9L18 20.5l-.9-2.3L15 17.3l2.1-.9L18 14z" opacity="0.7" />
    </svg>
  );
}
