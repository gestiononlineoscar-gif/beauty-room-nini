import { NextRequest, NextResponse } from "next/server";
import { enviarConfirmacionReserva } from "@/lib/emails";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const datos = await req.json();

    // Validar campos mínimos
    if (!datos.clienteEmail || !datos.fecha || !datos.horaInicio) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Verificar que existe una reserva real con ese email/fecha/hora (creada en los últimos 2 minutos)
    const supabase = await createServerSupabaseClient();
    const hace2min = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: reserva } = await supabase
      .from("reservas")
      .select("id, gestion_token")
      .eq("fecha", datos.fecha)
      .eq("hora_inicio", datos.horaInicio + ":00")
      .gte("created_at", hace2min)
      .maybeSingle();

    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 403 });
    }

    const gestionUrl = reserva.gestion_token
      ? `https://beautyroomnini.es/reserva/${reserva.gestion_token}`
      : undefined;

    const icalUrl = reserva.gestion_token
      ? `https://beautyroomnini.es/api/ical/${reserva.gestion_token}`
      : undefined;

    await enviarConfirmacionReserva({ ...datos, gestionUrl, icalUrl });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error enviando email:", error);
    return NextResponse.json({ error: "Error al enviar email" }, { status: 500 });
  }
}
