"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useDataStore, type TaskInput } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import {
  PRIORITY_LIST,
  PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LIST,
} from "@/lib/constants";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface TaskFormProps {
  initial?: Task;
  onSubmit: (values: TaskInput) => void;
  onCancel: () => void;
}

function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Use local date (yyyy-MM-dd) so the input stays in sync with what the user picked.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateInput(value: string): string | null {
  if (!value) return null;
  // Treat as local date at 09:00 to avoid timezone surprises in the UI.
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d, 9, 0, 0, 0);
  return dt.toISOString();
}

export function TaskForm({ initial, onSubmit, onCancel }: TaskFormProps) {
  const projects = useDataStore((s) => s.projects);
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [project, setProject] = React.useState(
    initial?.project ?? projects[0]?.id ?? "",
  );
  const [assignedTo, setAssignedTo] = React.useState(
    initial?.assignedName ?? user?.name ?? "Alex Rivera",
  );
  const [status, setStatus] = React.useState<TaskStatus>(
    initial?.status ?? "todo",
  );
  const [priority, setPriority] = React.useState<Priority>(
    initial?.priority ?? "medium",
  );
  const [dueDate, setDueDate] = React.useState(toDateInput(initial?.dueDate));

  const [touched, setTouched] = React.useState(false);
  const titleError =
    touched && title.trim().length < 2
      ? "Title must be at least 2 characters."
      : null;
  const projectError = touched && !project ? "Please choose a project." : null;

  // If the store has no projects we still allow the form but warn.
  const noProjects = projects.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (title.trim().length < 2 || !project) return;

    const values: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      project,
      assignedTo: assignedTo.trim() || undefined,
      status,
      priority,
      dueDate: fromDateInput(dueDate),
    };
    onSubmit(values);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update the details below and save your changes."
              : "Fill out the details below to create a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="e.g. Implement kanban drag and drop"
              autoFocus
              aria-invalid={!!titleError}
              aria-describedby={titleError ? "task-title-error" : undefined}
              required
              minLength={2}
            />
            {titleError && (
              <p id="task-title-error" className="text-xs text-destructive">
                {titleError}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some context, links or acceptance criteria…"
              rows={3}
            />
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label htmlFor="task-project">
              Project <span className="text-destructive">*</span>
            </Label>
            {noProjects ? (
              <p className="text-xs text-muted-foreground">
                You have no projects yet. Create a project first.
              </p>
            ) : (
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger
                  id="task-project"
                  className="w-full"
                  aria-invalid={!!projectError}
                  aria-describedby={projectError ? "task-project-error" : undefined}
                >
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {projectError && (
              <p id="task-project-error" className="text-xs text-destructive">
                {projectError}
              </p>
            )}
          </div>

          {/* Assigned to */}
          <div className="space-y-1.5">
            <Label htmlFor="task-assigned">Assigned to</Label>
            <Input
              id="task-assigned"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Assignee name"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_LIST.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          TASK_STATUSES[s].dot,
                        )}
                      />
                      {TASK_STATUSES[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LIST.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          PRIORITIES[p].dot,
                        )}
                      />
                      {PRIORITIES[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date (native date input) */}
          <div className="space-y-1.5">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={noProjects || title.trim().length < 2}
            >
              {initial ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
