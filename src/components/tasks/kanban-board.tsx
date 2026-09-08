"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";
import { TASK_STATUSES, TASK_STATUS_LIST } from "@/lib/constants";
import type { Priority, Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpenProject: (projectId: string) => void;
  onPriorityChange?: (id: string, priority: Priority) => void;
}

interface ColumnProps extends KanbanBoardProps {
  status: TaskStatus;
}

function Column({
  status,
  tasks,
  onEdit,
  onDelete,
  onOpenProject,
  onStatusChange,
  onPriorityChange,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${status}`,
    data: { status },
  });

  const meta = TASK_STATUSES[status];

  return (
    <section
      aria-label={`${meta.label} column with ${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
      className="flex flex-col rounded-xl border bg-muted/30"
    >
      {/* Column header */}
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn("h-2.5 w-2.5 rounded-full", meta.dot)}
            aria-hidden
          />
          <h3 className="text-sm font-semibold">{meta.label}</h3>
          <Badge
            variant="secondary"
            className="ml-1 h-5 min-w-5 justify-center px-1.5 text-[10px] font-medium"
          >
            {tasks.length}
          </Badge>
        </div>
      </header>

      {/* Droppable body */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[140px] space-y-2 overflow-y-auto scrollbar-thin p-2 transition-colors",
          "max-h-[60vh] md:max-h-[calc(100vh-280px)]",
          isOver && "bg-brand/5 ring-2 ring-inset ring-brand/40",
        )}
      >
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenProject={onOpenProject}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
            />
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
}

interface DraggableCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpenProject: (projectId: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange?: (id: string, priority: Priority) => void;
}

function DraggableCard({
  task,
  onEdit,
  onDelete,
  onOpenProject,
  onStatusChange,
  onPriorityChange,
}: DraggableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { task, status: task.status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <TaskCard
        task={task}
        isDragging={isDragging}
        dragRef={setNodeRef}
        dragStyle={style}
        dragHandleProps={{ attributes, listeners }}
        onEdit={() => onEdit(task)}
        onDelete={() => onDelete(task)}
        onOpenProject={() => onOpenProject(task.project)}
        onStatusChange={(s) => onStatusChange(task.id, s)}
        onPriorityChange={
          onPriorityChange
            ? (p) => onPriorityChange(task.id, p)
            : undefined
        }
      />
    </motion.div>
  );
}

export function KanbanBoard(props: KanbanBoardProps) {
  const { tasks, onStatusChange } = props;
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  const activeTask = React.useMemo(
    () => tasks.find((t) => t.id === activeId) ?? null,
    [tasks, activeId],
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("col-")) return;
    const newStatus = overId.slice(4) as TaskStatus;
    const taskId = String(active.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onStatusChange(taskId, newStatus);
    }
  };

  const handleDragCancel = (_e: DragCancelEvent) => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_STATUS_LIST.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            onEdit={props.onEdit}
            onDelete={props.onDelete}
            onOpenProject={props.onOpenProject}
            onStatusChange={props.onStatusChange}
            onPriorityChange={props.onPriorityChange}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            variant="overlay"
            onEdit={() => {}}
            onDelete={() => {}}
            onOpenProject={() => {}}
            onStatusChange={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
