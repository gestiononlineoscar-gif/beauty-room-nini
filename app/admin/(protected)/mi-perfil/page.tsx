import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { CambiarPasswordForm } from "@/components/admin/CambiarPasswordForm";
import type { Usuario } from "@/types";

export default async function MiPerfilPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*, profesionales(*)")
    .eq("id", user.id)
    .single<Usuario & { profesionales: { nombre: string; color: string; especialidad: string | null } | null }>();

  const ROL_LABEL: Record<string, string> = {
    propietaria: "Propietaria — acceso completo",
    empleada: "Empleada — acceso limitado",
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6 max-w-md space-y-5">
      <h1 className="font-heading text-2xl text-[#1a1412]">Mi Perfil</h1>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-[#e8c5ce] p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: usuario?.profesionales?.color ?? "#C4728A" }}
          >
            {usuario?.nombre?.[0] ?? "?"}
          </div>
          <div>
            <p className="font-semibold text-[#1a1412] text-lg">{usuario?.nombre}</p>
            <p className="text-sm text-[#6b6360]">{usuario?.profesionales?.especialidad ?? ""}</p>
          </div>
        </div>
        <div className="border-t border-[#f4f1ef] pt-4 space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-[#6b6360]">Email</span>
            <span className="text-[#1a1412] text-right">{user.email}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-[#6b6360]">Rol</span>
            <span className="text-[#1a1412] text-right text-xs">{ROL_LABEL[usuario?.rol ?? ""] ?? usuario?.rol}</span>
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <CambiarPasswordForm />
    </div>
  );
}
