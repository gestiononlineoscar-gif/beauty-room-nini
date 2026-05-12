"use client";

import { useState, useEffect } from "react";
import { format, addDays, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase";
import type { Reserva } from "@/types";

const WA_ICON = (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function generarMensaje(r: Reserva): string {
  const nombre = r.clientes?.nombre?.split(" ")[0] ?? "clienta";
  const servicio = r.servicios?.nombre ?? "tu servicio";
  const hora = r.hora_inicio.slice(0, 5);
  const fechaCorta = format(parseISO(r.fecha), "EEEE d 'de' MMMM", { locale: es });
  const profesional = r.profesionales?.nombre;

  return (
    `Hola ${nombre}! Te recordamos tu cita en *Beauty Room Nini*\n\n` +
    `*Fecha:* ${fechaCorta}\n` +
    `*Hora:* ${hora}h\n` +
    `*Servicio:* ${servicio}\n` +
    (profesional ? `*Con:* ${profesional}\n` : "") +
    `\nTe esperamos! Si necesitas cancelar o cambiar avisanos con antelacion.`
  );
}

function generarLink(r: Reserva): string {
  const tel = r.clientes?.telefono ?? "";
  const telLimpio = tel.replace(/\D/g, "").replace(/^0+/, "").replace(/^(?!34)/, "34");
  return `https://wa.me/${telLimpio}?text=${encodeURIComponent(generarMensaje(r))}`;
}

export function RecordatoriosPanel() {
  const manana = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const [fecha, setFecha] = useState(manana);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCargando(true);
    fetch(`/api/reservas?desde=${fecha}&hasta=${fecha}`)
      .then((r) => r.json())
      .then((data) => {
        const filtradas: Reserva[] = Array.isArray(data)
          ? data.filter((r: Reserva) => r.estado === "pendiente" || r.estado === "confirmada")
          : [];
        setReservas(filtradas);
        // Inicializar marcas desde el campo persistido en DB
        setEnviados(new Set(
          filtradas.filter((r) => r.recordatorio_enviado_at).map((r) => r.id)
        ));
      })
      .catch(() => { setReservas([]); setEnviados(new Set()); })
      .finally(() => setCargando(false));
  }, [fecha]);

  async function toggleEnviado(id: string) {
    const yaEnviado = enviados.has(id);
    const nuevoValor = yaEnviado ? null : new Date().toISOString();

    setEnviados((prev) => {
      const next = new Set(prev);
      if (yaEnviado) next.delete(id); else next.add(id);
      return next;
    });

    await createClient()
      .from("reservas")
      .update({ recordatorio_enviado_at: nuevoValor })
      .eq("id", id);
  }

  const conTel = reservas.filter((r) => r.clientes?.telefono);
  const sinTel = reservas.filter((r) => !r.clientes?.telefono);
  const nEnviados = [...enviados].filter((id) => conTel.some((r) => r.id === id)).length;
  const progreso = conTel.length > 0 ? (nEnviados / conTel.length) * 100 : 0;
  const todosEnviados = conTel.length > 0 && nEnviados >= conTel.length;

  const fechaDisplay = format(parseISO(fecha + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es });

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl text-[#1a1412]">Recordatorios WhatsApp</h1>
          <p className="text-sm text-[#6b6360] mt-0.5 capitalize">{fechaDisplay}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFecha(manana)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              fecha === manana
                ? "bg-[#C4728A] text-white border-[#C4728A]"
                : "border-[#e8c5ce] text-[#6b6360] hover:bg-[#f4f1ef]"
            }`}
          >
            Mañana
          </button>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
          />
        </div>
      </div>

      {/* Barra de progreso */}
      {!cargando && conTel.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8c5ce] p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#6b6360]">
              <span className="font-bold text-[#C4728A]">{nEnviados}</span> de{" "}
              <span className="font-bold text-[#1a1412]">{conTel.length}</span> enviados
              {sinTel.length > 0 && (
                <span className="ml-3 text-xs text-orange-500">· {sinTel.length} sin teléfono</span>
              )}
            </p>
            {todosEnviados && (
              <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                ✓ ¡Todos enviados!
              </span>
            )}
          </div>
          <div className="h-2.5 bg-[#f4f1ef] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progreso}%`,
                backgroundColor: todosEnviados ? "#22c55e" : "#25D366",
              }}
            />
          </div>
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6360]">
          <div className="w-6 h-6 rounded-full border-2 border-[#C4728A] border-t-transparent animate-spin mb-3" />
          Cargando citas...
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#e8c5ce]">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium text-[#1a1412]">Sin citas para este día</p>
          <p className="text-sm text-[#6b6360] mt-1">No hay citas pendientes ni confirmadas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservas.map((r) => {
            const tieneTel = !!r.clientes?.telefono;
            const yaEnviado = enviados.has(r.id);

            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 transition-all ${
                  yaEnviado
                    ? "border-green-200 bg-green-50/40"
                    : "border-[#e8c5ce] hover:border-[#C4728A]/40"
                }`}
              >
                {/* Checkbox de enviado */}
                <button
                  type="button"
                  onClick={() => tieneTel && toggleEnviado(r.id)}
                  disabled={!tieneTel}
                  title={yaEnviado ? "Marcar como no enviado" : "Marcar como enviado"}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    yaEnviado
                      ? "bg-green-500 border-green-500"
                      : tieneTel
                      ? "border-[#d1d5db] hover:border-[#25D366]"
                      : "border-[#e8c5ce] opacity-30 cursor-not-allowed"
                  }`}
                >
                  {yaEnviado && (
                    <svg viewBox="0 0 10 8" className="w-3 h-3" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Datos de la cita */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#C4728A] font-bold text-sm tabular-nums">
                      {r.hora_inicio.slice(0, 5)}
                    </span>
                    <span className={`font-semibold text-sm truncate ${yaEnviado ? "text-[#6b6360]" : "text-[#1a1412]"}`}>
                      {r.clientes?.nombre ?? "Sin nombre"}
                    </span>
                    {!tieneTel && (
                      <span className="text-xs bg-orange-100 text-orange-600 border border-orange-200 px-1.5 py-0.5 rounded-full">
                        Sin teléfono
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6b6360] mt-0.5 truncate">
                    {r.servicios?.nombre ?? "—"}
                    {r.profesionales?.nombre && <> · {r.profesionales.nombre}</>}
                    {tieneTel && <> · {r.clientes!.telefono}</>}
                  </p>
                </div>

                {/* Botón WhatsApp */}
                {tieneTel ? (
                  <a
                    href={generarLink(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => !yaEnviado && setTimeout(() => toggleEnviado(r.id), 1500)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      yaEnviado
                        ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                        : "bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-sm"
                    }`}
                  >
                    {WA_ICON}
                    <span className="hidden sm:inline">{yaEnviado ? "Enviado" : "Enviar"}</span>
                  </a>
                ) : (
                  <div className="flex-shrink-0 w-[80px] sm:w-[96px]" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ayuda */}
      {!cargando && conTel.length > 0 && (
        <p className="text-xs text-center text-[#6b6360] mt-5">
          Pulsa <strong>Enviar</strong> → se abre WhatsApp con el mensaje listo → toca Enviar → vuelve aquí y se marca automáticamente ✓
        </p>
      )}
    </div>
  );
}
