import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const profesionalId = req.nextUrl.searchParams.get("profesional_id");
  if (!profesionalId) return NextResponse.json({ error: "Falta profesional_id" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profesional_servicio")
    .select("servicio_id")
    .eq("profesional_id", profesionalId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => r.servicio_id));
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { profesional_id, servicio_ids }: { profesional_id: string; servicio_ids: string[] } = await req.json();
  if (!profesional_id) return NextResponse.json({ error: "Falta profesional_id" }, { status: 400 });

  await supabase.from("profesional_servicio").delete().eq("profesional_id", profesional_id);

  if (servicio_ids.length > 0) {
    const inserts = servicio_ids.map((sid) => ({ profesional_id, servicio_id: sid }));
    const { error } = await supabase.from("profesional_servicio").insert(inserts);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
