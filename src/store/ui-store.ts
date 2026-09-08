"use client";

import { create } from "zustand";

// Client-side view router (single `/` route constraint).
// Mimics React Router navigation within the Next.js App Router.

export type ViewId =
  | "dashboard"
  | "projects"
  | "project-details"
  | "tasks"
  | "profile"
  | "settings"
  | "not-found";

interface UIState {
  view: ViewId;
  selectedProjectId: string | null;
  sidebarOpen: boolean; // mobile drawer
  commandOpen: boolean;
  setView: (view: ViewId) => void;
  openProject: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  goBack: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  view: "dashboard",
  selectedProjectId: null,
  sidebarOpen: false,
  commandOpen: false,
  setView: (view) => set({ view, sidebarOpen: false }),
  openProject: (id) => set({ view: "project-details", selectedProjectId: id, sidebarOpen: false }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  goBack: () => {
    if (get().view === "project-details") set({ view: "projects", selectedProjectId: null });
    else set({ view: "dashboard" });
  },
}));

export const NAV_ITEMS: { id: ViewId; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { id: "projects", label: "Projects", icon: "FolderKanban" },
  { id: "tasks", label: "Tasks", icon: "ListChecks" },
];
