"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutGrid,
  List,
  ListChecks,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";

import { useDataStore, type TaskInput } from "@/store/data-store";
import { useUIStore } from "@/store/ui-store";
import { useToast } from "@/hooks/use-toast";

import {
  PRIORITIES,
  TASK_STATUSES,
} from "@/lib/constants";
import type { Priority, Task, TaskStatus } from "@/lib/types";

import { TaskList } from "@/components/tasks/task-list";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskForm } from "@/components/tasks/task-form";
import {
  TaskFilters,
  type TaskFilterState,
} from "@/components/tasks/task-filters";

type ViewMode = "list" | "board";

const VIEW_STORAGE_KEY = "devflow-tasks-view";

export default function TasksView() {
  const { toast } = useToast();
  const tasks = useDataStore((s) => s.tasks);
  const projects = useDataStore((s) => s.projects);
  const addTask = useDataStore((s) => s.addTask);
  const updateTask = useDataStore((s) => s.updateTask);
  const setTaskStatus = useDataStore((s) => s.setTaskStatus);
  const deleteTask = useDataStore((s) => s.deleteTask);
  const openProject = useUIStore((s) => s.openProject);

  const [view, setView] = React.useState<ViewMode>("list");
  const [filters, setFilters] = React.useState<TaskFilterState>({});
  const [loading, setLoading] = React.useState(true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [deleting, setDeleting] = React.useState<Task | null>(null);

  // Persist view preference
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "list" || stored === "board") setView(stored);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // ignore
    }
  }, [view]);

  // Simulated first-mount loading
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Filtered + sorted tasks
  const filtered = React.useMemo(() => {
    const q = filters.search?.trim().toLowerCase();
    const assigneeQ = filters.assignedTo?.trim().toLowerCase();
    const list = tasks.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.project && t.project !== filters.project) return false;
      if (assigneeQ) {
        if (
          !(t.assignedName ?? "").toLowerCase().includes(assigneeQ) &&
          !(t.assignedTo ?? "").toLowerCase().includes(assigneeQ)
        )
          return false;
      }
      if (q) {
        const hay = `${t.title} ${t.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Sort by priority weight (desc) then by due date asc (overdue first).
    return list.sort((a, b) => {
      const pw = PRIORITIES[b.priority].weight - PRIORITIES[a.priority].weight;
      if (pw !== 0) return pw;
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      return a.title.localeCompare(b.title);
    });
  }, [tasks, filters]);

  // Active filter chips metadata
  const activeChips = React.useMemo(() => {
    const chips: { key: keyof TaskFilterState; label: string; value: string }[] = [];
    if (filters.status) {
      chips.push({
        key: "status",
        label: "Status",
        value: TASK_STATUSES[filters.status].label,
      });
    }
    if (filters.priority) {
      chips.push({
        key: "priority",
        label: "Priority",
        value: PRIORITIES[filters.priority].label,
      });
    }
    if (filters.project) {
      const p = projects.find((x) => x.id === filters.project);
      chips.push({
        key: "project",
        label: "Project",
        value: p?.name ?? "Project",
      });
    }
    if (filters.assignedTo) {
      chips.push({
        key: "assignedTo",
        label: "Assignee",
        value: filters.assignedTo,
      });
    }
    return chips;
  }, [filters, projects]);

  const hasActiveFilters = activeChips.length > 0 || !!filters.search;

  const removeChip = (key: keyof TaskFilterState) => {
    setFilters({ ...filters, [key]: undefined });
  };

  const clearFilters = () => setFilters({});

  // Handlers
  const handleOpenNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditing(task);
    setFormOpen(true);
  };

  const handleSubmit = (values: TaskInput) => {
    if (editing) {
      updateTask(editing.id, values);
      toast({
        title: "Task updated",
        description: `“${values.title}” has been saved.`,
      });
    } else {
      const proj = projects.find((p) => p.id === values.project);
      addTask(values, values.assignedTo, proj?.name);

      // Clear any active filter that would hide this newly created task
      setFilters((prev) => {
        const next = { ...prev };
        if (next.status && next.status !== values.status) delete next.status;
        if (next.project && next.project !== values.project) delete next.project;
        if (next.priority && next.priority !== values.priority) delete next.priority;
        if (next.search && !values.title.toLowerCase().includes(next.search.toLowerCase())) delete next.search;
        return next;
      });

      toast({
        title: "Task created",
        description: `“${values.title}” was added.`,
      });
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleCancel = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    setTaskStatus(id, status);
    const t = tasks.find((x) => x.id === id);
    toast({
      title: "Status updated",
      description: t
        ? `“${t.title}” moved to ${TASK_STATUSES[status].label}.`
        : `Task moved to ${TASK_STATUSES[status].label}.`,
    });
  };

  const handlePriorityChange = (id: string, priority: Priority) => {
    updateTask(id, { priority });
    const t = tasks.find((x) => x.id === id);
    toast({
      title: "Priority updated",
      description: t
        ? `“${t.title}” priority set to ${PRIORITIES[priority].label}.`
        : `Priority set to ${PRIORITIES[priority].label}.`,
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleting) return;
    deleteTask(deleting.id);
    toast({
      title: "Task deleted",
      description: `“${deleting.title}” was removed.`,
      variant: "destructive",
    });
    setDeleting(null);
  };

  const handleOpenProject = (projectId: string) => {
    if (projectId) openProject(projectId);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Heading */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Track and triage work across all your projects.
        </p>
      </header>

      {/* Sub-toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={filters.search ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Search tasks by title or description…"
              aria-label="Search tasks"
              className="h-10 pl-9"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, search: undefined })}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <TaskFilters filters={filters} setFilters={setFilters} />

            {/* View toggle (segmented via Tabs) */}
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as ViewMode)}
              className="hidden sm:block"
            >
              <TabsList className="h-10">
                <TabsTrigger value="list" className="gap-1.5 px-3" aria-label="List view">
                  <List className="h-4 w-4" />
                  <span className="hidden md:inline">List</span>
                </TabsTrigger>
                <TabsTrigger value="board" className="gap-1.5 px-3" aria-label="Board view">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden md:inline">Board</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              type="button"
              onClick={handleOpenNew}
              className="h-10 gap-1.5"
              aria-label="Create new task"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Mobile-only view toggle */}
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as ViewMode)}
          className="sm:hidden"
        >
          <TabsList className="h-10 w-full">
            <TabsTrigger value="list" className="flex-1 gap-1.5" aria-label="List view">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="board" className="flex-1 gap-1.5" aria-label="Board view">
              <LayoutGrid className="h-4 w-4" />
              Board
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Active filter chips + result count */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {loading
                ? "Loading…"
                : `${filtered.length} task${filtered.length === 1 ? "" : "s"}${
                    hasActiveFilters ? " match" : ""
                  }`}
            </span>
            <AnimatePresence initial={false}>
              {activeChips.map((chip) => (
                <motion.div
                  key={chip.key}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                >
                  <Badge
                    variant="outline"
                    className="gap-1.5 bg-card py-1 pr-1 pl-2.5 text-xs"
                  >
                    <span className="text-muted-foreground">{chip.label}:</span>
                    <span className="max-w-[140px] truncate font-medium">
                      {chip.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChip(chip.key)}
                      aria-label={`Remove ${chip.label} filter`}
                      className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {loading ? (
          <LoadingSkeleton view={view} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title={
              tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"
            }
            description={
              tasks.length === 0
                ? "Create your first task to start tracking work."
                : "Try clearing some filters or search terms to see more tasks."
            }
            action={
              tasks.length === 0 ? (
                <Button type="button" onClick={handleOpenNew} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : view === "list" ? (
          <TaskList
            tasks={filtered}
            onEdit={handleOpenEdit}
            onDelete={(t) => setDeleting(t)}
            onOpenProject={handleOpenProject}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
          />
        ) : (
          <KanbanBoard
            tasks={filtered}
            onStatusChange={handleStatusChange}
            onEdit={handleOpenEdit}
            onDelete={(t) => setDeleting(t)}
            onOpenProject={handleOpenProject}
            onPriorityChange={handlePriorityChange}
          />
        )}
      </div>

      {/* New/Edit dialog */}
      {formOpen && (
        <TaskForm
          initial={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this task?"
        description={
          deleting
            ? `“${deleting.title}” will be permanently removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function LoadingSkeleton({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, col) => (
        <div key={col} className="space-y-3 rounded-xl border bg-muted/30 p-2">
          <Skeleton className="h-8 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
