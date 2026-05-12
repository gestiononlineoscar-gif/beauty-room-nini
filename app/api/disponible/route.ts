import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parse, addMinutes, isAfter, isBefore } from "date-fns";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Comprueba si un profesional está libre en una ventana exacta
// GET /api/disponible?profesional_id=X&fecha=Y&hora_inicio=HH:mm&duracion_min=N
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const profesionalId = searchParams.get("profesional_id");
  const fecha         = searchParams.get("fecha");
  const horaInicio    = searchParams.get("hora_inicio");
  const duracionMin   = Number(searchParams.get("duracion_min") ?? "60") || 60;

  if (!profesionalId || !fecha || !horaInicio) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const supabase   = adminClient();
  const baseDate   = new Date(`${fecha}T00:00:00`);
  const inicio     = parse(horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio, "HH:mm:ss", baseDate);
  const fin        = addMinutes(inicio, duracionMin);

  // 1. Comprobar que el profesional trabaja ese día y a esa hora
  const diaSemana = new Date(`${fecha}T12:00:00`).getDay();
  const { data: horario } = await supabase
    .from("horario_profesional")
    .select("trabaja, hora_inicio, hora_fin")
    .eq("profesional_id", profesionalId)
    .eq("dia_semana", diaSemana)
    .single();

  if (!horario?.trabaja) return NextResponse.json({ disponible: false });

  const turnoInicio = parse(horario.hora_inicio as string, "HH:mm:ss", baseDate);
  const turnoFin    = parse(horario.hora_fin    as string, "HH:mm:ss", baseDate);
  if (isBefore(inicio, turnoInicio) || isAfter(fin, turnoFin)) {
    return NextResponse.json({ disponible: false });
  }

  // 2. Día libre
  const { data: diaLibre } = await supabase
    .from("dias_libres")
    .select("id")
    .eq("profesional_id", profesionalId)
    .eq("fecha", fecha)
    .maybeSingle();
  if (diaLibre) return NextResponse.json({ disponible: false });

  // 3. Reservas que solapan
  const { data: reservas } = await supabase
    .from("reservas")
    .select("hora_inicio, hora_fin")
    .eq("profesional_id", profesionalId)
    .eq("fecha", fecha)
    .neq("estado", "cancelada");

  const solapaReserva = (reservas ?? []).some((r) => {
    const rI = parse(r.hora_inicio, "HH:mm:ss", baseDate);
    const rF = parse(r.hora_fin,    "HH:mm:ss", baseDate);
    return isBefore(inicio, rF) && isAfter(fin, rI);
  });
  if (solapaReserva) return NextResponse.json({ disponible: false });

  // 4. Bloqueos que solapan
  const { data: bloqueos } = await supabase
    .from("bloqueos_horario")
    .select("hora_inicio, hora_fin")
    .eq("profesional_id", profesionalId)
    .eq("fecha", fecha);

  const solapaBloqueo = (bloqueos ?? []).some((b) => {
    const bI = parse(b.hora_inicio, "HH:mm:ss", baseDate);
    const bF = parse(b.hora_fin,    "HH:mm:ss", baseDate);
    return isBefore(inicio, bF) && isAfter(fin, bI);
  });

  return NextResponse.json({ disponible: !solapaBloqueo });
}
