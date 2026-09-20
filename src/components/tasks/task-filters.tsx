"use client";

import * as React from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useDataStore } from "@/store/data-store";
import {
  PRIORITY_LIST,
  PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LIST,
} from "@/lib/constants";
import type { Priority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface TaskFilterState {
  status?: TaskStatus;
  priority?: Priority;
  project?: string; // project id
  assignedTo?: string; // name substring
  search?: string; // title/description substring (lives in parent toolbar)
}

export interface TaskFiltersProps {
  filters: TaskFilterState;
  setFilters: (next: TaskFilterState) => void;
  className?: string;
}

const ALL = "all";

export function TaskFilters({ filters, setFilters, className }: TaskFiltersProps) {
  const projects = useDataStore((s) => s.projects);

  const activeCount =
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.project ? 1 : 0) +
    (filters.assignedTo ? 1 : 0);

  const setField = <K extends keyof TaskFilterState>(
    key: K,
    value: TaskFilterState[K] | undefined,
  ) => {
    setFilters({ ...filters, [key]: value || undefined });
  };

  const handleClear = () => {
    setFilters({ search: filters.search });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Desktop inline controls */}
      <div className="hidden md:flex items-center gap-2 flex-wrap">
        <FilterControls
          filters={filters}
          projects={projects}
          onStatus={(v) => setField("status", v as TaskStatus | undefined)}
          onPriority={(v) => setField("priority", v as Priority | undefined)}
          onProject={(v) => setField("project", v || undefined)}
          onAssignedTo={(v) => setField("assignedTo", v)}
        />
        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            aria-label="Clear all filters"
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Mobile popover */}
      <div className="md:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Open filters"
              className="h-9 gap-1.5"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-1 h-5 min-w-5 justify-center px-1.5 text-[10px]"
                >
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  Filter tasks
                </div>
                {activeCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 text-xs text-muted-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <FilterControls
                filters={filters}
                projects={projects}
                onStatus={(v) => setField("status", v as TaskStatus | undefined)}
                onPriority={(v) => setField("priority", v as Priority | undefined)}
                onProject={(v) => setField("project", v || undefined)}
                onAssignedTo={(v) => setField("assignedTo", v)}
                stacked
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

interface FilterControlsProps {
  filters: TaskFilterState;
  projects: { id: string; name: string }[];
  onStatus: (v: string) => void;
  onPriority: (v: string) => void;
  onProject: (v: string) => void;
  onAssignedTo: (v: string) => void;
  stacked?: boolean;
}

function FilterControls({
  filters,
  projects,
  onStatus,
  onPriority,
  onProject,
  onAssignedTo,
  stacked,
}: FilterControlsProps) {
  const wrap = (child: React.ReactNode) =>
    stacked ? (
      <div className="space-y-1.5">{child}</div>
    ) : (
      <>{child}</>
    );

  return (
    <>
      {wrap(
        <div key="status" className={cn(!stacked && "w-[140px]")}>
          {stacked && <Label htmlFor="filter-status">Status</Label>}
          <Select
            value={filters.status ?? ALL}
            onValueChange={(v) => onStatus(v === ALL ? "" : v)}
          >
            <SelectTrigger
              id="filter-status"
              size="sm"
              className={cn("w-full", !stacked && "h-9")}
              aria-label="Filter by status"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {TASK_STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", TASK_STATUSES[s].dot)}
                  />
                  {TASK_STATUSES[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>,
      )}

      {wrap(
        <div key="priority" className={cn(!stacked && "w-[140px]")}>
          {stacked && <Label htmlFor="filter-priority">Priority</Label>}
          <Select
            value={filters.priority ?? ALL}
            onValueChange={(v) => onPriority(v === ALL ? "" : v)}
          >
            <SelectTrigger
              id="filter-priority"
              size="sm"
              className={cn("w-full", !stacked && "h-9")}
              aria-label="Filter by priority"
            >
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All priorities</SelectItem>
              {PRIORITY_LIST.map((p) => (
                <SelectItem key={p} value={p}>
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", PRIORITIES[p].dot)}
                  />
                  {PRIORITIES[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>,
      )}

      {wrap(
        <div key="project" className={cn(!stacked && "w-[180px]")}>
          {stacked && <Label htmlFor="filter-project">Project</Label>}
          <Select
            value={filters.project ?? ALL}
            onValueChange={(v) => onProject(v === ALL ? "" : v)}
          >
            <SelectTrigger
              id="filter-project"
              size="sm"
              className={cn("w-full", !stacked && "h-9")}
              aria-label="Filter by project"
            >
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>,
      )}

      {wrap(
        <div key="assignee" className={cn(!stacked && "w-[180px]")}>
          {stacked && <Label htmlFor="filter-assignee">Assignee</Label>}
          <Input
            id="filter-assignee"
            type="text"
            inputMode="search"
            value={filters.assignedTo ?? ""}
            onChange={(e) => onAssignedTo(e.target.value)}
            placeholder="Assignee name"
            aria-label="Filter by assignee name"
            className={cn(!stacked && "h-9")}
          />
        </div>,
      )}
    </>
  );
}
