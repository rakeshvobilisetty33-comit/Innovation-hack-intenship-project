"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectStatusBadge } from "@/components/common/badges";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/constants";
import type { Project } from "@/lib/types";

export interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  taskCount: number;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_TONES = [
  "bg-brand/15 text-brand dark:text-[color-mix(in_oklch,var(--brand)_65%,white)]",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
];

function toneFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[Math.abs(h)];
}

export function ProjectCard({
  project,
  onOpen,
  onEdit,
  onDelete,
  taskCount,
}: ProjectCardProps) {
  const members = project.members ?? [];
  const visibleMembers = members.slice(0, 4);
  const extraCount = Math.max(0, members.length - 4);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={handleKeyDown}
        aria-label={`Open project ${project.name}`}
        className={cn(
          "group relative h-full cursor-pointer gap-0 p-0 py-0",
          "transition-shadow duration-200 hover:shadow-soft",
          "hover:ring-1 hover:ring-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        )}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-tight">
              {project.name}
            </h3>
            <div className="mt-2">
              <ProjectStatusBadge status={project.status} />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${project.name}`}
                aria-haspopup="menu"
                onClick={(e) => e.stopPropagation()}
                className="-mr-2 -mt-1 h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40"
              onClick={(e) => e.stopPropagation()}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <div className="px-5 pb-4">
          <p
            className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground"
            title={project.description || undefined}
          >
            {project.description || "No description provided."}
          </p>
        </div>

        {/* Progress */}
        <div className="px-5 pb-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="font-semibold tabular-nums">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex -space-x-2">
              {visibleMembers.map((m) => (
                <Avatar
                  key={m}
                  title={m}
                  className={cn(
                    "h-7 w-7 border-2 border-card",
                    toneFor(m),
                  )}
                >
                  <AvatarFallback
                    className={cn(
                      "bg-transparent text-[10px] font-semibold",
                      toneFor(m),
                    )}
                  >
                    {initials(m) || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {extraCount > 0 && (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground"
                  aria-label={`${extraCount} more members`}
                >
                  +{extraCount}
                </div>
              )}
              {visibleMembers.length === 0 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
                  —
                </div>
              )}
            </div>
            <span className="truncate text-xs text-muted-foreground">
              {taskCount} {taskCount === 1 ? "task" : "tasks"}
            </span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            Updated {formatRelative(project.updatedAt)}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
