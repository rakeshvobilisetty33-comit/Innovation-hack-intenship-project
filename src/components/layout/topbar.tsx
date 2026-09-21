"use client";

import * as React from "react";
import { Bell, Menu, Plus, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { UserMenu } from "@/components/layout/user-menu";
import { useUIStore, type ViewId } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const TITLES: Record<ViewId, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Your developer productivity at a glance" },
  projects: { title: "Projects", subtitle: "Plan, track and ship your work" },
  "project-details": { title: "Project", subtitle: "Details, progress and tasks" },
  tasks: { title: "Tasks", subtitle: "Search, filter and organize your tasks" },
  profile: { title: "Profile", subtitle: "Manage your account" },
  settings: { title: "Settings", subtitle: "Preferences and configuration" },
  "not-found": { title: "Not found", subtitle: "This page doesn't exist" },
};

export function Topbar() {
  const view = useUIStore((s) => s.view);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setView = useUIStore((s) => s.setView);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const meta = TITLES[view];

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/70",
        "glass px-3 sm:px-5",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">
          {meta.title}
        </h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          {meta.subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className={cn(
          "group hidden h-9 items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-muted md:flex",
        )}
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" />
        <span className="pr-6">Search…</span>
        <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1 text-[10px] font-medium">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <Button
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => setView("projects")}
      >
        <Plus className="h-4 w-4" />
        New
      </Button>

      <NotificationsPopover />

      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
