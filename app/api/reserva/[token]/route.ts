import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isBefore } from "date-fns";

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
    .select("id, fecha, hora_inicio, estado")
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

  const { error } = await db
    .from("reservas")
    .update({ servicio_id, variante_id: variante_id || null, fecha, hora_inicio, hora_fin })
    .eq("id", reserva.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
