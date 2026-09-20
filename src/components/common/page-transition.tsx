"use client";

import * as React from "react";

// Shared page transition wrapper (CSS-based, no framer-motion).
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"animate-in fade-in-0 slide-in-from-bottom-1 duration-300 " + (className ?? "")}>
      {children}
    </div>
  );
}

export function AnimateList({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={"animate-in fade-in-0 duration-300 " + (className ?? "")}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
