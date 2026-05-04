import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ServiciosCRUD } from "@/components/admin/ServiciosCRUD";
import type { Servicio } from "@/types";

export default async function ServiciosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: servicios } = await supabase
    .from("servicios")
    .select("*")
    .order("categoria")
    .order("nombre");

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Servicios</h1>
      <ServiciosCRUD serviciosIniciales={(servicios ?? []) as Servicio[]} />
    </div>
  );
}
