"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/logo";
import { useUIStore, NAV_ITEMS, type ViewId } from "@/store/ui-store";
import { useDataStore } from "@/store/data-store";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const stats = useDataStore((s) => s.stats);
  // Subscribe to the underlying arrays so the count badges re-render after
  // async hydrate / mutations (the `stats` function reference is stable).
  useDataStore((s) => s.projects);
  useDataStore((s) => s.tasks);

  const items: { id: ViewId; label: string; icon: LucideIcon; count?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban, count: stats().totalProjects },
    { id: "tasks", label: "Tasks", icon: ListChecks, count: stats().totalTasks },
  ];

  return (
    <div className="flex h-full flex-col gap-2 px-3 py-4">
      <div className="px-2 pb-2">
        <Logo />
      </div>

      <nav className="mt-2 flex flex-col gap-1" aria-label="Primary">
        {items.map((item) => {
          const active =
            view === item.id || (item.id === "projects" && view === "project-details");
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setView(item.id);
                onNavigate?.();
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {typeof item.count === "number" && (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                    active
                      ? "bg-brand/15 text-brand"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-1">
        <div className="rounded-xl border border-sidebar-border bg-gradient-to-br from-brand/10 to-transparent p-3">
          <p className="text-xs font-semibold">AI task generator</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Describe a project and let AI break it into tasks.
          </p>
          <button
            type="button"
            onClick={() => {
              setView("projects");
              onNavigate?.();
            }}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand"
          >
            Try from a project →
          </button>
        </div>
      </div>
    </div>
  );
}

export { NAV_ITEMS };
