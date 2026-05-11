import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { enviarReporteDiario } from "@/lib/emails";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const hoy = new Date().toISOString().split("T")[0];

  const { data: reservas } = await supabase
    .from("reservas")
    .select("*, clientes(*), profesionales(*), servicios(*)")
    .eq("fecha", hoy)
    .neq("estado", "cancelada")
    .order("hora_inicio");

  if (!reservas) {
    return NextResponse.json({ ok: true, mensaje: "Sin reservas hoy" });
  }

  const totalIngresos = reservas.reduce((sum, r) => sum + Number(r.servicios?.precio ?? 0), 0);

  await enviarReporteDiario({
    fecha: hoy,
    reservas: reservas.map((r) => ({
      hora: r.hora_inicio?.slice(0, 5) ?? "",
      cliente: r.clientes?.nombre ?? "Sin nombre",
      servicio: r.servicios?.nombre ?? "",
      profesional: r.profesionales?.nombre ?? "",
      precio: Number(r.servicios?.precio ?? 0),
    })),
    totalIngresos,
  });

  return NextResponse.json({ ok: true, reservas: reservas.length, total: totalIngresos });
}
