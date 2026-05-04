import { NextRequest, NextResponse } from "next/server";
import { enviarConfirmacionReserva } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const datos = await req.json();
    await enviarConfirmacionReserva(datos);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error enviando email:", error);
    return NextResponse.json({ error: "Error al enviar email" }, { status: 500 });
  }
}
