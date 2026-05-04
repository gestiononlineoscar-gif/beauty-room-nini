import { createServerSupabaseClient } from "@/lib/supabase-server";
import { MetricasDashboard } from "@/components/admin/MetricasDashboard";
import type { Reserva, Profesional } from "@/types";
import { startOfMonth, endOfMonth, format, subWeeks, startOfWeek } from "date-fns";

export default async function MetricasPage() {
  const supabase = await createServerSupabaseClient();
  const hoy = new Date();
  const hace8semanas = startOfWeek(subWeeks(hoy, 7), { weekStartsOn: 1 });

  const [{ data: profesionales }, { data: reservasMes }, { data: reservasHoy }, { data: reservas8semanas }] =
    await Promise.all([
      supabase.from("profesionales").select("*").eq("activo", true),
      supabase.from("reservas")
        .select("*, servicios(*), profesionales(*)")
        .gte("fecha", format(startOfMonth(hoy), "yyyy-MM-dd"))
        .lte("fecha", format(endOfMonth(hoy), "yyyy-MM-dd")),
      supabase.from("reservas")
        .select("*, servicios(*)")
        .eq("fecha", format(hoy, "yyyy-MM-dd")),
      supabase.from("reservas")
        .select("fecha, estado, servicios(precio)")
        .gte("fecha", format(hace8semanas, "yyyy-MM-dd"))
        .lte("fecha", format(hoy, "yyyy-MM-dd")),
    ]);

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Métricas</h1>
      <MetricasDashboard
        profesionales={(profesionales ?? []) as Profesional[]}
        reservasMes={(reservasMes ?? []) as Reserva[]}
        reservasHoy={(reservasHoy ?? []) as Reserva[]}
        reservas8semanas={(reservas8semanas ?? []) as unknown as Reserva[]}
      />
    </div>
  );
}
