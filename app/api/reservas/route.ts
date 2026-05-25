import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
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
  const { cliente_id, profesional_id, servicio_id, variante_id, fecha, hora_inicio, hora_fin } = body;

  if (!cliente_id || !profesional_id || !servicio_id || !fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const db = adminClient();

  // Límite: el cliente no puede tener más de 3 reservas en la fecha seleccionada
  const { count } = await db
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", cliente_id)
    .eq("fecha", fecha)
    .neq("estado", "cancelada");

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "limite_diario" }, { status: 409 });
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
