"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";
import { useUIStore } from "@/store/ui-store";
import { Logo } from "@/components/common/logo";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-load the views so each heavy page (dashboard, tasks with dnd-kit)
// compiles on demand into its own chunk rather than all at once.
const LoginView = React.lazy(() => import("@/pages/auth/login-view"));
const RegisterView = React.lazy(() => import("@/pages/auth/register-view"));
const DashboardView = React.lazy(() => import("@/pages/dashboard/dashboard-view"));
const ProjectsView = React.lazy(() => import("@/pages/projects/projects-view"));
const ProjectDetailsView = React.lazy(() => import("@/pages/projects/project-details-view"));
const TasksView = React.lazy(() => import("@/pages/tasks/tasks-view"));
const ProfileView = React.lazy(() => import("@/pages/profile/profile-view"));
const SettingsView = React.lazy(() => import("@/pages/settings/settings-view"));
const NotFoundView = React.lazy(() => import("@/pages/not-found-view"));

function ViewLoader() {
  return (
    <div className="space-y-4 p-1">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const view = useUIStore((s) => s.view);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // One-shot session hydration on app mount: validate the persisted JWT
  // against /api/auth/me and, if still valid, pull the user's workspace
  // (projects/tasks/activities/users) from the REST API.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const auth = useAuthStore.getState();
      if (!auth.hydrated) {
        await auth.hydrate();
      }
      if (cancelled) return;
      if (useAuthStore.getState().isAuthenticated) {
        await useDataStore.getState().hydrate();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When the user logs in (auth state flips from false → true), pull the
  // workspace data. Skips if already hydrated (e.g. on session restore).
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const data = useDataStore.getState();
    if (!data.hydrated && !data.loading) {
      void data.hydrate();
    }
  }, [isAuthenticated]);

  if (!mounted || !authHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={36} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Logo size={36} /></div>}>
        <AuthShell />
      </React.Suspense>
    );
  }

  const activeView = (() => {
    switch (view) {
      case "dashboard":
        return <DashboardView />;
      case "projects":
        return <ProjectsView />;
      case "project-details":
        return <ProjectDetailsView />;
      case "tasks":
        return <TasksView />;
      case "profile":
        return <ProfileView />;
      case "settings":
        return <SettingsView />;
      default:
        return <NotFoundView />;
    }
  })();

  return (
    <AppShell>
      <div key={view} className="animate-view-enter">
        <React.Suspense fallback={<ViewLoader />}>
          {activeView}
        </React.Suspense>
      </div>
    </AppShell>
  );
}
