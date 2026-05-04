"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export function HeroParallaxBg() {
  const { scrollY } = useScroll();

  const imgY = useTransform(scrollY, [0, 700], [0, 140]);
  const blob1Y = useTransform(scrollY, [0, 700], [0, -90]);
  const blob2Y = useTransform(scrollY, [0, 700], [0, -55]);
  const blob3Y = useTransform(scrollY, [0, 700], [0, 65]);
  const scrollOpacity = useTransform(scrollY, [0, 180], [1, 0]);

  return (
    <>
      {/* Background image — scale-110 prevents white edges during parallax travel */}
      <motion.div style={{ y: imgY }} className="absolute inset-0 scale-110">
        <Image
          src="/hero.png"
          alt="Beauty Room Nini"
          fill
          priority
          className="object-cover object-center opacity-30"
        />
      </motion.div>

      {/* Orbe grande — mueve lento */}
      <motion.div
        style={{ y: blob1Y }}
        className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#C4728A]/12 blur-[120px] pointer-events-none"
      />

      {/* Orbe medio — mueve a velocidad media */}
      <motion.div
        style={{ y: blob2Y }}
        className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-[#C4728A]/10 blur-3xl pointer-events-none"
      />

      {/* Orbe pequeño — contrapunto */}
      <motion.div
        style={{ y: blob3Y }}
        className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-[#C4728A]/6 blur-3xl pointer-events-none"
      />

      {/* Scroll indicator — se desvanece al scrollear */}
      <motion.div
        style={{ opacity: scrollOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-20"
      >
        <div className="w-px h-10 bg-white/40" />
        <span className="text-white/40 text-[10px] tracking-widest uppercase">Scroll</span>
      </motion.div>
    </>
  );
}
