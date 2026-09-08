"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PriorityBadge, TaskStatusBadge } from "@/components/common/badges";
import {
  PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LIST,
  PRIORITY_LIST,
  formatDate,
  isOverdue,
} from "@/lib/constants";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export interface TaskCardDragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
}

export interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onOpenProject: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange?: (priority: Priority) => void;
  /** When the card is being dragged via dnd-kit (visual feedback). */
  isDragging?: boolean;
  /** Inert preview used by the KanbanBoard DragOverlay. */
  variant?: "default" | "overlay";
  /** Extra className for the root. */
  className?: string;
  /** Ref + transform for the wrapper (draggable element). */
  dragRef?: (el: HTMLElement | null) => void;
  dragStyle?: React.CSSProperties;
  /** Drag handle props from dnd-kit's `useDraggable`. When provided, a visible grip is rendered. */
  dragHandleProps?: TaskCardDragHandleProps;
}

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onOpenProject,
  onStatusChange,
  onPriorityChange,
  isDragging,
  variant = "default",
  className,
  dragRef,
  dragStyle,
  dragHandleProps,
}: TaskCardProps) {
  const priorityMeta = PRIORITIES[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);
  const interactive = variant === "default";
  const draggable = !!dragHandleProps;

  return (
    <div
      ref={dragRef}
      style={dragStyle}
      className={cn("outline-none", className)}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={cn(
          "h-full",
          isDragging && "opacity-50",
          variant === "overlay" && "rotate-1 scale-[1.01] shadow-brand",
        )}
      >
        <Card
          className={cn(
            "group relative overflow-hidden p-0 gap-0 transition-all",
            "hover:shadow-soft hover:border-brand/40",
            draggable && interactive && "hover:cursor-grab active:cursor-grabbing",
            isDragging && "ring-2 ring-brand",
          )}
        >
          {/* Priority accent strip */}
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1",
              priorityMeta.dot,
            )}
            aria-hidden
          />

          <div className="pl-3 pr-3 py-3.5 sm:pr-4">
            {/* Header: title + project + actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-1.5">
                {/* Drag handle (dnd-kit) */}
                {draggable && interactive && (
                  <button
                    type="button"
                    aria-label={`Drag task ${task.title} to reorder or change status`}
                    title="Drag to move"
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground/70 outline-none",
                      "opacity-0 transition-opacity group-hover:opacity-100",
                      "hover:bg-accent hover:text-foreground",
                      "focus-visible:ring-2 focus-visible:ring-brand",
                    )}
                    {...dragHandleProps!.attributes}
                    {...dragHandleProps!.listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                )}

                <div className="min-w-0 flex-1">
                  <h4
                    className="font-medium leading-snug truncate"
                    title={task.title}
                  >
                    {task.title}
                  </h4>
                  {task.projectName && (
                    <button
                      type="button"
                      onClick={interactive ? onOpenProject : undefined}
                      disabled={!interactive}
                      className={cn(
                        "mt-0.5 inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground",
                        interactive && "hover:text-brand transition-colors",
                      )}
                      title={task.projectName}
                    >
                      <span className="truncate">{task.projectName}</span>
                    </button>
                  )}
                </div>
              </div>

              {interactive && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Actions for task ${task.title}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Task</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={onEdit}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={onDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Description (2-line clamp) */}
            {task.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Badges row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Interactive status badge → dropdown to change status */}
              {interactive ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                      aria-label={`Change status (currently ${TASK_STATUSES[task.status].label})`}
                      title="Change status"
                    >
                      <TaskStatusBadge
                        status={task.status}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuLabel>Set status</DropdownMenuLabel>
                    {TASK_STATUS_LIST.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onSelect={() => onStatusChange(s)}
                        aria-label={`Set status to ${TASK_STATUSES[s].label}`}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            TASK_STATUSES[s].dot,
                          )}
                        />
                        {TASK_STATUSES[s].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <TaskStatusBadge status={task.status} />
              )}

              {/* Priority badge → optional dropdown */}
              {interactive && onPriorityChange ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                      aria-label={`Change priority (currently ${PRIORITIES[task.priority].label})`}
                      title="Change priority"
                    >
                      <PriorityBadge
                        priority={task.priority}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuLabel>Set priority</DropdownMenuLabel>
                    {PRIORITY_LIST.map((p) => (
                      <DropdownMenuItem
                        key={p}
                        onSelect={() => onPriorityChange(p)}
                        aria-label={`Set priority to ${PRIORITIES[p].label}`}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            PRIORITIES[p].dot,
                          )}
                        />
                        {PRIORITIES[p].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <PriorityBadge priority={task.priority} />
              )}
            </div>

            {/* Footer: assignee + due date */}
            <div className="mt-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                    {initials(task.assignedName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate" title={task.assignedName ?? "Unassigned"}>
                  {task.assignedName ?? "Unassigned"}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 whitespace-nowrap",
                  overdue && "text-destructive font-medium",
                  !overdue && "text-muted-foreground",
                )}
                title={
                  task.dueDate
                    ? `Due ${formatDate(task.dueDate)}${overdue ? " (overdue)" : ""}`
                    : "No due date"
                }
              >
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(task.dueDate)}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
