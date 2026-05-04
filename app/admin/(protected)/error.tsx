"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full min-h-[400px] p-4">
      <div className="text-center max-w-sm">
        <p className="text-3xl mb-3">⚠️</p>
        <h2 className="font-heading text-xl text-[#1a1412] mb-2">Algo salió mal</h2>
        <p className="text-sm text-[#6b6360] mb-5">{error.message}</p>
        <button
          onClick={unstable_retry}
          className="bg-[#C4728A] hover:bg-[#a85a72] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
