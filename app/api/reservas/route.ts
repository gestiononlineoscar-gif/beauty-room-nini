import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { parse, isBefore, isAfter } from "date-fns";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type Franja = { hora_inicio: string; hora_fin: string };

// Revalida en el servidor lo que el cliente ya comprobó antes de enviar el
// formulario (disponibilidad pudo caducar mientras rellenaba sus datos).
// El trigger validar_reserva_sin_conflicto en la base de datos actúa como
// último cortafuegos si esta comprobación pierde una carrera muy ajustada.
async function hayConflicto(
  db: ReturnType<typeof adminClient>,
  profesionalId: string,
  fecha: string,
  horaInicio: string,
  horaFin: string
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
    db.from("reservas").select("hora_inicio, hora_fin").eq("profesional_id", profesionalId).eq("fecha", fecha).neq("estado", "cancelada"),
  ]);

  if (solapa(bloqueos)) return "bloqueado";
  if (solapa(reservas)) return "solapado";
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  if (!desde || !hasta) {
    return NextResponse.json({ error: "Faltan parámetros desde/hasta" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabase
    .from("reservas")
    .select("*, clientes(*), profesionales(*), servicios(*), variante:servicio_variantes(*), reserva_servicios(*, servicios(*), variante:servicio_variantes(*))")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha")
    .order("hora_inicio");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cliente_id, profesional_id, servicio_id, variante_id, fecha, hora_inicio, hora_fin, servicios_extra } = body;

  if (!cliente_id || !profesional_id || !servicio_id || !fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const db = adminClient();

  // El panel admin (usuario autenticado) crea reservas manuales sin el límite
  // diario pensado para frenar abuso del portal público.
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    const { count } = await db
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", cliente_id)
      .eq("fecha", fecha)
      .neq("estado", "cancelada");

    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: "limite_diario" }, { status: 409 });
    }
  }

  const conflicto = await hayConflicto(db, profesional_id, fecha, hora_inicio, hora_fin);
  if (conflicto) {
    return NextResponse.json({ error: conflicto === "bloqueado" ? "bloqueado" : "no_disponible" }, { status: 409 });
  }

  const { data, error } = await db
    .from("reservas")
    .insert({
      cliente_id,
      profesional_id,
      servicio_id,
      variante_id: variante_id || null,
      fecha,
      hora_inicio,
      hora_fin,
      estado: "confirmada",
    })
    .select("id, gestion_token")
    .single();

  if (error) {
    // BR001/BR002: el trigger validar_reserva_sin_conflicto detectó, en el
    // último instante, lo mismo que acabamos de comprobar arriba (carrera).
    if (error.code === "BR001") return NextResponse.json({ error: "no_disponible" }, { status: 409 });
    if (error.code === "BR002") return NextResponse.json({ error: "bloqueado" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Servicios adicionales de una reserva manual multi-servicio (panel admin).
  // Todo o nada: si falla el guardado de las líneas extra, se deshace la
  // reserva para no dejar una cita "a medias" con éxito reportado al usuario.
  if (Array.isArray(servicios_extra) && servicios_extra.length > 0) {
    const lineas = [
      { reserva_id: data.id, servicio_id, variante_id: variante_id || null, orden: 0 },
      ...servicios_extra.map((s: { servicio_id: string; variante_id?: string | null }, i: number) => ({
        reserva_id: data.id,
        servicio_id: s.servicio_id,
        variante_id: s.variante_id || null,
        orden: i + 1,
      })),
    ];
    const { error: errLineas } = await db.from("reserva_servicios").insert(lineas);
    if (errLineas) {
      await db.from("reservas").delete().eq("id", data.id);
      return NextResponse.json({ error: "error_guardando_servicios" }, { status: 500 });
    }
  }

  return NextResponse.json(data);
}
