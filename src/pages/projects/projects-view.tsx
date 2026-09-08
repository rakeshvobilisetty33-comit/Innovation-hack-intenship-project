"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectForm } from "@/components/projects/project-form";
import { EmptyState } from "@/components/common/empty-state";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useDataStore, type ProjectInput } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_STATUSES, PROJECT_STATUS_LIST } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/lib/types";

export default function ProjectsView() {
  const projects = useDataStore((s) => s.projects);
  const addProject = useDataStore((s) => s.addProject);
  const updateProject = useDataStore((s) => s.updateProject);
  const deleteProject = useDataStore((s) => s.deleteProject);
  const tasksForProject = useDataStore((s) => s.tasksForProject);
  const user = useAuthStore((s) => s.user);
  const openProject = useUIStore((s) => s.openProject);
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | "all">(
    "all",
  );

  // Create dialog
  const [createOpen, setCreateOpen] = React.useState(false);

  // Edit dialog (decoupled open + project so the form stays mounted during close animation)
  const [editProject, setEditProject] = React.useState<Project | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = React.useState<Project | null>(null);

  React.useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  // Clear lingering edit project shortly after the dialog closes so the
  // exit animation can play with content still mounted.
  React.useEffect(() => {
    if (!editOpen && editProject) {
      const t = window.setTimeout(() => setEditProject(null), 280);
      return () => window.clearTimeout(t);
    }
  }, [editOpen, editProject]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [projects, search, statusFilter]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  function openCreate() {
    setCreateOpen(true);
  }

  function openEdit(project: Project) {
    setEditProject(project);
    setEditOpen(true);
  }

  function handleCreate(values: ProjectInput) {
    addProject(values, user?.name);
    setCreateOpen(false);
    toast({
      title: "Project created",
      description: `“${values.name}” is ready to go.`,
    });
  }

  function handleEdit(values: ProjectInput) {
    if (!editProject) return;
    updateProject(editProject.id, values);
    setEditOpen(false);
    toast({
      title: "Project updated",
      description: `“${values.name}” saved successfully.`,
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteProject(target.id);
    setDeleteTarget(null);
    toast({
      title: "Project deleted",
      description: `“${target.name}” and its tasks were removed.`,
      variant: "destructive",
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New project
        </Button>

        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or description…"
            className="pl-9"
            aria-label="Search projects"
            type="search"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}
        >
          <SelectTrigger
            className="w-full sm:w-[170px]"
            aria-label="Filter projects by status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROJECT_STATUS_LIST.map((s) => (
              <SelectItem key={s} value={s}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", PROJECT_STATUSES[s].dot)}
                    aria-hidden
                  />
                  {PROJECT_STATUSES[s].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground sm:w-auto"
          onClick={() =>
            toast({
              title: "AI task generation",
              description: "Open a project to generate tasks with AI.",
            })
          }
        >
          <Sparkles className="h-4 w-4" />
          AI
        </Button>
      </div>

      {/* Active filter chips */}
      <AnimatePresence initial={false}>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-2 overflow-hidden"
          >
            {search.trim() && (
              <Badge
                variant="secondary"
                className="gap-1.5 rounded-full pr-1.5 font-normal"
              >
                <span className="text-muted-foreground">Search:</span>
                <span className="max-w-[14ch] truncate font-medium">
                  {search.trim()}
                </span>
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-background"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge
                variant="secondary"
                className="gap-1.5 rounded-full pr-1.5 font-normal"
              >
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">
                  {PROJECT_STATUSES[statusFilter].label}
                </span>
                <button
                  type="button"
                  aria-label="Clear status filter"
                  onClick={() => setStatusFilter("all")}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-background"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Loading projects"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-7 rounded-full" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title={hasActiveFilters ? "No matching projects" : "No projects yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Create your first project to start tracking work, tasks and progress."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create your first project
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                taskCount={tasksForProject(p.id).length}
                onOpen={() => openProject(p.id)}
                onEdit={() => openEdit(p)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Add a project to organize related tasks and track progress.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm onCancel={() => setCreateOpen(false)} onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>
              Update the project details below.
            </DialogDescription>
          </DialogHeader>
          {editProject && (
            <ProjectForm
              key={editProject.id}
              initial={editProject}
              onCancel={() => setEditOpen(false)}
              onSubmit={handleEdit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete “${deleteTarget?.name ?? ""}”?`}
        description="This will permanently delete the project and its tasks."
        confirmLabel="Delete project"
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
