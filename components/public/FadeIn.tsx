"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  className?: string;
  duration?: number;
}

const directionMap = {
  up:    { y: 40,  x: 0 },
  left:  { y: 0,   x: -40 },
  right: { y: 0,   x: 40 },
  none:  { y: 0,   x: 0 },
};

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className,
  duration = 0.7,
}: Props) {
  const { x, y } = directionMap[direction];

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration,
        delay: delay / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
