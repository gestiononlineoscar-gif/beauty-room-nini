import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const servicioId = req.nextUrl.searchParams.get("servicio_id");
  if (!servicioId) return NextResponse.json({ error: "Falta servicio_id" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("servicio_variantes")
    .select("*")
    .eq("servicio_id", servicioId)
    .order("orden");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
