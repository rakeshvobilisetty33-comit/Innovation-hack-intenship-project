"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, ListTodo } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/common/badges";
import { formatDate } from "@/lib/constants";
import { useDataStore } from "@/store/data-store";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export interface ProjectOverviewProps {
  projects: Project[];
  limit?: number;
  onOpenProject?: (id: string) => void;
  onViewAll?: () => void;
  className?: string;
}

export function ProjectOverview({
  projects,
  limit = 5,
  onOpenProject,
  onViewAll,
  className,
}: ProjectOverviewProps) {
  const tasksForProject = useDataStore((s) => s.tasksForProject);

  const sorted = React.useMemo(() => {
    return [...projects]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, limit);
  }, [projects, limit]);

  return (
    <Card className={cn("gap-0 p-0", className)}>
      <CardHeader className="px-5 pt-5">
        <CardTitle className="text-base font-semibold">Top projects</CardTitle>
        {onViewAll && (
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-brand hover:text-brand"
              onClick={onViewAll}
            >
              View all
              <ArrowRight className="size-3.5" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <ul className="divide-y divide-border">
          {sorted.map((p, i) => {
            const count = tasksForProject(p.id).length;
            const members = p.members ?? [];
            const extra = members.length - 4;
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(i * 0.04, 0.2),
                  ease: "easeOut",
                }}
              >
                <button
                  type="button"
                  onClick={() => onOpenProject?.(p.id)}
                  className="block w-full px-5 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:outline-none"
                  aria-label={`Open project ${p.name}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.name}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <Progress
                      value={p.progress}
                      className="h-1.5 flex-1 bg-muted"
                    />
                    <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                      {p.progress}%
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map((m, idx) => (
                        <Avatar
                          key={`${p.id}-m-${idx}`}
                          className="size-6 border-2 border-card bg-card"
                        >
                          <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                            {getInitials(m)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {extra > 0 && (
                        <div className="flex size-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
                          +{extra}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ListTodo className="size-3.5" />
                        {count} {count === 1 ? "task" : "tasks"}
                      </span>
                      <span className="hidden items-center gap-1 sm:inline-flex">
                        <CalendarClock className="size-3.5" />
                        {formatDate(p.updatedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
