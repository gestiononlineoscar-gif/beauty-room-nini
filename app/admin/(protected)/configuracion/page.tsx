import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import type { Usuario } from "@/types";

export default async function ConfiguracionPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: usuario } = await supabase
    .from("usuarios").select("*").eq("id", user.id).single<Usuario>();

  if (usuario?.rol !== "propietaria") redirect("/admin/agenda");

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("*, profesionales(nombre)")
    .order("nombre");

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-2xl">
      <h1 className="font-heading text-2xl text-[#1a1412] mb-6">Configuración</h1>

      {/* Usuarios del sistema */}
      <section className="mb-8">
        <h2 className="font-semibold text-[#1a1412] mb-4">Usuarios del panel</h2>
        <div className="bg-white rounded-2xl border border-[#e8c5ce] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7e8ed] text-[#1a1412]">
                <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold">Rol</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(usuarios ?? []).map((u: any) => (
                <tr key={u.id} className="border-t border-[#f4f1ef]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1a1412]">{u.nombre}</p>
                    {u.profesionales && (
                      <p className="text-xs text-[#6b6360]">{u.profesionales.nombre}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      u.rol === "propietaria"
                        ? "bg-[#f7e8ed] text-[#C4728A]"
                        : "bg-[#f4f1ef] text-[#6b6360]"
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? "text-[#4a9b6f]" : "text-red-500"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#6b6360] mt-2">
          Para añadir usuarios, crea la cuenta en Supabase Auth y luego inserta la fila en la tabla <code>usuarios</code>.
        </p>
      </section>

      {/* Info del sistema */}
      <section>
        <h2 className="font-semibold text-[#1a1412] mb-4">Sistema</h2>
        <div className="bg-white rounded-2xl border border-[#e8c5ce] p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6b6360]">Versión</span>
            <span className="text-[#1a1412] font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between border-t border-[#f4f1ef] pt-3">
            <span className="text-[#6b6360]">Stack</span>
            <span className="text-[#1a1412] font-medium">Next.js 16 + Supabase</span>
          </div>
          <div className="flex justify-between border-t border-[#f4f1ef] pt-3">
            <span className="text-[#6b6360]">Salón</span>
            <span className="text-[#1a1412] font-medium">Beauty Room Nini · Alcobendas</span>
          </div>
        </div>
      </section>
    </div>
  );
}
