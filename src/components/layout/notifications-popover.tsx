"use client";

import * as React from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  FolderKanban,
  AlertTriangle,
  Sparkles,
  Info,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore, type AppNotification } from "@/store/notification-store";
import { useUIStore } from "@/store/ui-store";
import { formatRelative } from "@/lib/constants";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: AppNotification["type"]) {
  switch (type) {
    case "task":
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case "project":
      return <FolderKanban className="size-4 text-sky-500" />;
    case "warning":
      return <AlertTriangle className="size-4 text-amber-500" />;
    case "success":
      return <Sparkles className="size-4 text-brand" />;
    default:
      return <Info className="size-4 text-muted-foreground" />;
  }
}

export function NotificationsPopover() {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const setView = useUIStore((s) => s.setView);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = React.useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const handleNotificationClick = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.targetView) {
      setView(item.targetView);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
            open
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="size-4 transition-transform duration-200 hover:rotate-12" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] sm:w-[390px] p-0 shadow-2xl border-border/70 backdrop-blur-xl bg-card/95 animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[11px] font-medium bg-brand/10 text-brand border-none">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={markAllAsRead}
            >
              <Check className="size-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-border/50 px-4 py-1.5 bg-muted/20">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              filter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              filter === "unread"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[360px] overflow-y-auto scrollbar-thin p-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 mb-2.5">
                <Bell className="size-5 text-muted-foreground/60" />
              </div>
              <p className="text-xs font-semibold text-foreground">All caught up!</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {filter === "unread"
                  ? "No unread notifications at the moment."
                  : "You have no notifications right now."}
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-lg p-2.5 transition-colors cursor-pointer",
                    item.read
                      ? "hover:bg-muted/40 text-muted-foreground"
                      : "bg-brand/5 hover:bg-brand/10 text-foreground",
                  )}
                  onClick={() => handleNotificationClick(item)}
                >
                  {/* Leading icon */}
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-background border border-border/60 shadow-2xs">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className={cn("text-xs font-semibold leading-tight", !item.read && "text-foreground")}>
                        {item.title}
                      </p>
                      {!item.read && (
                        <span className="size-1.5 shrink-0 rounded-full bg-brand" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">
                      {item.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/80">
                        {formatRelative(item.createdAt)}
                      </span>
                      {item.targetView && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-brand font-medium">
                          View <ExternalLink className="size-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background/80 rounded text-muted-foreground hover:text-foreground"
                    aria-label="Dismiss notification"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/70 px-3 py-2 bg-muted/15 text-xs">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
            onClick={() => {
              setView("settings");
              setOpen(false);
            }}
          >
            Preferences
          </Button>

          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive px-2 gap-1"
              onClick={clearAll}
            >
              <Trash2 className="size-3" />
              Clear all
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
