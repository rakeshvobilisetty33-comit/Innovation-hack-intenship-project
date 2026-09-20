"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Percent,
  Sparkles,
  FilePlus2,
  FolderPlus,
  PencilLine,
  Trash2,
  ArrowRightCircle,
  Bot,
} from "lucide-react";

import { ProfileHeader } from "@/components/profile/profile-header";
import { AnimatedCounter } from "@/components/common/animated-counter";
import { EmptyState } from "@/components/common/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";
import { useToast } from "@/hooks/use-toast";
import { formatRelative } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Activity, User } from "@/lib/types";

// Pick the right icon for an activity.
function activityIcon(a: Activity) {
  if (a.entityType === "ai") return Bot;
  if (a.action === "created" && a.entityType === "project") return FolderPlus;
  if (a.action === "created" && a.entityType === "task") return FilePlus2;
  if (a.action === "completed") return CheckCircle2;
  if (a.action === "deleted") return Trash2;
  if (a.action === "generated") return Sparkles;
  if (a.action === "updated" || a.action === "moved") return PencilLine;
  return ArrowRightCircle;
}

function activityIconTint(a: Activity): string {
  if (a.entityType === "ai") return "bg-brand/12 text-brand";
  if (a.action === "completed") return "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300";
  if (a.action === "deleted") return "bg-destructive/10 text-destructive";
  if (a.action === "created") return "bg-brand/12 text-brand";
  return "bg-muted text-muted-foreground";
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  delay?: number;
}

function StatCard({ icon, label, value, suffix, hint, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
    >
      <Card className="h-full">
        <CardContent className="flex h-full flex-col justify-between gap-3 p-5">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand",
              )}
              aria-hidden
            >
              {icon}
            </span>
          </div>
          <div>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">
              <AnimatedCounter value={value} suffix={suffix} />
            </div>
            {hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ProfileView() {
  const user = useAuthStore((s) => s.user) as User | null;
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const projects = useDataStore((s) => s.projects);
  const tasks = useDataStore((s) => s.tasks);
  const activities = useDataStore((s) => s.activities);
  const { toast } = useToast();

  if (!user) {
    return (
      <EmptyState
        title="Profile unavailable"
        description="Please sign in to view your profile."
      />
    );
  }

  // Compute stats. Use both id and name to be defensive against mock owner changes.
  const owns = (p: { owner: string; ownerName?: string }) =>
    p.owner === user.id || (p.ownerName != null && p.ownerName === user.name);

  const assigned = (t: { assignedTo: string; assignedName?: string }) =>
    t.assignedTo === user.id || (t.assignedName != null && t.assignedName === user.name);

  const ownedProjects = projects.filter(owns);
  const assignedTasks = tasks.filter(assigned);
  const completedTasks = assignedTasks.filter((t) => t.status === "done");
  const completionRate =
    assignedTasks.length === 0
      ? 0
      : Math.round((completedTasks.length / assignedTasks.length) * 100);

  // Recent activity (top 6 for this user).
  const myActivities = activities
    .filter(
      (a) =>
        a.user === user.id ||
        (a.userName != null && a.userName === user.name),
    )
    .slice(0, 6);

  function handleSave(patch: Partial<Pick<User, "name" | "email" | "bio" | "role" | "avatar">>) {
    updateProfile(patch);
    toast({ title: "Profile updated", description: "Your changes have been saved." });
    return true;
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <ProfileHeader user={user} onSave={handleSave} />

      {/* Stats */}
      <section
        aria-label="Profile statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={<FolderKanban className="h-5 w-5" />}
          label="Projects owned"
          value={ownedProjects.length}
          hint={`${ownedProjects.filter((p) => p.status === "active").length} active`}
          delay={0.02}
        />
        <StatCard
          icon={<ListChecks className="h-5 w-5" />}
          label="Tasks assigned"
          value={assignedTasks.length}
          hint={`across ${new Set(assignedTasks.map((t) => t.project)).size} projects`}
          delay={0.06}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed tasks"
          value={completedTasks.length}
          hint="status: done"
          delay={0.1}
        />
        <StatCard
          icon={<Percent className="h-5 w-5" />}
          label="Completion rate"
          value={completionRate}
          suffix="%"
          hint={completionRate >= 75 ? "On track" : "Keep going"}
          delay={0.14}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* About */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
            <CardDescription>A short bio shown on your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90">
              {user.bio?.trim() ? (
                user.bio
              ) : (
                <span className="text-muted-foreground italic">
                  No bio yet. Click “Edit profile” to add a few words about yourself.
                </span>
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-brand/25 bg-brand/10 text-brand-accent dark:text-[color-mix(in_oklch,var(--brand)_65%,white)]"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {user.role || "Member"}
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                ID · {user.id.replace(/^user_/, "")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription>The last few things you worked on.</CardDescription>
              </div>
              <ActivityIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            {myActivities.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Your recent actions will appear here."
                className="py-6"
              />
            ) : (
              <ul className="relative divide-y divide-border">
                {myActivities.map((a, idx) => {
                  const Icon = activityIcon(a);
                  return (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          activityIconTint(a),
                        )}
                        aria-hidden
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-medium capitalize">{a.action}</span>{" "}
                          <span className="text-muted-foreground">
                            {a.description.replace(new RegExp(`^${a.action}\\s+`, "i"), "")}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRelative(a.createdAt)}
                        </p>
                      </div>
                      {idx === 0 && (
                        <Badge
                          variant="outline"
                          className="border-brand/25 bg-brand/10 text-brand"
                        >
                          Latest
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
