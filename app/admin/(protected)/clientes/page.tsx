import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ClientesLista } from "@/components/admin/ClientesLista";
import type { Cliente, Reserva } from "@/types";

export default async function ClientesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre");

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Clientes</h1>
      <ClientesLista clientes={(clientes ?? []) as Cliente[]} />
    </div>
  );
}
