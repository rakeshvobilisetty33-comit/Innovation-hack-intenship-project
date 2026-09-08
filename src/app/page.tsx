"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/app-shell";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuthStore } from "@/store/auth-store";
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
  const view = useUIStore((s) => s.view);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
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
