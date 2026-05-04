import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ProfesionalesPageClient } from "@/components/admin/ProfesionalesPageClient";
import type { Profesional, Servicio } from "@/types";

export default async function ProfesionalesPage() {
  const supabase = await createServerSupabaseClient();
  const [{ data: profesionales }, { data: servicios }] = await Promise.all([
    supabase.from("profesionales").select("*").order("nombre"),
    supabase.from("servicios").select("*").eq("activo", true).order("categoria"),
  ]);

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Profesionales</h1>
      <ProfesionalesPageClient
        profesionales={(profesionales ?? []) as Profesional[]}
        servicios={(servicios ?? []) as Servicio[]}
      />
    </div>
  );
}
