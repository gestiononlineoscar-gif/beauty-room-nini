"use client";

import Image from "next/image";
import Link from "next/link";
import { ICONOS_CATEGORIA } from "@/types";
import type { Servicio } from "@/types";
import { FadeIn } from "@/components/public/FadeIn";

const IMAGEN_CATEGORIA: Record<string, string> = {
  Manicura:             "/servicios/manicura.jpg",
  Pedicura:             "/servicios/pedicura.jpg",
  "Depilación Hilo":    "/servicios/depilacion-hilo.jpg",
  "Depilación Pinza":   "/servicios/depilacion-pinza.jpg",
  "Depilación Cera":    "/servicios/depilacion-cera.jpg",
  Peluquería:           "/servicios/peluqueria.jpg",
  Estética:             "/servicios/estetica.jpg",
  Pestañas:             "/servicios/pestanas.jpg",
  "Bienestar y Salud":  "/servicios/bienestar.jpg",
};

interface Props {
  cats: string[];
  servicios: Servicio[];
}

export function ServiceCardFlip({ cats, servicios }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
      {cats.map((cat, i) => {
        const items = servicios.filter((s) => s.categoria === cat);
        const desdePrice = Math.min(...items.map((s) => Number(s.precio)));
        return (
          <FadeIn key={cat} delay={i * 80}>
            <Link href={`/servicios#${cat.toLowerCase()}`} className="flip-card aspect-[4/3] block">
              <div className="flip-card-inner">

                {/* ── Cara delantera ── */}
                <div className="flip-card-front relative overflow-hidden rounded-2xl border border-[#C4728A]/15 shadow-[0_4px_20px_rgba(196,114,138,0.1)]">
                  <Image
                    src={
                      IMAGEN_CATEGORIA[cat] ??
                      (cat.startsWith("Depilación") ? "/servicios/depilacion.jpg" :
                       cat === "Pestañas" ? "/servicios/estetica.jpg" :
                       "/hero.png")
                    }
                    alt={cat}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1412]/90 via-[#1a1412]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <span className="text-2xl mb-1 block">{ICONOS_CATEGORIA[cat]}</span>
                    <h3 className="font-heading text-white text-lg leading-tight">{cat}</h3>
                    <p className="text-white/55 text-xs mt-0.5">desde {desdePrice.toFixed(0)} €</p>
                  </div>
                  {/* Corner hint */}
                  <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center opacity-60">
                    <div className="w-1 h-1 rounded-full bg-white" />
                    <div className="w-1 h-1 rounded-full bg-white mx-0.5" />
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                </div>

                {/* ── Cara trasera ── */}
                <div
                  className="flip-card-back relative overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-center"
                  style={{ background: "linear-gradient(135deg, #C4728A 0%, #a85a72 100%)" }}
                >
                  {/* Dot pattern overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "18px 18px" }}
                  />
                  {/* Top glow */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-white/15 blur-3xl pointer-events-none" />

                  <span className="text-4xl relative z-10">{ICONOS_CATEGORIA[cat]}</span>

                  <div className="relative z-10">
                    <h3 className="font-heading text-white text-xl mb-1">{cat}</h3>
                    <p className="text-white/75 text-xs">{items.length} servicios disponibles</p>
                    <p className="text-white font-bold text-3xl mt-2 font-heading">{desdePrice.toFixed(0)} €</p>
                    <p className="text-white/55 text-[10px] uppercase tracking-widest">desde</p>
                  </div>

                  <span className="relative z-10 inline-flex items-center gap-2 bg-white text-[#C4728A] font-bold px-5 py-2.5 rounded-xl text-sm shadow-xl mt-1">
                    Ver servicios →
                  </span>
                </div>

              </div>
            </Link>
          </FadeIn>
        );
      })}
    </div>
  );
}
