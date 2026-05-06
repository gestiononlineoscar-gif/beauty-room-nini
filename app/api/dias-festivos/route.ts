import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// GET — listar fechas cerradas próximas (días donde todos tienen día libre)
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("dias_libres")
    .select("fecha, motivo")
    .gte("fecha", hoy)
    .order("fecha");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Agrupar por fecha y devolver únicas con motivo
  const mapa: Record<string, string> = {};
  for (const d of data ?? []) {
    if (!mapa[d.fecha]) mapa[d.fecha] = d.motivo ?? "";
  }
  const fechas = Object.entries(mapa).map(([fecha, motivo]) => ({ fecha, motivo }));
  return NextResponse.json(fechas);
}

// POST — cerrar un día para todos los profesionales activos
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { fecha, motivo } = await req.json();
  if (!fecha) return NextResponse.json({ error: "Falta fecha" }, { status: 400 });

  const { data: profesionales } = await supabase
    .from("profesionales")
    .select("id")
    .eq("activo", true);

  if (!profesionales?.length) return NextResponse.json({ ok: true });

  // Eliminar posibles duplicados primero
  await supabase.from("dias_libres").delete().eq("fecha", fecha);

  const inserts = profesionales.map((p) => ({
    profesional_id: p.id,
    fecha,
    motivo: motivo || "Día festivo",
  }));

  const { error } = await supabase.from("dias_libres").insert(inserts);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE — reabrir un día para todos
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const fecha = req.nextUrl.searchParams.get("fecha");
  if (!fecha) return NextResponse.json({ error: "Falta fecha" }, { status: 400 });

  const { error } = await supabase.from("dias_libres").delete().eq("fecha", fecha);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
