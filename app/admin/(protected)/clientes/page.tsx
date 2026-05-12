import { ClientesLista } from "@/components/admin/ClientesLista";

export default function ClientesPage() {
  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Clientes</h1>
      <ClientesLista />
    </div>
  );
}
