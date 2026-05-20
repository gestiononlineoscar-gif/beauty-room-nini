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

async function requireAuth() {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const profesionalId = req.nextUrl.searchParams.get("profesional_id");
  if (!profesionalId) return NextResponse.json({ error: "Falta profesional_id" }, { status: 400 });

  const { data, error } = await adminClient()
    .from("horario_excepciones")
    .select("*")
    .eq("profesional_id", profesionalId)
    .gte("fecha", new Date().toISOString().slice(0, 10))
    .order("fecha");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { profesional_id, fecha, hora_inicio, hora_fin, motivo } = await req.json();
  if (!profesional_id || !fecha || !hora_inicio || !hora_fin) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const { data, error } = await adminClient()
    .from("horario_excepciones")
    .upsert({ profesional_id, fecha, hora_inicio, hora_fin, motivo: motivo || null }, { onConflict: "profesional_id,fecha" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!await requireAuth()) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await adminClient().from("horario_excepciones").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
