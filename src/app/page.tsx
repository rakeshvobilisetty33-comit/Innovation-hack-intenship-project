"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";
import { useUIStore } from "@/store/ui-store";
import { Logo } from "@/components/common/logo";

import LoginView from "@/pages/auth/login-view";
import RegisterView from "@/pages/auth/register-view";
import DashboardView from "@/pages/dashboard/dashboard-view";
import ProjectsView from "@/pages/projects/projects-view";
import ProjectDetailsView from "@/pages/projects/project-details-view";
import TasksView from "@/pages/tasks/tasks-view";
import ProfileView from "@/pages/profile/profile-view";
import SettingsView from "@/pages/settings/settings-view";
import NotFoundView from "@/pages/not-found-view";

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
    return <AuthShell />;
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
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeView}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
