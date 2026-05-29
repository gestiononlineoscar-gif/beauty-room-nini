import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const { data: reserva } = await adminClient()
    .from("reservas")
    .select("id, fecha, hora_inicio, hora_fin, servicios(nombre), profesionales(nombre)")
    .eq("gestion_token", token)
    .single();

  if (!reserva) {
    return new NextResponse("No encontrada", { status: 404 });
  }

  const fechaCompacta = (reserva.fecha as string).replace(/-/g, "");
  const horaIni = (reserva.hora_inicio as string).replace(/:/g, "").substring(0, 6);
  const horaFin = (reserva.hora_fin as string).replace(/:/g, "").substring(0, 6);
  const dtStart = `${fechaCompacta}T${horaIni}`;
  const dtEnd   = `${fechaCompacta}T${horaFin}`;
  const dtstamp = new Date().toISOString().replace(/[-:.]/g, "").replace("000Z", "Z");

  const servicio    = (reserva.servicios as { nombre: string } | null)?.nombre ?? "Cita";
  const profesional = (reserva.profesionales as { nombre: string } | null)?.nombre ?? "";
  const gestionUrl  = `https://beautyroomnini.es/reserva/${token}`;

  const descripcion = [
    `Servicio: ${servicio}`,
    profesional ? `Profesional: ${profesional}` : null,
    `Gestionar cita: ${gestionUrl}`,
  ].filter(Boolean).join("\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Beauty Room Nini//beautyroomnini.es//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:reserva-${reserva.id}@beautyroomnini.es`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Madrid:${dtStart}`,
    `DTEND;TZID=Europe/Madrid:${dtEnd}`,
    "SUMMARY:Cita Beauty Room Nini",
    `DESCRIPTION:${descripcion}`,
    `LOCATION:Calle Constitución 53\\, 28100 Alcobendas\\, Madrid`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cita-beauty-room-nini.ics"',
    },
  });
}
