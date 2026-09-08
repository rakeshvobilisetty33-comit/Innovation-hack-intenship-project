"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { useToast } from "@/hooks/use-toast";

// Polished 404 — emoji-free SVG composition with a Lucide Compass in a tinted circle.
export default function NotFoundView() {
  const setView = useUIStore((s) => s.setView);
  const { toast } = useToast();

  function reportIssue() {
    toast({
      title: "Thanks! Issue noted (demo)",
      description: "We've logged this 404 for the team.",
    });
  }

  return (
    <div
      className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center"
      role="main"
      aria-labelledby="notfound-title"
    >
      {/* Subtle dotted backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dots opacity-40" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        {/* Compass illustration (no emoji, accessible) */}
        <div className="relative mb-8" aria-hidden>
          <div className="absolute inset-0 -z-10 rounded-full bg-brand/15 blur-2xl" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-brand/25 bg-brand/10 sm:h-32 sm:w-32">
            <Compass className="h-12 w-12 text-brand sm:h-14 sm:w-14" />
            {/* Decorative drifting dot */}
            <motion.span
              className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-brand shadow-brand"
              initial={{ opacity: 0.4, scale: 0.8 }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Big 404 with brand gradient */}
        <p className="text-7xl font-bold tracking-tight text-gradient-brand sm:text-8xl">
          404
        </p>

        <h1 id="notfound-title" className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
          This page drifted off the roadmap.
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist, may have been moved, or you might not
          have access to it yet. Let&apos;s get you back on course.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => setView("dashboard")}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to dashboard
          </Button>
          <Button
            onClick={reportIssue}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden />
            Report an issue
          </Button>
        </div>
      </motion.div>

      {/* Tiny brand footer */}
      <p className="mt-12 text-xs text-muted-foreground">
        DevFlow AI · If this keeps happening, reach out to your workspace admin.
      </p>
    </div>
  );
}
