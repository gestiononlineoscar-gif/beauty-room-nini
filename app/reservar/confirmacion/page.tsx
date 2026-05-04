import Link from "next/link";

export default function ConfirmacionPage() {
  return (
    <div className="min-h-screen bg-[#fdf6f0] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4 animate-bounce">🌸</div>
        <h1 className="font-heading text-3xl text-[#1a1412] mb-2">¡Cita confirmada!</h1>
        <p className="text-[#6b6360] mb-8">
          Tu reserva ha sido registrada. Si nos facilitaste email, recibirás los detalles en tu bandeja de entrada.
        </p>
        <div className="bg-white rounded-2xl border border-[#e8c5ce] p-6 mb-8 text-left space-y-2">
          <p className="text-sm text-[#6b6360]">📍 Alcobendas, Madrid</p>
          <p className="text-sm text-[#6b6360]">🕐 Lun–Sáb 10:00–20:00</p>
          <p className="text-sm text-[#6b6360]">Para modificaciones, contáctanos directamente en el salón</p>
        </div>
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
