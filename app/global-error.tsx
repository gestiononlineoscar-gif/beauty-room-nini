"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#fdf6f0] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">💅</p>
          <h1 className="font-serif text-2xl text-[#1a1412] mb-2">Algo salió mal</h1>
          <p className="text-[#6b6360] mb-6">Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.</p>
          <button
            onClick={unstable_retry}
            className="bg-[#C4728A] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#a85a72] transition-colors"
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
