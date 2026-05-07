import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ReservaFlujo } from "@/components/public/ReservaFlujo";
import type { Servicio, Profesional, ProfesionalServicio } from "@/types";

interface Props {
  searchParams: Promise<{ servicio?: string; profesional?: string }>;
}

export default async function ReservarPage({ searchParams }: Props) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;

  const [{ data: servicios }, { data: profesionales }, { data: profesionalServicios }] = await Promise.all([
    supabase.from("servicios").select("*").eq("activo", true).order("categoria"),
    supabase.from("profesionales").select("*").eq("activo", true).eq("visible_publico", true).order("nombre"),
    supabase.from("profesional_servicio").select("profesional_id, servicio_id"),
  ]);

  return (
    <div className="min-h-screen bg-[#fdf6f0] pb-20 md:pb-0">
      <header className="bg-[#1a1412] text-white py-3 px-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-heading text-[#C4728A] text-base">💅 beauty room nini</Link>
          <span className="text-[#6b6360] text-xs">Alcobendas · Madrid</span>
        </div>
      </header>
      <ReservaFlujo
        servicios={(servicios ?? []) as Servicio[]}
        profesionales={(profesionales ?? []) as Profesional[]}
        profesionalServicios={(profesionalServicios ?? []) as ProfesionalServicio[]}
        servicioIdInicial={params.servicio}
        profesionalIdInicial={params.profesional}
      />
    </div>
  );
}
