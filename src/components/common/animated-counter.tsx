"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";

// Animated number counter for dashboard statistics.
export function AnimatedCounter({
  value,
  duration = 1.1,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 });

  React.useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  const [display, setDisplay] = React.useState("0");
  React.useEffect(() => {
    const unsub = spring.on("change", (latest) => {
      const rounded = Math.round(latest);
      setDisplay(rounded.toLocaleString());
    });
    return () => unsub();
  }, [spring]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
