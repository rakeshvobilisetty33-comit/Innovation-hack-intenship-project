"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProjectForm } from "@/components/projects/project-form";
import {
  PriorityBadge,
  ProjectStatusBadge,
  TaskStatusBadge,
} from "@/components/common/badges";
import { useDataStore, type ProjectInput } from "@/store/data-store";
import { useUIStore } from "@/store/ui-store";
import { useToast } from "@/hooks/use-toast";
import {
  PRIORITIES,
  formatDate,
  formatRelative,
  isOverdue,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Activity, Project, Task } from "@/lib/types";

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

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function StatCard({
  icon,
  value,
  label,
  tone = "default",
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone?: "default" | "warn" | "good";
}) {
  const toneClasses =
    tone === "warn"
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
      : tone === "good"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        : "bg-brand/10 text-brand dark:text-[color-mix(in_oklch,var(--brand)_65%,white)]";
  return (
    <Card className="gap-0 p-0 py-0">
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            toneClasses,
          )}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold leading-tight tabular-nums">
            {value}
          </div>
          <div className="truncate text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function EmptySelection() {
  const setView = useUIStore((s) => s.setView);
  return (
    <EmptyState
      icon={<FolderKanban className="h-6 w-6" />}
      title="Select a project"
      description="Choose a project from the list to view its details, tasks and activity."
      action={
        <Button onClick={() => setView("projects")}>
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>
      }
    />
  );
}

export default function ProjectDetailsView() {
  const selectedProjectId = useUIStore((s) => s.selectedProjectId);
  const goBack = useUIStore((s) => s.goBack);
  const setView = useUIStore((s) => s.setView);
  const getProject = useDataStore((s) => s.getProject);
  const tasksForProject = useDataStore((s) => s.tasksForProject);
  const activities = useDataStore((s) => s.activities);
  const updateProject = useDataStore((s) => s.updateProject);
  const deleteProject = useDataStore((s) => s.deleteProject);
  const { toast } = useToast();

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (!selectedProjectId) {
    return <EmptySelection />;
  }

  const project = getProject(selectedProjectId);
  if (!project) {
    return <EmptySelection />;
  }

  const tasks = tasksForProject(project.id);
  const completed = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.length - completed;
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  // Sort: priority weight desc, then due date asc
  const sortedTasks = [...tasks].sort((a, b) => {
    const pw =
      (PRIORITIES[b.priority]?.weight ?? 0) -
      (PRIORITIES[a.priority]?.weight ?? 0);
    if (pw !== 0) return pw;
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return ad - bd;
  });

  const projectActivities = activities
    .filter(
      (a) =>
        a.entityId === project.id ||
        (a.entityType === "project" && a.entityId === project.id),
    )
    .slice(0, 5);

  const members = project.members ?? [];

  const handleEditSubmit = (values: ProjectInput) => {
    updateProject(project.id, values);
    setEditOpen(false);
    toast({
      title: "Project updated",
      description: `“${values.name}” saved successfully.`,
    });
  };

  const handleDeleteConfirm = () => {
    const name = project.name;
    deleteProject(project.id);
    setDeleteOpen(false);
    toast({
      title: "Project deleted",
      description: `“${name}” and its tasks were removed.`,
      variant: "destructive",
    });
    goBack();
  };

  return (
    <div className="flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col gap-5"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Button>

        {/* Header */}
        <Card className="gap-0 p-0 py-0">
          <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
                  {project.name}
                </h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {project.description || "No description provided."}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<ListChecks className="h-5 w-5" />}
            value={tasks.length}
            label="Total tasks"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            value={completed}
            label="Completed"
            tone="good"
          />
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            value={pending}
            label="Pending"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            value={overdueCount}
            label="Overdue"
            tone={overdueCount > 0 ? "warn" : "default"}
          />
        </div>

        {/* Progress + members */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Overall progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    Completion
                  </span>
                  <span className="font-semibold tabular-nums">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Owner
                  </dt>
                  <dd className="mt-0.5 truncate">
                    {project.ownerName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Members
                  </dt>
                  <dd className="mt-0.5">{members.length}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created
                  </dt>
                  <dd className="mt-0.5">{formatDate(project.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Updated
                  </dt>
                  <dd className="mt-0.5">
                    {formatRelative(project.updatedAt)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                Team members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {members.map((m) => (
                    <li key={m} className="flex items-center gap-3 text-sm">
                      <Avatar
                        className={cn("h-8 w-8 border border-border/40", toneFor(m))}
                      >
                        <AvatarFallback
                          className={cn(
                            "bg-transparent text-xs font-semibold",
                            toneFor(m),
                          )}
                        >
                          {initials(m) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {m}
                        {m === project.ownerName ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            · Owner
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tasks list */}
        <Card className="gap-0 p-0 py-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Tasks ({tasks.length})</h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setView("tasks");
                toast({
                  title: "Add a task",
                  description: `Open Tasks and create one for “${project.name}”.`,
                });
              }}
            >
              <Plus className="h-4 w-4" />
              Add task
            </Button>
          </div>
          {sortedTasks.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
              No tasks in this project yet.
            </div>
          ) : (
            <ul
              className="divide-y divide-border/60"
              aria-label="Project tasks"
            >
              {sortedTasks.map((t: Task) => {
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center gap-2 px-5 py-3 sm:px-6"
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-sm font-medium"
                      title={t.title}
                    >
                      {t.title}
                    </span>
                    <span className="flex items-center gap-2 sm:gap-2.5">
                      <TaskStatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      {t.assignedName ? (
                        <span className="hidden text-xs text-muted-foreground md:inline">
                          {t.assignedName}
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          overdue ? "font-medium text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {formatDate(t.dueDate)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="gap-0 p-0 py-0">
          <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold">Recent activity</h2>
          </div>
          {projectActivities.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
              No recent activity for this project.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {projectActivities.map((a: Activity) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 px-5 py-3 sm:px-6"
                >
                  <Avatar
                    className={cn(
                      "h-7 w-7 border border-border/40",
                      toneFor(a.userName ?? "?"),
                    )}
                  >
                    <AvatarFallback
                      className={cn(
                        "bg-transparent text-[10px] font-semibold",
                        toneFor(a.userName ?? "?"),
                      )}
                    >
                      {initials(a.userName ?? "?") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-snug">
                      <span className="font-medium">{a.userName ?? "Someone"}</span>{" "}
                      <span className="text-muted-foreground">
                        {a.description}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelative(a.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>
              Update the project details below.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            initial={project}
            onCancel={() => setEditOpen(false)}
            onSubmit={handleEditSubmit}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete “${project.name}”?`}
        description="This will permanently delete the project and its tasks."
        confirmLabel="Delete project"
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
