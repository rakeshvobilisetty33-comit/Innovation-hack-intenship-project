"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Check, Loader2, Wand2, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { aiService, type GeneratedTask } from "@/services/aiServiceClient";
import { PRIORITIES, PRIORITY_LIST } from "@/lib/constants";
import type { Priority } from "@/lib/types";

export interface GenerateTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPrompt?: string;
  projects?: { id: string; name: string }[];
  targetProjectId?: string;
  onTargetProjectChange?: (id: string) => void;
  onAddTasks: (tasks: GeneratedTask[], projectId: string) => void;
}

export function GenerateTasksDialog({
  open,
  onOpenChange,
  defaultPrompt = "",
  projects = [],
  targetProjectId = "",
  onTargetProjectChange,
  onAddTasks,
}: GenerateTasksDialogProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = React.useState(defaultPrompt);
  const [count, setCount] = React.useState(8);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tasks, setTasks] = React.useState<GeneratedTask[]>([]);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [source, setSource] = React.useState<"ai" | "heuristic" | null>(null);

  // Reset state whenever the dialog opens.
  React.useEffect(() => {
    if (open) {
      setPrompt(defaultPrompt);
      setCount(8);
      setLoading(false);
      setError(null);
      setTasks([]);
      setSelected(new Set());
      setSource(null);
    }
  }, [open, defaultPrompt]);

  const handleGenerate = async () => {
    if (prompt.trim().length < 3) {
      setError("Please describe your project in a few words.");
      return;
    }
    setLoading(true);
    setError(null);
    setTasks([]);
    setSelected(new Set());
    setSource(null);
    try {
      const result = await aiService.generateTasks({ prompt: prompt.trim(), count });
      setTasks(result.tasks);
      setSource(result.source);
      setSelected(new Set(result.tasks.map((_, i) => i))); // select all by default
      if (result.source === "heuristic") {
        toast({
          title: "Tasks generated (offline)",
          description: "AI provider was unavailable — used the built-in generator.",
        });
      } else {
        toast({
          title: "Tasks generated",
          description: `${result.tasks.length} tasks generated with AI.`,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI generation failed";
      setError(msg);
      toast({ title: "AI generation failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === tasks.length) return new Set();
      return new Set(tasks.map((_, i) => i));
    });
  };

  const handleAddSelected = () => {
    const chosen = tasks.filter((_, i) => selected.has(i));
    if (chosen.length === 0) {
      toast({ title: "Select at least one task", variant: "destructive" });
      return;
    }
    if (projects.length > 0 && !targetProjectId) {
      toast({ title: "Choose a project", description: "Select which project to add the tasks to.", variant: "destructive" });
      return;
    }
    onAddTasks(chosen, targetProjectId);
    toast({
      title: "Tasks added",
      description: `${chosen.length} task${chosen.length === 1 ? "" : "s"} added.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <Sparkles className="h-4 w-4" />
            </span>
            Generate Tasks with AI
          </DialogTitle>
          <DialogDescription>
            Describe a project and let AI break it into structured, actionable tasks.
            Review and pick the ones you want to add.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 -mr-1">
          {/* Prompt form */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ai-prompt">Project description</Label>
              <Textarea
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build an e-commerce website with a cart and checkout"
                rows={3}
                maxLength={400}
                disabled={loading}
              />
              <p className="text-[11px] text-muted-foreground">{prompt.length}/400</p>
            </div>

            <div className="flex items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ai-count">Tasks to generate</Label>
                <Select value={String(count)} onValueChange={(v) => setCount(Number(v))} disabled={loading}>
                  <SelectTrigger id="ai-count" className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 8, 10, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} tasks</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleGenerate} disabled={loading} className="bg-brand">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : tasks.length > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Tasks
                  </>
                )}
              </Button>
            </div>

            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="ai-project">Add tasks to project</Label>
                <Select value={targetProjectId} onValueChange={(v) => onTargetProjectChange?.(v)} disabled={loading}>
                  <SelectTrigger id="ai-project" className="w-full">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* AI loading state */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5"
              >
                <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative inline-flex h-9 w-9 items-center justify-center">
                      <motion.span
                        className="absolute inset-0 rounded-full bg-brand/30"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <Sparkles className="relative h-5 w-5 text-brand animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI is breaking down your project…</p>
                      <p className="text-xs text-muted-foreground">Structuring tasks with priorities and descriptions.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                        <div className="h-3 flex-1 rounded bg-muted/70 animate-pulse" style={{ width: `${70 - i * 12}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && !loading && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Generation failed</p>
                <p className="mt-0.5 text-xs opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Generated tasks review */}
          <AnimatePresence>
            {tasks.length > 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold">
                      {tasks.length} task{tasks.length === 1 ? "" : "s"} generated
                    </h4>
                    {source && (
                      <Badge variant="outline" className="gap-1 text-[10px] capitalize border-brand/30 text-brand">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                        {source === "ai" ? "AI" : "Heuristic"}
                      </Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {selected.size === tasks.length ? "Deselect all" : "Select all"}
                  </button>
                </div>

                <div className="space-y-2">
                  {tasks.map((task, i) => {
                    const isSel = selected.has(i);
                    const meta = PRIORITIES[task.priority];
                    return (
                      <motion.label
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        htmlFor={`ai-task-${i}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                          isSel
                            ? "border-brand/40 bg-brand/5"
                            : "border-border bg-card/40 hover:bg-muted/40",
                        )}
                      >
                        <Checkbox
                          id={`ai-task-${i}`}
                          checked={isSel}
                          onCheckedChange={() => toggleTask(i)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{task.title}</p>
                          </div>
                          {task.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                          )}
                          <Badge variant="outline" className={cn("mt-2 gap-1.5 capitalize", meta.badge)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                            {meta.label}
                          </Badge>
                        </div>
                        <Select
                          value={task.priority}
                          onValueChange={(v) => {
                            const next = [...tasks];
                            next[i] = { ...task, priority: v as Priority };
                            setTasks(next);
                          }}
                        >
                          <SelectTrigger className="h-7 w-[104px] shrink-0 text-xs" aria-label="Edit priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_LIST.map((p) => (
                              <SelectItem key={p} value={p} className="capitalize">{PRIORITIES[p].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.label>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleAddSelected} disabled={tasks.length === 0 || selected.size === 0} className="bg-brand">
            <Check className="h-4 w-4" />
            Add Selected ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
