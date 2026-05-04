import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ReservasLista } from "@/components/admin/ReservasLista";
import type { Reserva, Profesional } from "@/types";

export default async function ReservasPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: reservas }, { data: profesionales }] = await Promise.all([
    supabase
      .from("reservas")
      .select("*, clientes(*), profesionales(*), servicios(*)")
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false })
      .limit(100),
    supabase.from("profesionales").select("*").eq("activo", true).order("nombre"),
  ]);

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Reservas</h1>
      <ReservasLista
        reservasIniciales={(reservas ?? []) as Reserva[]}
        profesionales={(profesionales ?? []) as Profesional[]}
      />
    </div>
  );
}
