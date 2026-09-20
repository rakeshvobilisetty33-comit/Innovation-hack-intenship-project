# Task 1-d — Projects (Subagent: projects)

## Scope
Build the frontend Projects pages and components for DevFlow AI Phase 1.

Files owned & created/overwritten:
- `src/pages/projects/projects-view.tsx` — default export `ProjectsView`
- `src/pages/projects/project-details-view.tsx` — default export `ProjectDetailsView`
- `src/components/projects/project-card.tsx` — named export `ProjectCard`
- `src/components/projects/project-form.tsx` — named export `ProjectForm`

## What was built

### ProjectsView
- Sub-toolbar: "New project" primary button, search Input (filters by name/description, instant), status Select (PROJECT_STATUS_LIST + "All"), "AI" ghost button (toasts only).
- Active filter chips: removable Badges for search and status, plus a "Clear filters" link. AnimatePresence height animation.
- Responsive project grid: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4`.
- Each card: name (truncate) + ProjectStatusBadge + DropdownMenu (Edit/Delete), 2-line description clamp, Progress bar with %, footer with members avatar stack (initials, overlapping), task count (from `tasksForProject`), updatedAt relative.
- Whole card clickable (`role="button"`, Enter/Space keyboard support, hover lift + ring). Menu trigger stops propagation.
- Create dialog and Edit dialog both use ProjectForm. Edit uses decoupled open/project state so the form stays mounted during the Dialog exit animation.
- Delete uses ConfirmDialog (destructive) → deleteProject + destructive toast.
- Loading: skeleton grid for ~500ms on first mount.
- Empty state: EmptyState with FolderKanban icon; contextual message + CTA based on whether filters are active.
- AnimatePresence + layout animations on cards (subtle, popLayout mode for smooth reflow on filter changes).

### ProjectForm
- Renders inside a Dialog (parent provides Dialog wrapper).
- Fields: Name (Input, min 2, required, aria-invalid feedback), Description (Textarea, max 280 with live counter), Status (Select from PROJECT_STATUS_LIST with colored dot indicator), Progress (Slider 0–100 with live %).
- Submit button label adapts: "Create project" / "Save changes".
- Inline validation; submit disabled when invalid. Parent handles success toast.

### ProjectDetailsView
- Reads `useUIStore` (selectedProjectId, goBack, setView), `useDataStore` (getProject, tasksForProject, activities, updateProject, deleteProject), `useToast`.
- If selectedProjectId null OR project missing → EmptyState with FolderKanban + "Back to projects" CTA.
- Header card: back button, project name (h1), ProjectStatusBadge, description, Edit + Delete buttons.
- Stats strip: Total tasks / Completed / Pending / Overdue (computed via tasksForProject + isOverdue). Each stat card has a tonal icon.
- Progress + members row: overall Progress bar + dl with created/updated/owner/member count; Team members list with avatars and "Owner" badge.
- Tasks list card (inline rows — DOES NOT import from src/components/tasks/*): title, TaskStatusBadge, PriorityBadge, assignee name, due date (red when overdue). Sorted by priority weight desc then due date asc. Empty inline state. "Add task" button → setView('tasks') + toast.
- Recent activity card: activities where entityId === project.id, latest 5, formatRelative.
- Edit dialog (ProjectForm prefilled) → updateProject + toast. Delete dialog (ConfirmDialog destructive) → deleteProject + toast + goBack().
- Subtle motion entrance, responsive stacks on mobile.

### ProjectCard
- Props: `{project, onOpen, onEdit, onDelete, taskCount}`.
- Uses `ProjectStatusBadge`, `Progress`, `Avatar`/`AvatarFallback` stack with deterministic tone per member name, `DropdownMenu` (MoreHorizontal trigger; Edit/Delete items).
- Whole card clickable via role="button" + tabIndex=0 + Enter/Space handler. Hover lift via motion `whileHover`, ring on hover/focus.
- Footer: avatar stack (max 4 + "+N" overflow), task count, updatedAt relative.

## Cross-dependency compliance
- ProjectStatusBadge, TaskStatusBadge, PriorityBadge imported from `@/components/common/badges` (NOT recreated).
- Task list inside ProjectDetailsView is inline (no imports from `src/components/tasks/*`).
- formatDate / formatRelative / isOverdue / PRIORITIES / PROJECT_STATUSES / PROJECT_STATUS_LIST imported from `@/lib/constants`.
- EmptyState from `@/components/common/empty-state`, ConfirmDialog from `@/components/common/confirm-dialog`.
- `ProjectInput` type imported from `@/store/data-store` (NOT @/lib/types — that file does not export it).
- No API routes, no Prisma, no fetch/axios used. Mock data via existing Zustand stores only.

## Quality verification
- `bunx eslint src/components/projects/ src/pages/projects/` → clean (0 errors, 0 warnings).
- `bunx tsc --noEmit` → no errors in my files (only unrelated errors in examples/* and skills/*).
- Dev server (`:3000`) returns 200; dev.log shows no compile errors related to my code.

## Known minor caveat
- The `text-brand-accent` Tailwind class used by `@/components/common/badges` is not registered as a `--color-brand-accent` token in `globals.css`, so the "active" project status badge text may fall back to inherited color in light mode. This is owned by 1-a (foundation) and was NOT modified by this task.

## Files touched
- Created: `src/components/projects/project-form.tsx`, `src/components/projects/project-card.tsx`
- Overwritten: `src/pages/projects/projects-view.tsx`, `src/pages/projects/project-details-view.tsx`
