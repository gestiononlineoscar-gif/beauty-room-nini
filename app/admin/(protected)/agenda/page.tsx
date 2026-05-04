import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AgendaCalendario } from "@/components/admin/AgendaCalendario";
import type { Profesional, Reserva, Usuario, BloqueoHorario } from "@/types";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { es } from "date-fns/locale";

export default async function AgendaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single<Usuario>();

  if (!usuario) redirect("/admin/login");

  const hoy = new Date();
  const desde = format(startOfWeek(hoy, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const hasta = format(endOfWeek(hoy, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [{ data: profesionales }, { data: reservas }, { data: bloqueos }] = await Promise.all([
    supabase.from("profesionales").select("*").eq("activo", true).order("nombre"),
    supabase.from("reservas")
      .select("*, clientes(*), profesionales(*), servicios(*)")
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase.from("bloqueos_horario")
      .select("*")
      .gte("fecha", desde)
      .lte("fecha", hasta),
  ]);

  const fechaLegible = format(hoy, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="h-screen flex flex-col pb-16 md:pb-0">
      <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-[#e8c5ce] flex-shrink-0">
        <h1 className="font-heading text-xl md:text-2xl text-[#1a1412]">Agenda</h1>
        <p className="text-sm text-[#6b6360] capitalize hidden sm:block">{fechaLegible}</p>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        <AgendaCalendario
          profesionales={(profesionales ?? []) as Profesional[]}
          reservasIniciales={(reservas ?? []) as Reserva[]}
          bloqueosIniciales={(bloqueos ?? []) as BloqueoHorario[]}
          usuario={usuario}
        />
      </div>
    </div>
  );
}
