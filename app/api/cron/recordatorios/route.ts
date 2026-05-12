import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { enviarRecordatorio } from "@/lib/emails";
import { addDays } from "date-fns";
import { format } from "date-fns";

export async function GET() {
  const manana = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const supabase = await createServerSupabaseClient();

  const { data: reservas, error } = await supabase
    .from("reservas")
    .select("*, clientes(*), profesionales(*), servicios(*)")
    .eq("fecha", manana)
    .in("estado", ["pendiente", "confirmada"]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!reservas?.length) return NextResponse.json({ ok: true, enviados: 0 });

  let enviados = 0;
  const errores: string[] = [];

  for (const r of reservas) {
    const email = r.clientes?.email;
    if (!email) continue;
    try {
      await enviarRecordatorio({
        clienteEmail: email,
        clienteNombre: r.clientes?.nombre ?? "clienta",
        servicio: r.servicios?.nombre ?? "tu servicio",
        profesional: r.profesionales?.nombre ?? "",
        fecha: r.fecha,
        horaInicio: r.hora_inicio.slice(0, 5),
        duracionMin: r.servicios?.duracion_min ?? 0,
      });
      enviados++;
    } catch (e: unknown) {
      errores.push(`${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, enviados, errores });
}
