import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Servicio, Profesional } from "@/types";
import { CATEGORIAS_SERVICIOS } from "@/types";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { FadeIn } from "@/components/public/FadeIn";
import { AnimatedCounter } from "@/components/public/AnimatedCounter";
import { Particles } from "@/components/ui/particles";
import { Spotlight } from "@/components/ui/spotlight";
import { MagicCard } from "@/components/ui/magic-card";
import { TiltCard } from "@/components/ui/tilt-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { TracingBeam } from "@/components/public/TracingBeam";
import { FloralOrb3DLazy } from "@/components/public/FloralOrb3DLazy";
import { HeroParallaxBg } from "@/components/public/HeroParallaxBg";
import { ServiceCardFlip } from "@/components/public/ServiceCardFlip";

const MARQUEE_ITEMS = [
  "Manicura Semipermanente", "Pedicura Spa", "Depilación Láser",
  "Peluquería", "Lifting de Pestañas", "Masaje Relajante",
  "Extensiones de Uñas", "Estética Facial", "Bienestar Integral",
];

export default async function LandingPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: servicios }, { data: profesionales }] = await Promise.all([
    supabase.from("servicios").select("*").eq("activo", true).order("categoria"),
    supabase.from("profesionales").select("*").eq("activo", true).order("nombre"),
  ]);

  const profsPublicas = ((profesionales ?? []) as Profesional[]).filter((p) => p.nombre !== "Rosa");
  const cats = CATEGORIAS_SERVICIOS.filter((c) => (servicios ?? []).some((s: Servicio) => s.categoria === c));

  return (
    <div className="min-h-screen bg-[#fdf6f0] font-sans overflow-x-hidden">
      <Navbar />
      <TracingBeam />

      {/* ── HERO ── */}
      <section className="relative bg-[#1a1412] overflow-hidden min-h-screen flex items-center">
        <HeroParallaxBg />

        {/* Spotlight cursor-following rosa glow */}
        <Spotlight color="#C4728A" size={700} />

        {/* Floating particles */}
        <Particles quantity={35} color="#C4728A" ease={80} />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1412] via-[#1a1412]/85 to-[#1a1412]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1412]/70 via-transparent to-transparent" />

        {/* 3D glass orb — desktop only, lazy */}
        <FloralOrb3DLazy />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-16 md:pt-32 md:pb-24 w-full">
          <div className="max-w-2xl">
            <div className="animate-badge inline-flex items-center gap-2 bg-[#C4728A]/15 border border-[#C4728A]/30 text-[#e8a0b4] text-xs font-medium px-4 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4728A] animate-pulse" />
              Alcobendas, Madrid · Citas disponibles hoy
            </div>

            <h1 className="font-heading text-5xl md:text-7xl text-white leading-[1.05] mb-6">
              <span className="block animate-slide-up" style={{ animationDelay: "0.1s" }}>Tu belleza,</span>
              <span
                className="block animate-slide-up animate-gradient-x"
                style={{
                  animationDelay: "0.25s",
                  background: "linear-gradient(90deg, #e8a0b4, #C4728A, #f0b8c8, #C4728A)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                nuestra pasión
              </span>
            </h1>

            <p className="animate-slide-up text-white/60 text-lg md:text-xl leading-relaxed mb-10 max-w-xl" style={{ animationDelay: "0.4s" }}>
              Manicura, pedicura, depilación, peluquería y mucho más.
              Reserva online en segundos y ven cuando quieras.
            </p>

            <div className="animate-slide-up flex flex-wrap gap-4 items-center" style={{ animationDelay: "0.55s" }}>
              <Link
                href="/reservar"
                className="btn-shimmer inline-flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-2xl text-base"
              >
                Reservar cita ahora →
              </Link>
              <Link href="/servicios" className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-1 group">
                Ver todos los servicios
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="animate-slide-up flex flex-wrap gap-8 mt-12 pt-12 border-t border-white/10" style={{ animationDelay: "0.7s" }}>
              {[
                { value: 1500, suffix: "+", label: "Clientas satisfechas" },
                { value: 8, suffix: "", label: "Profesionales" },
                { value: 6, suffix: "+ años", label: "De experiencia" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-heading text-2xl text-[#C4728A]">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
                </div>
              ))}
              <div>
                <p className="font-heading text-2xl text-[#C4728A]">5.0★</p>
                <p className="text-xs text-white/40 mt-0.5">Valoración media</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── MARQUEE ── */}
      <div className="bg-[#C4728A] py-4 overflow-hidden flex">
        <div className="flex animate-marquee flex-shrink-0 whitespace-nowrap">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-6 text-white/90 text-sm font-medium tracking-wide">
              {item}
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
            </span>
          ))}
        </div>
        <div className="flex animate-marquee flex-shrink-0 whitespace-nowrap" aria-hidden>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-6 text-white/90 text-sm font-medium tracking-wide">
              {item}
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ── POR QUÉ ELEGIRNOS ── */}
      <section className="relative py-28 overflow-hidden">
        {/* Fondo rosa gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f7e8ed] via-[#fdf0f5] to-[#fdf6f0]" />
        {/* Blobs decorativos */}
        <div className="absolute -top-32 right-0 w-[600px] h-[600px] rounded-full bg-[#C4728A]/12 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-[#C4728A]/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6">
          <FadeIn className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-[#C4728A]/12 border border-[#C4728A]/25 text-[#C4728A] text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-5">
              <span className="w-1 h-1 rounded-full bg-[#C4728A]" />
              Por qué elegirnos
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-[#1a1412]">
              Una experiencia{" "}
              <span style={{ background: "linear-gradient(90deg, #C4728A, #a85a72)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                diferente
              </span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "✨", title: "Profesionales expertas", desc: "Cada miembro de nuestro equipo tiene años de formación y experiencia. Tu resultado está en las mejores manos.", num: "01" },
              { icon: "📅", title: "Reserva online fácil", desc: "Sin esperas, sin llamadas. Elige servicio, profesional y horario desde tu móvil en menos de un minuto.", num: "02" },
              { icon: "💆", title: "Tu tiempo, tu ritmo", desc: "Ambiente tranquilo y personalizado. Nos adaptamos a ti, no al revés. Siempre con cariño y atención plena.", num: "03" },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 120} direction="up">
                <MagicCard
                  gradientColor="#C4728A"
                  gradientOpacity={0.07}
                  className="card-rosa group cursor-default h-full text-center p-8 rounded-2xl bg-white border border-[#C4728A]/12"
                >
                  <span className="absolute top-4 right-5 font-heading text-8xl text-[#C4728A]/5 font-bold leading-none select-none pointer-events-none">
                    {item.num}
                  </span>
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C4728A] to-[#a85a72] flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#C4728A]/35">
                    {item.icon}
                  </div>
                  <h3 className="font-heading text-xl text-[#1a1412] mb-3 relative z-20">{item.title}</h3>
                  <p className="text-[#6b6360] text-sm leading-relaxed relative z-20">{item.desc}</p>
                  {/* BorderBeam appears on hover via CSS group */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <BorderBeam duration={10} borderWidth={1.5} />
                  </div>
                </MagicCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section className="py-28 bg-[#fdf6f0] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4728A]/30 to-transparent" />
        <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-[#C4728A]/5 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
            <div>
              <span className="inline-flex items-center gap-2 bg-[#C4728A]/10 border border-[#C4728A]/20 text-[#C4728A] text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-5 block w-fit">
                Lo que ofrecemos
              </span>
              <h2 className="font-heading text-4xl md:text-5xl text-[#1a1412]">Nuestros servicios</h2>
            </div>
            <Link href="/servicios" className="text-sm text-[#C4728A] hover:text-[#a85a72] transition-colors flex items-center gap-1 group font-medium flex-shrink-0">
              Ver catálogo completo
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
          </FadeIn>

          <ServiceCardFlip cats={cats} servicios={(servicios ?? []) as Servicio[]} />

          <FadeIn className="text-center">
            <Link
              href="/reservar"
              className="btn-shimmer inline-flex items-center gap-2 text-white font-semibold px-10 py-4 rounded-2xl"
            >
              Reservar cita →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── EQUIPO ── */}
      <section className="relative bg-[#1a1412] py-28 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C4728A]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#C4728A]/6 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, #C4728A 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6">
          <FadeIn className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-[#C4728A]/15 border border-[#C4728A]/25 text-[#e8a0b4] text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-5">
              Las profesionales
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-white">Nuestro equipo</h2>
            <p className="text-white/40 mt-4 max-w-md mx-auto">Apasionadas por la belleza, dedicadas a tu bienestar.</p>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {profsPublicas.map((p, i) => (
              <FadeIn key={p.id} delay={i * 80}>
                <TiltCard maxTilt={6} scale={1.03}>
                  <Link
                    href={`/reservar?profesional=${p.id}`}
                    className="group block text-center p-6 rounded-2xl border border-white/8 hover:border-[#C4728A]/50 bg-white/4 hover:bg-white/7 transition-all duration-300"
                  >
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div
                        className="w-full h-full rounded-full overflow-hidden shadow-lg group-hover:shadow-[0_0_0_3px_rgba(196,114,138,0.5)] transition-shadow duration-300"
                        style={{ backgroundColor: p.foto_url ? undefined : p.color }}
                      >
                        {p.foto_url ? (
                          <Image src={p.foto_url} alt={p.nombre} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{p.nombre[0]}</div>
                        )}
                      </div>
                      {/* Glow on hover */}
                      <div
                        className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-md"
                        style={{ background: `radial-gradient(circle, ${p.color}50, transparent 70%)` }}
                      />
                    </div>
                    <p className="font-semibold text-white text-sm group-hover:text-[#C4728A] transition-colors">{p.nombre}</p>
                    <p className="text-xs text-white/35 mt-0.5">{p.especialidad}</p>
                    <p className="text-xs text-[#C4728A] mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Reservar →</p>
                  </Link>
                </TiltCard>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-10">
            <Link href="/equipo" className="text-sm text-white/35 hover:text-[#C4728A] font-medium transition-colors inline-flex items-center gap-1 group">
              Conoce al equipo completo
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ROSA ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4728A] via-[#b8607c] to-[#a85a72]" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#1a1412]/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-20 flex flex-col md:flex-row items-center justify-between gap-10">
          <FadeIn direction="left">
            <p className="text-white/60 text-sm uppercase tracking-[0.2em] font-medium mb-3">¿Te has decidido?</p>
            <h2 className="font-heading text-4xl md:text-6xl text-white leading-tight">
              Tu cita en menos<br />de un minuto.
            </h2>
          </FadeIn>
          <FadeIn direction="right" className="flex flex-col items-center md:items-end gap-3 flex-shrink-0">
            <Link
              href="/reservar"
              className="inline-flex items-center gap-3 bg-white text-[#C4728A] font-bold px-10 py-5 rounded-2xl text-base shadow-2xl hover:scale-[1.04] transition-transform hover:shadow-white/20"
            >
              Reservar cita ahora →
            </Link>
            <p className="text-white/40 text-xs">Gratuito · Sin registro · Confirmación al instante</p>
          </FadeIn>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[#1a1412]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #C4728A 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full bg-[#C4728A]/8 blur-[100px] animate-float-slow pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#C4728A]/6 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6">
          <FadeIn className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-[#C4728A]/15 border border-[#C4728A]/25 text-[#e8a0b4] text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-5">
              Opiniones reales
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-white">Lo que dicen de nosotras</h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { nombre: "María G.", texto: "El mejor sitio donde me he hecho las uñas. El trato es súper cercano y el resultado impecable. Repito seguro.", nota: "Manicura semipermanente" },
              { nombre: "Laura P.", texto: "Vine por primera vez a hacerme la depilación y me quedé enamorada. Profesional, rápida y sin dolor. 100% recomendable.", nota: "Depilación" },
              { nombre: "Ana R.", texto: "Fui con mi hija a hacernos la pedicura y fue una experiencia preciosa. Local muy cuidado y equipo encantador.", nota: "Pedicura completa" },
              { nombre: "Carmen S.", texto: "Llevo años viniendo y nunca me han fallado. La calidad del trabajo y la atención son siempre de 10. Mi sitio de confianza.", nota: "Clienta habitual" },
              { nombre: "Sofía M.", texto: "Me hice el tinte y el corte y quedé encantada. Jenny sabe exactamente lo que quieres aunque no sepas explicarlo bien.", nota: "Peluquería" },
              { nombre: "Elena V.", texto: "El ambiente es precioso y muy relajante. Me hice el masaje y salí nueva. Ya tengo la próxima cita reservada.", nota: "Masaje relajante" },
            ].map((t, i) => (
              <FadeIn key={t.nombre} delay={i * 80}>
                <div className="group flex flex-col bg-white/[0.06] backdrop-blur-md rounded-2xl border border-white/[0.12] hover:border-[#C4728A]/55 hover:bg-white/[0.1] p-7 h-full transition-all duration-300 cursor-default shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <span key={j} className="text-[#C4728A] text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-6 flex-1">"{t.texto}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C4728A] to-[#a85a72] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {t.nombre[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.nombre}</p>
                      <p className="text-[#C4728A] text-xs mt-0.5">{t.nota}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO ── */}
      <section id="contacto" className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#fdf6f0] to-[#fae8ef]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4728A]/30 to-transparent" />
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-[#C4728A]/8 blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6">
          <FadeIn className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-[#C4728A]/10 border border-[#C4728A]/20 text-[#C4728A] text-xs font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-5">
              Encuéntranos
            </span>
            <h2 className="font-heading text-4xl md:text-5xl text-[#1a1412]">Contacto</h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <FadeIn direction="left" className="space-y-4">
              {[
                { icon: "📍", titulo: "Dirección", lineas: ["C. de la Constitución, 53", "28100 Alcobendas, Madrid"], href: "https://www.google.com/maps/search/?api=1&query=C.+de+la+Constitución,+53,+28100+Alcobendas,+Madrid" },
                { icon: "📞", titulo: "Teléfono", lineas: ["+34 604 85 02 49"], href: "tel:+34604850249" },
                { icon: "🕐", titulo: "Horario", lineas: ["Lunes – Sábado: 10:00 – 20:00", "Domingo: Cerrado"] },
                { icon: "📷", titulo: "Instagram", lineas: ["@beautyroom.nini"], href: "https://instagram.com/beautyroom.nini" },
              ].map((item) => (
                <div key={item.titulo} className="card-rosa flex gap-4 items-start bg-white rounded-2xl border border-[#C4728A]/12 p-5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C4728A]/15 to-[#C4728A]/5 border border-[#C4728A]/20 flex items-center justify-center text-xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1412] text-sm mb-1">{item.titulo}</p>
                    {item.lineas.map((l) =>
                      item.href ? (
                        <a key={l} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="block text-sm text-[#6b6360] hover:text-[#C4728A] transition-colors">
                          {l}
                        </a>
                      ) : (
                        <p key={l} className="text-sm text-[#6b6360]">{l}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </FadeIn>

            <FadeIn direction="right">
              <div className="relative rounded-2xl p-10 text-center overflow-hidden" style={{ background: "linear-gradient(135deg, #C4728A 0%, #a85a72 100%)" }}>
                <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/8 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-3xl mx-auto mb-6 animate-float">
                    📅
                  </div>
                  <h3 className="font-heading text-3xl text-white mb-3">¿Lista para tu cita?</h3>
                  <p className="text-white/70 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                    Reserva online en segundos, sin necesidad de cuenta ni llamadas.
                  </p>
                  <Link
                    href="/reservar"
                    className="inline-flex items-center gap-2 bg-white text-[#C4728A] font-bold px-8 py-4 rounded-2xl text-base shadow-2xl hover:scale-[1.03] transition-transform"
                  >
                    Reservar cita ahora →
                  </Link>
                  <p className="text-white/40 text-xs mt-4">Gratuito · Sin registro · Confirmación instantánea</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <Footer />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#e8c5ce] flex justify-around py-3 z-50 shadow-lg">
        {[
          { href: "/", label: "Inicio" },
          { href: "/reservar", label: "Reservar" },
          { href: "/equipo", label: "Equipo" },
          { href: "/servicios", label: "Servicios" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="text-xs text-[#6b6360] flex flex-col items-center gap-1 hover:text-[#C4728A] transition-colors">
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
