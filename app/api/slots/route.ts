import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addMinutes, format, parse, isAfter, isBefore } from "date-fns";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const profesionalId = searchParams.get("profesional_id");
  const fecha = searchParams.get("fecha");
  const duracionMin = Number(searchParams.get("duracion_min") ?? "60") || 60;

  if (!profesionalId || !fecha) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const supabase = adminClient();
  const diaSemana = new Date(fecha + "T12:00:00").getDay();

  const { data: horario } = await supabase
    .from("horario_profesional")
    .select("*")
    .eq("profesional_id", profesionalId)
    .eq("dia_semana", diaSemana)
    .single();

  if (!horario || !horario.trabaja) return NextResponse.json([]);

  const { data: diaLibre } = await supabase
    .from("dias_libres")
    .select("id")
    .eq("profesional_id", profesionalId)
    .eq("fecha", fecha)
    .maybeSingle();

  if (diaLibre) return NextResponse.json([]);

  const [{ data: reservas }, { data: bloqueos }] = await Promise.all([
    supabase
      .from("reservas")
      .select("hora_inicio, hora_fin, estado")
      .eq("profesional_id", profesionalId)
      .eq("fecha", fecha)
      .neq("estado", "cancelada"),
    supabase
      .from("bloqueos_horario")
      .select("hora_inicio, hora_fin")
      .eq("profesional_id", profesionalId)
      .eq("fecha", fecha),
  ]);

  const slots = [];
  const baseDate = new Date(`${fecha}T00:00:00`);
  let current = parse(horario.hora_inicio as string, "HH:mm:ss", baseDate);
  const fin = parse(horario.hora_fin as string, "HH:mm:ss", baseDate);
  const finConDuracion = addMinutes(fin, -duracionMin);
  const ahora = new Date();
  const esHoy = fecha === format(ahora, "yyyy-MM-dd");

  while (!isAfter(current, finConDuracion)) {
    if (esHoy && !isAfter(current, ahora)) {
      current = addMinutes(current, 30);
      continue;
    }

    const slotFin = addMinutes(current, duracionMin);
    const horaInicioStr = format(current, "HH:mm");
    const horaFinStr = format(slotFin, "HH:mm");

    const ocupadoPorReserva = reservas?.some((r) => {
      const rInicio = parse(r.hora_inicio, "HH:mm:ss", baseDate);
      const rFin = parse(r.hora_fin, "HH:mm:ss", baseDate);
      return isBefore(current, rFin) && isAfter(slotFin, rInicio);
    }) ?? false;

    const ocupadoPorBloqueo = bloqueos?.some((b) => {
      const bInicio = parse(b.hora_inicio, "HH:mm:ss", baseDate);
      const bFin = parse(b.hora_fin, "HH:mm:ss", baseDate);
      return isBefore(current, bFin) && isAfter(slotFin, bInicio);
    }) ?? false;

    slots.push({
      hora_inicio: horaInicioStr,
      hora_fin: horaFinStr,
      disponible: !(ocupadoPorReserva || ocupadoPorBloqueo),
    });

    current = addMinutes(current, 30);
  }

  return NextResponse.json(slots);
}
