"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  CheckCheck,
  FolderKanban,
  ListChecks,
  ListTodo,
  Plus,
  Sparkles,
} from "lucide-react";

import { useDataStore } from "@/store/data-store";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { EmptyState } from "@/components/common/empty-state";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import { TaskOverview } from "@/components/dashboard/task-overview";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function QuickActions() {
  const setView = useUIStore((s) => s.setView);
  const { toast } = useToast();

  const actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    primary?: boolean;
  }> = [
    {
      label: "New Project",
      icon: <Plus className="size-4" />,
      onClick: () => setView("projects"),
      primary: true,
    },
    {
      label: "View Tasks",
      icon: <ListTodo className="size-4" />,
      onClick: () => setView("tasks"),
    },
    {
      label: "AI Generate",
      icon: <Sparkles className="size-4" />,
      onClick: () =>
        toast({
          title: "AI task generation",
          description: "Open a project to generate tasks with AI.",
        }),
    },
  ];

  return (
    <Card className="flex h-full flex-col gap-0 p-5 sm:p-6">
      <div>
        <h3 className="text-base font-semibold">Quick actions</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Jump back into your workflow.
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant={a.primary ? "default" : "outline"}
            className="h-11 justify-start gap-2"
            onClick={a.onClick}
          >
            {a.icon}
            {a.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-[124px] gap-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="size-11 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-3 w-28" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="h-[260px] gap-0 p-6 xl:col-span-2">
          <Skeleton className="h-5 w-40" />
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <Skeleton className="size-36 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        </Card>
        <Card className="h-[260px] gap-0 p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-6 space-y-2.5">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="h-[360px] gap-0 p-6 lg:col-span-2">
          <Skeleton className="h-5 w-32" />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </Card>
        <Card className="h-[360px] gap-0 p-0">
          <div className="p-5">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-3 px-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="gap-0 p-0">
        <div className="p-5">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-4 px-5 pb-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function DashboardView() {
  const user = useAuthStore((s) => s.user);
  const projects = useDataStore((s) => s.projects);
  const tasks = useDataStore((s) => s.tasks);
  const activities = useDataStore((s) => s.activities);
  const stats = useDataStore((s) => s.stats);
  const openProject = useUIStore((s) => s.openProject);
  const setView = useUIStore((s) => s.setView);
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const firstName = (user?.name ?? "there").split(" ")[0];
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const s = stats();

  // Plausible deltas computed from real mock timestamps (relative to now).
  const weekAgo = Date.now() - 7 * 86_400_000;
  const newProjectsThisWeek = projects.filter(
    (p) => new Date(p.createdAt).getTime() > weekAgo,
  ).length;
  const newTasksThisWeek = tasks.filter(
    (t) => new Date(t.createdAt).getTime() > weekAgo,
  ).length;
  const completedThisWeek = tasks.filter(
    (t) =>
      t.status === "done" && new Date(t.updatedAt).getTime() > weekAgo,
  ).length;

  const isEmpty = projects.length === 0 && tasks.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Greeting header */}
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <time>{today}</time>
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}, {firstName}
            <span aria-hidden="true" className="ml-1.5">
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your workspace today.
          </p>
        </div>
      </motion.header>

      {loading ? (
        <DashboardSkeleton />
      ) : isEmpty ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Your workspace is empty"
          description="Create your first project to start organizing tasks, track progress and ship faster with DevFlow AI."
          action={
            <Button
              className="h-11 gap-2"
              onClick={() => setView("projects")}
            >
              <Plus className="size-4" />
              Create your first project
            </Button>
          }
        />
      ) : (
        <>
          {/* Stat cards row */}
          <section
            aria-label="Key statistics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatsCard
              icon={<FolderKanban className="size-5" />}
              label="Total Projects"
              value={s.totalProjects}
              accent="brand"
              caption={
                newProjectsThisWeek === 0
                  ? "across your workspace"
                  : undefined
              }
              trend={
                newProjectsThisWeek > 0
                  ? {
                      dir: "up",
                      text: `+${newProjectsThisWeek} this week`,
                    }
                  : undefined
              }
            />
            <StatsCard
              icon={<Activity className="size-5" />}
              label="Active Projects"
              value={s.activeProjects}
              accent="success"
              caption="currently in progress"
            />
            <StatsCard
              icon={<ListChecks className="size-5" />}
              label="Total Tasks"
              value={s.totalTasks}
              accent="neutral"
              caption={
                newTasksThisWeek === 0 ? `${s.pendingTasks} pending` : undefined
              }
              trend={
                newTasksThisWeek > 0
                  ? {
                      dir: "up",
                      text: `+${newTasksThisWeek} this week`,
                    }
                  : undefined
              }
            />
            <StatsCard
              icon={<CheckCheck className="size-5" />}
              label="Completed Tasks"
              value={s.completedTasks}
              accent="success"
              caption={
                completedThisWeek === 0
                  ? `${s.completionRate}% completion rate`
                  : undefined
              }
              trend={
                completedThisWeek > 0
                  ? {
                      dir: "up",
                      text: `+${completedThisWeek} this week`,
                    }
                  : undefined
              }
            />
          </section>

          {/* Progress + Quick actions row */}
          <section
            aria-label="Progress and quick actions"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <ProgressCard
              className="sm:col-span-2 xl:col-span-2"
              overallProgress={s.overallProgress}
              completionRate={s.completionRate}
              completedTasks={s.completedTasks}
              totalTasks={s.totalTasks}
              pendingTasks={s.pendingTasks}
              overdueTasks={s.overdueTasks}
            />
            <QuickActions />
          </section>

          {/* Charts + Activity row */}
          <section
            aria-label="Tasks analytics and recent activity"
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
          >
            <TaskOverview tasks={tasks} className="lg:col-span-2" />
            <RecentActivity
              activities={activities}
              className="lg:col-span-1"
              onViewAll={() =>
                toast({
                  title: "Activity timeline",
                  description: "The full activity feed view is coming soon.",
                })
              }
            />
          </section>

          {/* Project overview */}
          <section aria-label="Top projects">
            <ProjectOverview
              projects={projects}
              onOpenProject={openProject}
              onViewAll={() => setView("projects")}
            />
          </section>
        </>
      )}
    </div>
  );
}
