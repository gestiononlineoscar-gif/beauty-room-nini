"use client";

import { useScroll, useSpring, useTransform, motion } from "framer-motion";

export function TracingBeam() {
  const { scrollYProgress } = useScroll();
  const scaleYSpring = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const height = useTransform(scaleYSpring, [0, 1], ["0%", "100%"]);

  return (
    <div className="fixed left-6 top-0 h-screen z-40 hidden lg:flex flex-col items-center pointer-events-none">
      {/* Track */}
      <div className="flex-1 w-px bg-[#C4728A]/15 rounded-full mt-20 mb-20 relative overflow-hidden">
        {/* Beam fill */}
        <motion.div
          className="absolute top-0 left-0 w-full rounded-full"
          style={{
            height,
            background: "linear-gradient(to bottom, #C4728A, #e8a0b4)",
          }}
        />
      </div>
      {/* Glowing dot at current scroll position */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-[#C4728A] shadow-[0_0_8px_#C4728A]"
        style={{
          top: useTransform(scaleYSpring, [0, 1], ["calc(5vh + 80px)", "calc(95vh - 80px)"]),
        }}
      />
    </div>
  );
}
