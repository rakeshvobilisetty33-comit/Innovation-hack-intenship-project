"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
} from "@/lib/constants";
import type { Priority, ProjectStatus, TaskStatus } from "@/lib/types";

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const meta = PROJECT_STATUSES[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border font-medium capitalize", meta.badge, className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}

export function TaskStatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const meta = TASK_STATUSES[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border font-medium capitalize", meta.badge, className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const meta = PRIORITIES[priority];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border font-medium capitalize", meta.badge, className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}
