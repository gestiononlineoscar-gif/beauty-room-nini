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

// GET /api/clientes?q=texto — búsqueda por nombre o teléfono (solo admin)
export async function GET(req: NextRequest) {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const { data } = await adminClient()
    .from("clientes")
    .select("id, nombre, telefono, email, bloqueado, inasistencias")
    .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)
    .order("nombre")
    .limit(10);

  return NextResponse.json(data ?? []);
}

// POST /api/clientes — busca por teléfono; si no existe, crea el cliente
// Devuelve { id, bloqueado }
export async function POST(req: NextRequest) {
  const { nombre, telefono, email } = await req.json();
  const supabase = adminClient();

  if (telefono) {
    const { data: existente } = await supabase
      .from("clientes")
      .select("id, bloqueado")
      .eq("telefono", telefono)
      .maybeSingle();
    if (existente) return NextResponse.json(existente);
  }

  const { data: nuevo, error } = await supabase
    .from("clientes")
    .insert({ nombre, telefono: telefono || null, email: email || null })
    .select("id, bloqueado")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(nuevo);
}
