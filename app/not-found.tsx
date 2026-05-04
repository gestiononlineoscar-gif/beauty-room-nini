import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fdf6f0] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">💅</div>
        <h1 className="font-heading text-4xl text-[#1a1412] mb-2">404</h1>
        <p className="text-[#6b6360] mb-8">Esta página no existe o ha sido movida.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#C4728A] hover:bg-[#a85a72] text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
