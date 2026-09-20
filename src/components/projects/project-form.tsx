"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LIST,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { type ProjectInput } from "@/store/data-store";
import type { Project, ProjectStatus } from "@/lib/types";

export interface ProjectFormProps {
  initial?: Project;
  onSubmit: (values: ProjectInput) => void;
  onCancel: () => void;
}

const MAX_DESC = 280;

export function ProjectForm({ initial, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [status, setStatus] = React.useState<ProjectStatus>(initial?.status ?? "planning");
  const [progress, setProgress] = React.useState<number>(initial?.progress ?? 0);
  const [touched, setTouched] = React.useState(false);

  const trimmedName = name.trim();
  const nameError =
    touched && trimmedName.length < 2
      ? "Name must be at least 2 characters."
      : "";
  const descCount = description.length;
  const descError =
    descCount > MAX_DESC ? `Description must be ${MAX_DESC} characters or fewer.` : "";

  const valid = trimmedName.length >= 2 && descCount <= MAX_DESC;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onSubmit({
      name: trimmedName,
      description: description.trim(),
      status,
      progress,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      aria-label={initial ? "Edit project form" : "Create project form"}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="e.g. DevFlow AI Web App"
          maxLength={80}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? "project-name-error" : undefined}
          autoComplete="off"
        />
        {nameError ? (
          <p id="project-name-error" className="text-xs text-destructive" role="alert">
            {nameError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Used everywhere the project appears.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="project-description">Description</Label>
          <span
            className={cn(
              "text-xs tabular-nums",
              descCount > MAX_DESC ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {descCount}/{MAX_DESC}
          </span>
        </div>
        <Textarea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short summary of what this project is about."
          rows={4}
          maxLength={MAX_DESC + 60}
          aria-invalid={!!descError}
        />
        {descError && (
          <p className="text-xs text-destructive" role="alert">
            {descError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-status">Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as ProjectStatus)}
          >
            <SelectTrigger id="project-status" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUS_LIST.map((s) => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        PROJECT_STATUSES[s].dot,
                      )}
                      aria-hidden
                    />
                    {PROJECT_STATUSES[s].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="project-progress">Progress</Label>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {progress}%
            </span>
          </div>
          <div className="flex h-9 items-center">
            <Slider
              id="project-progress"
              value={[progress]}
              onValueChange={(v) => setProgress(v[0] ?? 0)}
              min={0}
              max={100}
              step={1}
              aria-label="Project progress"
              className="w-full"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid}>
          {initial ? "Save changes" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}
