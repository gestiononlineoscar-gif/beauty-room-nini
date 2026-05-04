import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const profesionalId = req.nextUrl.searchParams.get("profesional_id");
  if (!profesionalId) return NextResponse.json({ error: "Falta profesional_id" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("horario_profesional")
    .select("*")
    .eq("profesional_id", profesionalId)
    .order("dia_semana");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, trabaja, hora_inicio, hora_fin } = body;

  const { data, error } = await supabase
    .from("horario_profesional")
    .update({ trabaja, hora_inicio, hora_fin })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
