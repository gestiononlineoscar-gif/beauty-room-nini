import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarReporteDiario } from "@/lib/emails";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function verificarCron(req: NextRequest) {
  if (process.env.NODE_ENV !== "production") return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!verificarCron(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Fecha de hoy en zona horaria de Madrid
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
  const to = req.nextUrl.searchParams.get("to") ?? undefined;

  const { data: reservas } = await adminClient()
    .from("reservas")
    .select("*, clientes(*), profesionales(*), servicios(*)")
    .eq("fecha", hoy)
    .neq("estado", "cancelada")
    .order("hora_inicio");

  if (!reservas?.length) {
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
    to,
  });

  return NextResponse.json({ ok: true, reservas: reservas.length, total: totalIngresos });
}
