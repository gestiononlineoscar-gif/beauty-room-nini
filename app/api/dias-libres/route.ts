import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const profesionalId = req.nextUrl.searchParams.get("profesional_id");
  if (!profesionalId) return NextResponse.json({ error: "Falta profesional_id" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("dias_libres")
    .select("*")
    .eq("profesional_id", profesionalId)
    .gte("fecha", new Date().toISOString().slice(0, 10))
    .order("fecha");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { profesional_id, fecha, motivo } = await req.json();
  const { data, error } = await supabase
    .from("dias_libres")
    .insert({ profesional_id, fecha, motivo })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await supabase.from("dias_libres").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
