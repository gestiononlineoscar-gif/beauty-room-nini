"use client";

import dynamic from "next/dynamic";

const FloralOrb3D = dynamic(
  () => import("@/components/public/FloralOrb3D").then((m) => ({ default: m.FloralOrb3D })),
  { ssr: false, loading: () => null }
);

export function FloralOrb3DLazy() {
  return <FloralOrb3D />;
}
