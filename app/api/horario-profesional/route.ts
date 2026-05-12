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
  const profesionalId = req.nextUrl.searchParams.get("profesional_id");
  const todos = req.nextUrl.searchParams.get("todos");

  if (!profesionalId && !todos) return NextResponse.json({ error: "Falta profesional_id" }, { status: 400 });

  let query = adminClient().from("horario_profesional").select("*").order("dia_semana");
  if (profesionalId) query = query.eq("profesional_id", profesionalId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, trabaja, hora_inicio, hora_fin } = await req.json();

  const { data, error } = await adminClient()
    .from("horario_profesional")
    .update({ trabaja, hora_inicio, hora_fin })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
