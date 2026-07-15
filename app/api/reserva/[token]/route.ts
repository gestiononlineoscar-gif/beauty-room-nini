import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isBefore, parse, isAfter } from "date-fns";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type Franja = { hora_inicio: string; hora_fin: string };

async function hayConflicto(
  db: ReturnType<typeof adminClient>,
  profesionalId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  excluirReservaId: string
): Promise<"bloqueado" | "solapado" | null> {
  const baseDate = new Date(`${fecha}T00:00:00`);
  const inicio = parse(horaInicio, "HH:mm:ss", baseDate);
  const fin = parse(horaFin, "HH:mm:ss", baseDate);

  const solapa = (lista: Franja[] | null) =>
    (lista ?? []).some((x) => {
      const xI = parse(x.hora_inicio, "HH:mm:ss", baseDate);
      const xF = parse(x.hora_fin, "HH:mm:ss", baseDate);
      return isBefore(inicio, xF) && isAfter(fin, xI);
    });

  const [{ data: bloqueos }, { data: reservas }] = await Promise.all([
    db.from("bloqueos_horario").select("hora_inicio, hora_fin").eq("profesional_id", profesionalId).eq("fecha", fecha),
    db.from("reservas").select("hora_inicio, hora_fin").eq("profesional_id", profesionalId).eq("fecha", fecha).neq("estado", "cancelada").neq("id", excluirReservaId),
  ]);

  if (solapa(bloqueos)) return "bloqueado";
  if (solapa(reservas)) return "solapado";
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { data, error } = await adminClient()
    .from("reservas")
    .select("id, fecha, hora_inicio, hora_fin, estado, servicios(*), profesionales(*), clientes(nombre), variante:servicio_variantes(*)")
    .eq("gestion_token", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json();
  const db = adminClient();

  const { data: reserva } = await db
    .from("reservas")
    .select("id, fecha, hora_inicio, estado, profesional_id")
    .eq("gestion_token", token)
    .single();

  if (!reserva) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (reserva.estado === "cancelada") return NextResponse.json({ error: "Ya cancelada" }, { status: 400 });
  if (reserva.estado === "completada") return NextResponse.json({ error: "Ya completada" }, { status: 400 });

  const fechaHora = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);
  if (isBefore(fechaHora, new Date())) {
    return NextResponse.json({ error: "Pasada" }, { status: 400 });
  }

  if (body.accion === "cancelar") {
    const { error } = await db.from("reservas").update({ estado: "cancelada" }).eq("id", reserva.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { servicio_id, variante_id, fecha, hora_inicio, hora_fin } = body;
  if (!servicio_id || !fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const conflicto = await hayConflicto(db, reserva.profesional_id, fecha, hora_inicio, hora_fin, reserva.id);
  if (conflicto) {
    return NextResponse.json({ error: conflicto === "bloqueado" ? "bloqueado" : "no_disponible" }, { status: 409 });
  }

  const { error } = await db
    .from("reservas")
    .update({ servicio_id, variante_id: variante_id || null, fecha, hora_inicio, hora_fin })
    .eq("id", reserva.id);

  if (error) {
    if (error.code === "BR001") return NextResponse.json({ error: "no_disponible" }, { status: 409 });
    if (error.code === "BR002") return NextResponse.json({ error: "bloqueado" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
