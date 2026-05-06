import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Servicio } from "@/types";
import { CATEGORIAS_SERVICIOS, ICONOS_CATEGORIA } from "@/types";
import { Navbar } from "@/components/public/Navbar";

export const revalidate = 3600;
import { Footer } from "@/components/public/Footer";

export default async function ServiciosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: servicios } = await supabase
    .from("servicios")
    .select("*")
    .eq("activo", true)
    .order("categoria")
    .order("nombre");

  const categorias = CATEGORIAS_SERVICIOS.filter((c) =>
    (servicios ?? []).some((s: Servicio) => s.categoria === c)
  );

  return (
    <div className="min-h-screen bg-[#fdf6f0] font-sans pb-20 md:pb-0">
      <Navbar />

      {/* Header */}
      <section className="bg-[#1a1412] pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-[#C4728A] text-sm font-semibold uppercase tracking-widest mb-3">Catálogo completo</p>
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">Nuestros servicios</h1>
          <p className="text-white/60 text-lg max-w-xl">
            Más de 80 tratamientos de belleza y bienestar. Encuentra el tuyo y reserva online en segundos.
          </p>
        </div>
      </section>

      {/* Categorías anclas */}
      <div className="sticky top-16 z-40 bg-white border-b border-[#e8c5ce] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {categorias.map((cat) => (
              <a
                key={cat}
                href={`#${cat.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm text-[#6b6360] hover:text-[#C4728A] hover:bg-[#fdf6f0] px-4 py-2 rounded-xl transition-all"
              >
                <span>{ICONOS_CATEGORIA[cat]}</span>
                {cat}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-16">
        {categorias.map((cat) => {
          const items = (servicios as Servicio[]).filter((s) => s.categoria === cat);
          const desde = Math.min(...items.map((s) => Number(s.precio)));
          const hasta = Math.max(...items.map((s) => Number(s.precio)));

          return (
            <section key={cat} id={cat.toLowerCase().replace(/\s+/g, "-")}>
              {/* Cabecera categoría */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1412] flex items-center justify-center text-2xl flex-shrink-0">
                    {ICONOS_CATEGORIA[cat]}
                  </div>
                  <div>
                    <h2 className="font-heading text-2xl text-[#1a1412]">{cat}</h2>
                    <p className="text-xs text-[#6b6360]">
                      {items.length} tratamiento{items.length !== 1 ? "s" : ""} · desde {desde.toFixed(0)} € hasta {hasta.toFixed(0)} €
                    </p>
                  </div>
                </div>
                <Link
                  href={`/reservar`}
                  className="flex-shrink-0 text-xs text-[#C4728A] border border-[#C4728A]/40 hover:bg-[#C4728A] hover:text-white px-4 py-2 rounded-xl transition-all"
                >
                  Reservar {cat.toLowerCase()} →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-[#e8c5ce] p-5 flex flex-col justify-between hover:border-[#C4728A]/50 hover:shadow-md transition-all group"
                  >
                    <div className="mb-4">
                      <p className="font-medium text-[#1a1412] group-hover:text-[#C4728A] transition-colors mb-1">
                        {s.nombre}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#6b6360]">
                        <span className="flex items-center gap-1">
                          🕐 {s.duracion_min} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#C4728A] text-xl">
                        {s.precio_desde ? `desde ${Number(s.precio).toFixed(0)} €` : `${Number(s.precio).toFixed(2)} €`}
                      </p>
                      <Link
                        href={`/reservar?servicio=${s.id}`}
                        className="text-xs bg-[#fdf6f0] hover:bg-[#C4728A] hover:text-white text-[#C4728A] font-medium px-4 py-2 rounded-xl transition-all border border-[#e8c5ce] hover:border-[#C4728A]"
                      >
                        Reservar
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA final */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="bg-[#1a1412] rounded-2xl p-10 text-center">
          <h3 className="font-heading text-3xl text-white mb-2">¿No encuentras lo que buscas?</h3>
          <p className="text-white/60 text-sm mb-8">Llámanos o escríbenos y te asesoramos sin compromiso.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/reservar"
              className="inline-flex items-center gap-2 bg-[#C4728A] hover:bg-[#a85a72] text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-[#C4728A]/20"
            >
              Reservar cita →
            </Link>
            <a
              href="tel:+34600000000"
              className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white px-8 py-4 rounded-2xl transition-all text-sm"
            >
              📞 Llamar ahora
            </a>
          </div>
        </div>
      </div>

      <Footer />

      {/* Bottom nav móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8c5ce] flex justify-around py-3 z-50">
        {[
          { href: "/", label: "Inicio" },
          { href: "/reservar", label: "Reservar" },
          { href: "/equipo", label: "Equipo" },
          { href: "/servicios", label: "Servicios" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="text-xs text-[#6b6360] flex flex-col items-center gap-1">
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
