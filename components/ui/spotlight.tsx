"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  color?: string;
  size?: number;
}

export function Spotlight({ className, color = "#C4728A", size = 700 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={ref} className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      <div
        className="absolute inset-0 transition-all duration-75"
        style={{
          background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${color}1a, transparent 40%)`,
        }}
      />
    </div>
  );
}
