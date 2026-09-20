"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className}
    >
      <Sun
        className="h-[1.05rem] w-[1.05rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden
      />
      <Moon
        className="absolute h-[1.05rem] w-[1.05rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden
      />
    </Button>
  );
}
