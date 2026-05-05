import { createClient } from "./supabase";
import { SlotDisponible } from "@/types";
import { addMinutes, format, parse, isAfter, isBefore } from "date-fns";

export async function obtenerSlotsDisponibles(
  profesionalId: string,
  fecha: string,
  duracionMin: number
): Promise<SlotDisponible[]> {
  const supabase = createClient();
  const diaSemana = new Date(fecha + "T12:00:00").getDay();

  // Si se selecciona "cualquier profesional", no aplica esta función directamente
  const { data: horario } = await supabase
    .from("horario_profesional")
    .select("*")
    .eq("profesional_id", profesionalId)
    .eq("dia_semana", diaSemana)
    .single();

  if (!horario || !horario.trabaja) return [];

  // Verificar que no sea día libre
  const { data: diaLibre } = await supabase
    .from("dias_libres")
    .select("id")
    .eq("profesional_id", profesionalId)
    .eq("fecha", fecha)
    .single();

  if (diaLibre) return [];

  // Obtener reservas y bloqueos ese día para esa profesional
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

  const slots: SlotDisponible[] = [];
  const baseDate = new Date(`${fecha}T00:00:00`);
  const inicioStr = horario.hora_inicio as string;
  const finStr = horario.hora_fin as string;

  let current = parse(inicioStr, "HH:mm:ss", baseDate);
  const fin = parse(finStr, "HH:mm:ss", baseDate);
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

    const ocupado = ocupadoPorReserva || ocupadoPorBloqueo;

    slots.push({
      hora_inicio: horaInicioStr,
      hora_fin: horaFinStr,
      disponible: !ocupado,
    });

    current = addMinutes(current, 30);
  }

  return slots;
}
