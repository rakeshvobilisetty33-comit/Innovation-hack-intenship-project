"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { TaskCard } from "./task-card";
import type { Priority, Task, TaskStatus } from "@/lib/types";

export interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpenProject: (projectId: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange?: (id: string, priority: Priority) => void;
}

export function TaskList({
  tasks,
  onEdit,
  onDelete,
  onOpenProject,
  onStatusChange,
  onPriorityChange,
}: TaskListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-w-0"
          >
            <TaskCard
              task={task}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              onOpenProject={() => onOpenProject(task.project)}
              onStatusChange={(status) => onStatusChange(task.id, status)}
              onPriorityChange={
                onPriorityChange
                  ? (priority) => onPriorityChange(task.id, priority)
                  : undefined
              }
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
