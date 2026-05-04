"use client";

import { useEffect, useRef } from "react";
import { useInView, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function NumberTicker({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.8,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -5% 0px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const ctrl = animate(0, value, {
      duration,
      ease: [0.0, 0.0, 0.2, 1],
      onUpdate: (v) => {
        el.textContent = prefix + v.toFixed(decimals) + suffix;
      },
    });
    return () => ctrl.stop();
  }, [inView, value, decimals, duration, suffix, prefix]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}0{suffix}
    </span>
  );
}
