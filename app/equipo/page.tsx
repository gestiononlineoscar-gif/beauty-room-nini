import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Profesional } from "@/types";
import { Navbar } from "@/components/public/Navbar";

export const revalidate = 3600;
import { Footer } from "@/components/public/Footer";

export default async function EquipoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: profesionalesRaw } = await supabase
    .from("profesionales")
    .select("*")
    .eq("activo", true)
    .eq("visible_publico", true)
    .order("nombre");

  const profesionales = (profesionalesRaw ?? []) as Profesional[];

  return (
    <div className="min-h-screen bg-[#fdf6f0] font-sans pb-20 md:pb-0">
      <Navbar />

      {/* Header */}
      <section className="bg-[#1a1412] pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-[#C4728A] text-sm font-semibold uppercase tracking-widest mb-3">Las profesionales</p>
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">Nuestro equipo</h1>
          <p className="text-white/60 text-lg max-w-xl">
            {profesionales.length} profesionales apasionadas por la belleza y el bienestar.
            Cada una especialista en su área.
          </p>
        </div>
      </section>

      {/* Equipo */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profesionales.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-[#e8c5ce] p-7 text-center hover:shadow-xl hover:border-[#C4728A]/30 transition-all group"
            >
              {/* Avatar con foto si existe */}
              <div className="relative inline-block mb-5">
                <div
                  className="w-24 h-24 rounded-full mx-auto overflow-hidden relative flex items-center justify-center text-white text-4xl font-bold shadow-xl group-hover:scale-105 transition-transform"
                  style={p.foto_url ? {} : { backgroundColor: p.color }}
                >
                  {p.foto_url ? (
                    <Image src={p.foto_url} alt={p.nombre} fill className="object-cover" />
                  ) : (
                    p.nombre[0]
                  )}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs"
                  style={{ backgroundColor: p.color }}
                >
                  ✓
                </div>
              </div>

              <h2 className="font-heading text-xl text-[#1a1412] mb-1 group-hover:text-[#C4728A] transition-colors">
                {p.nombre}
              </h2>
              <p className="text-sm text-[#6b6360] mb-4">{p.especialidad}</p>

              {/* Estrellas */}
              <div className="flex justify-center gap-0.5 mb-5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
                <span className="text-xs text-[#6b6360] ml-1.5 mt-0.5">5.0</span>
              </div>

              <Link
                href={`/reservar?profesional=${p.id}`}
                className="block w-full bg-[#fdf6f0] hover:bg-[#C4728A] hover:text-white text-[#C4728A] font-medium py-3 rounded-xl text-sm transition-all border border-[#e8c5ce] hover:border-[#C4728A]"
              >
                Reservar con {p.nombre.split(" ")[0]}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Sección valores */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: "🎓", titulo: "Formación continua", desc: "Nuestro equipo se forma constantemente en las últimas técnicas y tendencias." },
              { icon: "💛", titulo: "Trato cercano", desc: "No somos solo un salón, somos tu equipo. Te recordamos, te escuchamos." },
              { icon: "🌿", titulo: "Productos premium", desc: "Solo trabajamos con marcas de calidad que cuidan tu piel, uñas y cabello." },
            ].map((v) => (
              <div key={v.titulo} className="p-6">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-heading text-xl text-[#1a1412] mb-2">{v.titulo}</h3>
                <p className="text-sm text-[#6b6360] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="bg-[#1a1412] rounded-2xl p-10 text-center">
          <h3 className="font-heading text-3xl text-white mb-2">Elige tu profesional favorita</h3>
          <p className="text-white/60 text-sm mb-8">
            O déjanos escoger por ti según disponibilidad. El resultado siempre será increíble.
          </p>
          <Link
            href="/reservar"
            className="inline-flex items-center gap-2 bg-[#C4728A] hover:bg-[#a85a72] text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-[#C4728A]/20"
          >
            Reservar cita →
          </Link>
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
