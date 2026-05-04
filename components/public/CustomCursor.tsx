"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);
  const x = useSpring(rawX, { stiffness: 500, damping: 35 });
  const y = useSpring(rawY, { stiffness: 500, damping: 35 });

  useEffect(() => {
    setIsDesktop(window.innerWidth > 768 && !("ontouchstart" in window));
    if (!isDesktop) return;

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX - 10);
      rawY.set(e.clientY - 10);
    };
    const onPointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") !== null ||
        target.closest("button") !== null
      );
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onPointerOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onPointerOver);
    };
  }, [isDesktop, rawX, rawY]);

  if (!isDesktop) return null;

  return (
    <>
      {/* Dot principal */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-multiply"
        style={{ x, y }}
      >
        <motion.div
          className="rounded-full bg-[#C4728A]"
          animate={{
            width: isPointer ? 40 : 20,
            height: isPointer ? 40 : 20,
            opacity: isPointer ? 0.25 : 0.45,
            marginLeft: isPointer ? -10 : 0,
            marginTop: isPointer ? -10 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        />
      </motion.div>
    </>
  );
}
