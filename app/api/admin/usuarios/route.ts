import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

async function verificarPropietaria() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .single<{ rol: string }>();
  if (usuario?.rol !== "propietaria") return null;
  return user;
}

export async function GET() {
  const user = await verificarPropietaria();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: usuarios }, { data: authData }] = await Promise.all([
    admin.from("usuarios").select("*, profesionales(id, nombre, color, especialidad)"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailPorId: Record<string, string> = {};
  for (const au of authData?.users ?? []) {
    emailPorId[au.id] = au.email ?? "";
  }

  const resultado = (usuarios ?? []).map((u: Record<string, unknown>) => ({
    ...u,
    email: emailPorId[u.id as string] ?? "",
  }));

  return NextResponse.json(resultado);
}

export async function POST(req: NextRequest) {
  const user = await verificarPropietaria();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { email, password, nombre, rol, profesional_id } = await req.json();
  if (!email || !password || !nombre || !rol) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? "Error al crear usuario" }, { status: 500 });
  }

  const { data: usuario, error: dbError } = await admin
    .from("usuarios")
    .insert({
      id: authUser.user.id,
      nombre,
      rol,
      profesional_id: profesional_id || null,
      activo: true,
    })
    .select("*, profesionales(id, nombre, color, especialidad)")
    .single();

  if (dbError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ...usuario, email });
}

export async function PATCH(req: NextRequest) {
  const user = await verificarPropietaria();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, rol, activo, password } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const admin = createAdminClient();

  const updates: Partial<{ rol: string; activo: boolean }> = {};
  if (rol !== undefined) updates.rol = rol;
  if (activo !== undefined) updates.activo = activo;

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from("usuarios").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await verificarPropietaria();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("usuarios").update({ activo: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
