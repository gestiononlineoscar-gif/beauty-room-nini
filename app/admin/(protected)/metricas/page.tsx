import { createServerSupabaseClient } from "@/lib/supabase-server";
import { MetricasDashboard } from "@/components/admin/MetricasDashboard";
import type { Profesional } from "@/types";

export default async function MetricasPage() {
  const supabase = await createServerSupabaseClient();
  const { data: profesionales } = await supabase
    .from("profesionales")
    .select("*")
    .eq("activo", true);

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Métricas</h1>
      <MetricasDashboard profesionales={(profesionales ?? []) as Profesional[]} />
    </div>
  );
}
