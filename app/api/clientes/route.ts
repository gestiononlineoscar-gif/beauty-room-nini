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

// GET /api/clientes
//   ?q=texto              → autocomplete: devuelve Cliente[] (máx 10) — para NuevaReservaModal
//   ?page=N[&q=texto]     → paginación: devuelve { data: Cliente[], total: number } — para ClientesLista
export async function GET(req: NextRequest) {
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const pageParam = req.nextUrl.searchParams.get("page");

  if (pageParam !== null) {
    // Modo lista/paginación
    const page = Math.max(1, Number(pageParam) || 1);
    const limit = 50;
    const offset = (page - 1) * limit;

    let query = adminClient()
      .from("clientes")
      .select("*", { count: "exact" })
      .order("nombre");

    if (q.length >= 2) {
      query = query.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data ?? [], total: count ?? 0 });
  }

  // Modo autocomplete
  if (q.length < 2) return NextResponse.json([]);

  const { data } = await adminClient()
    .from("clientes")
    .select("id, nombre, telefono, email, bloqueado, inasistencias")
    .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)
    .order("nombre")
    .limit(10);

  return NextResponse.json(data ?? []);
}

// POST /api/clientes — busca por teléfono o email; si no existe, crea el cliente
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

  if (email) {
    const { data: existente } = await supabase
      .from("clientes")
      .select("id, bloqueado")
      .eq("email", email)
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
