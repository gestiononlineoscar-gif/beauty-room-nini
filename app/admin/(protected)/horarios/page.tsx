import { createServerSupabaseClient } from "@/lib/supabase-server";
import { HorariosGestion } from "@/components/admin/HorariosGestion";
import { DiasFestivos } from "@/components/admin/DiasFestivos";
import type { HorarioLocal } from "@/types";

export default async function HorariosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: horarios } = await supabase
    .from("horario_local")
    .select("*")
    .order("dia_semana");

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-xl">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Horarios</h1>
      <HorariosGestion horariosIniciales={(horarios ?? []) as HorarioLocal[]} />
      <DiasFestivos />
    </div>
  );
}
