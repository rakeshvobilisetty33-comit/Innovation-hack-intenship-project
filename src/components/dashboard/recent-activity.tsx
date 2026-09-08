"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Activity } from "@/lib/types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

// Decorative left-border accent per activity action verb.
// Uses OKLCH values that read in both light & dark themes; brand for creates.
const ACTION_BORDER: Record<string, string> = {
  created: "var(--brand)",
  updated: "oklch(0.7 0.005 250)",
  completed: "oklch(0.65 0.16 152)",
  deleted: "oklch(0.62 0.22 25)",
  generated: "oklch(0.62 0.2 305)",
  moved: "oklch(0.7 0.18 55)",
};

export interface RecentActivityProps {
  activities?: Activity[];
  limit?: number;
  onViewAll?: () => void;
  className?: string;
}

export function RecentActivity({
  activities,
  limit = 12,
  onViewAll,
  className,
}: RecentActivityProps) {
  const list = React.useMemo(
    () => (activities ?? []).slice(0, limit),
    [activities, limit],
  );

  return (
    <Card className={cn("flex h-full flex-col gap-0 p-0", className)}>
      <CardHeader className="px-5 pt-5">
        <CardTitle className="text-base font-semibold">
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden px-0 pb-0">
        <div className="scrollbar-thin max-h-[420px] min-h-[280px] flex-1 overflow-y-auto px-3">
          {list.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : (
            <ul className="space-y-1 pb-2">
              {list.map((a, i) => {
                const accent =
                  ACTION_BORDER[a.action] ?? "var(--muted-foreground)";
                return (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.22,
                      delay: Math.min(i * 0.025, 0.25),
                      ease: "easeOut",
                    }}
                    className="relative ml-3 rounded-r-md py-2.5 pl-3 pr-2 transition-colors hover:bg-muted/40 focus-within:bg-muted/60"
                    style={{ borderLeft: `2px solid ${accent}` }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-muted text-[11px] font-medium text-muted-foreground">
                          {getInitials(a.userName ?? "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          <span className="font-semibold">
                            {a.userName ?? "Someone"}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {a.description}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRelative(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
        {onViewAll && (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-muted-foreground hover:text-foreground"
              onClick={onViewAll}
            >
              View all
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
