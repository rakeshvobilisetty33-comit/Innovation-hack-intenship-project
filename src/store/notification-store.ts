"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ViewId } from "@/store/ui-store";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "task" | "project";
  read: boolean;
  createdAt: string;
  targetView?: ViewId;
  targetId?: string;
  projectName?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: () => number;
  addNotification: (
    n: Omit<AppNotification, "id" | "createdAt" | "read"> & {
      id?: string;
      createdAt?: string;
      read?: boolean;
    },
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_welcome",
    title: "Welcome to DevFlow AI",
    message: "Your workspace is live. Create your first project or tasks to get started.",
    type: "success",
    read: false,
    createdAt: new Date().toISOString(),
    targetView: "dashboard",
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: DEFAULT_NOTIFICATIONS,

      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      addNotification: (n) => {
        const item: AppNotification = {
          id: n.id || "notif_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          title: n.title,
          message: n.message,
          type: n.type || "info",
          read: n.read ?? false,
          createdAt: n.createdAt || new Date().toISOString(),
          targetView: n.targetView,
          targetId: n.targetId,
          projectName: n.projectName,
        };

        set((s) => ({
          notifications: [item, ...s.notifications].slice(0, 50),
        }));
      },

      markAsRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }));
      },

      markAllAsRead: () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      removeNotification: (id) => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: "devflow-notifications",
    },
  ),
);
