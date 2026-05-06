"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import type { Profesional } from "@/types";
import {
  format, parseISO, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type Rango = "dia" | "semana" | "mes" | "personalizado";

interface ReservaAPI {
  id: string;
  fecha: string;
  estado: string;
  profesional_id: string;
  servicios?: { nombre: string; precio: number } | null;
  profesionales?: { nombre: string } | null;
}

interface Props {
  profesionales: Profesional[];
}

function toISO(d: Date) { return format(d, "yyyy-MM-dd"); }

export function MetricasDashboard({ profesionales }: Props) {
  const hoy = new Date();
  const [rango, setRango] = useState<Rango>("mes");
  const [diaRef, setDiaRef] = useState(hoy);
  const [semanaRef, setSemanaRef] = useState(hoy);
  const [mesRef, setMesRef] = useState(hoy);
  const [desde, setDesde] = useState(toISO(startOfMonth(hoy)));
  const [hasta, setHasta] = useState(toISO(endOfMonth(hoy)));
  const [reservas, setReservas] = useState<ReservaAPI[]>([]);
  const [cargando, setCargando] = useState(false);

  const calcularRango = useCallback(() => {
    if (rango === "dia") return { d: toISO(diaRef), h: toISO(diaRef) };
    if (rango === "semana") {
      return {
        d: toISO(startOfWeek(semanaRef, { weekStartsOn: 1 })),
        h: toISO(endOfWeek(semanaRef, { weekStartsOn: 1 })),
      };
    }
    if (rango === "mes") {
      return { d: toISO(startOfMonth(mesRef)), h: toISO(endOfMonth(mesRef)) };
    }
    return { d: desde, h: hasta };
  }, [rango, diaRef, semanaRef, mesRef, desde, hasta]);

  useEffect(() => {
    const { d, h } = calcularRango();
    setCargando(true);
    fetch(`/api/reservas?desde=${d}&hasta=${h}`)
      .then((r) => r.json())
      .then((data) => { setReservas(Array.isArray(data) ? data : []); setCargando(false); })
      .catch(() => setCargando(false));
  }, [calcularRango]);

  const activas = reservas.filter((r) => r.estado !== "cancelada");
  const completadas = reservas.filter((r) => r.estado === "completada");
  const ingresos = completadas.reduce((s, r) => s + Number(r.servicios?.precio ?? 0), 0);

  // Gráfica temporal
  const { d: dDesde, h: dHasta } = calcularRango();
  const diasRango = eachDayOfInterval({ start: parseISO(dDesde), end: parseISO(dHasta) });
  const usarSemanas = diasRango.length > 14;

  const datosGrafica = usarSemanas
    ? eachWeekOfInterval({ start: parseISO(dDesde), end: parseISO(dHasta) }, { weekStartsOn: 1 }).map((semIni) => {
        const semFin = endOfWeek(semIni, { weekStartsOn: 1 });
        const r = completadas.filter((x) => {
          const d = parseISO(x.fecha);
          return d >= semIni && d <= semFin;
        });
        return {
          label: format(semIni, "d MMM", { locale: es }),
          ingresos: r.reduce((s, x) => s + Number(x.servicios?.precio ?? 0), 0),
          citas: r.length,
        };
      })
    : diasRango.map((dia) => {
        const r = completadas.filter((x) => x.fecha === toISO(dia));
        return {
          label: format(dia, rango === "dia" ? "HH:mm" : "d MMM", { locale: es }),
          ingresos: r.reduce((s, x) => s + Number(x.servicios?.precio ?? 0), 0),
          citas: r.length,
        };
      });

  // Citas por profesional
  const citasPorProfesional = profesionales
    .map((p) => ({
      nombre: p.nombre.split(" ")[0],
      color: p.color,
      citas: activas.filter((r) => r.profesional_id === p.id).length,
    }))
    .filter((p) => p.citas > 0)
    .sort((a, b) => b.citas - a.citas);

  // Top servicios
  const serviciosMap: Record<string, { nombre: string; count: number }> = {};
  activas.forEach((r) => {
    const n = r.servicios?.nombre ?? "Desconocido";
    if (!serviciosMap[n]) serviciosMap[n] = { nombre: n, count: 0 };
    serviciosMap[n].count++;
  });
  const topServicios = Object.values(serviciosMap).sort((a, b) => b.count - a.count).slice(0, 6);

  const etiquetaPeriodo = () => {
    if (rango === "dia") return format(diaRef, "EEEE d 'de' MMMM", { locale: es });
    if (rango === "semana") {
      const ini = startOfWeek(semanaRef, { weekStartsOn: 1 });
      const fin = endOfWeek(semanaRef, { weekStartsOn: 1 });
      return `${format(ini, "d MMM", { locale: es })} – ${format(fin, "d MMM yyyy", { locale: es })}`;
    }
    if (rango === "mes") return format(mesRef, "MMMM yyyy", { locale: es });
    return `${desde} → ${hasta}`;
  };

  return (
    <div className="space-y-5">

      {/* Selector de rango */}
      <div className="bg-white rounded-2xl border border-[#e8c5ce] p-4 space-y-3">
        <div className="flex gap-1 bg-[#f4f1ef] p-1 rounded-xl w-fit">
          {(["dia", "semana", "mes", "personalizado"] as Rango[]).map((r) => (
            <button key={r} onClick={() => setRango(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${rango === r ? "bg-white text-[#1a1412] shadow-sm" : "text-[#6b6360] hover:text-[#1a1412]"}`}>
              {r === "dia" ? "Día" : r === "semana" ? "Semana" : r === "mes" ? "Mes" : "Personalizado"}
            </button>
          ))}
        </div>

        {/* Navegación día */}
        {rango === "dia" && (
          <div className="flex items-center gap-3">
            <button onClick={() => setDiaRef((d) => { const x = new Date(d); x.setDate(x.getDate() - 1); return x; })}
              className="p-1.5 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:text-[#C4728A]"><ChevronLeft size={16} /></button>
            <input type="date" value={toISO(diaRef)} onChange={(e) => setDiaRef(new Date(e.target.value + "T12:00:00"))}
              className="border border-[#e8c5ce] rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
            <button onClick={() => setDiaRef((d) => { const x = new Date(d); x.setDate(x.getDate() + 1); return x; })}
              className="p-1.5 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:text-[#C4728A]"><ChevronRight size={16} /></button>
            <button onClick={() => setDiaRef(hoy)} className="text-xs text-[#C4728A] hover:underline">Hoy</button>
          </div>
        )}

        {/* Navegación semana */}
        {rango === "semana" && (
          <div className="flex items-center gap-3">
            <button onClick={() => setSemanaRef((d) => { const x = new Date(d); x.setDate(x.getDate() - 7); return x; })}
              className="p-1.5 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:text-[#C4728A]"><ChevronLeft size={16} /></button>
            <span className="text-sm text-[#1a1412] font-medium capitalize">{etiquetaPeriodo()}</span>
            <button onClick={() => setSemanaRef((d) => { const x = new Date(d); x.setDate(x.getDate() + 7); return x; })}
              className="p-1.5 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:text-[#C4728A]"><ChevronRight size={16} /></button>
            <button onClick={() => setSemanaRef(hoy)} className="text-xs text-[#C4728A] hover:underline">Esta semana</button>
          </div>
        )}

        {/* Navegación mes */}
        {rango === "mes" && (
          <div className="flex items-center gap-3">
            <button onClick={() => setMesRef((d) => { const x = new Date(d); x.setMonth(x.getMonth() - 1); return x; })}
              className="p-1.5 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:text-[#C4728A]"><ChevronLeft size={16} /></button>
            <span className="text-sm text-[#1a1412] font-medium capitalize">{etiquetaPeriodo()}</span>
            <button onClick={() => setMesRef((d) => { const x = new Date(d); x.setMonth(x.getMonth() + 1); return x; })}
              className="p-1.5 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:text-[#C4728A]"><ChevronRight size={16} /></button>
            <button onClick={() => setMesRef(hoy)} className="text-xs text-[#C4728A] hover:underline">Este mes</button>
          </div>
        )}

        {/* Rango personalizado */}
        {rango === "personalizado" && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#6b6360]">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                className="border border-[#e8c5ce] rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#6b6360]">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                className="border border-[#e8c5ce] rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
            </div>
          </div>
        )}
      </div>

      {cargando ? (
        <div className="text-center py-16 text-[#6b6360] text-sm">Cargando datos...</div>
      ) : (
        <>
          {/* Cards resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Citas", value: activas.length, sub: `${completadas.length} completadas`, color: "#2B5BA8" },
              { label: "Canceladas", value: reservas.length - activas.length, sub: "del período", color: "#D4621A" },
              { label: "Ingresos", value: `${ingresos.toFixed(2)} €`, sub: "de completadas", color: "#4a9b6f" },
              { label: "Ticket medio", value: completadas.length ? `${(ingresos / completadas.length).toFixed(2)} €` : "—", sub: "por cita completada", color: "#C4728A" },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-[#e8c5ce] p-4">
                <p className="text-xs text-[#6b6360] mb-1">{c.label}</p>
                <p className="font-heading text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs text-[#6b6360] mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Gráfica ingresos */}
          {datosGrafica.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8c5ce] p-5">
              <h3 className="font-semibold text-[#1a1412] mb-4 capitalize">
                Ingresos · <span className="text-[#6b6360] font-normal text-sm">{etiquetaPeriodo()}</span>
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={datosGrafica} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f1ef" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b6360" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b6360" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e8c5ce", fontSize: 12 }}
                    formatter={(v) => [`${Number(v ?? 0).toFixed(2)} €`, "Ingresos"]} />
                  <Bar dataKey="ingresos" fill="#C4728A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Citas por profesional */}
            <div className="bg-white rounded-2xl border border-[#e8c5ce] p-5">
              <h3 className="font-semibold text-[#1a1412] mb-4">Citas por profesional</h3>
              {citasPorProfesional.length === 0 ? (
                <p className="text-sm text-[#6b6360] text-center py-8">Sin datos en este período</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={citasPorProfesional} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f1ef" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: "#6b6360" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b6360" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e8c5ce", fontSize: 12 }}
                      formatter={(v) => [`${v} citas`, ""]} />
                    <Bar dataKey="citas" radius={[6, 6, 0, 0]}>
                      {citasPorProfesional.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top servicios */}
            <div className="bg-white rounded-2xl border border-[#e8c5ce] p-5">
              <h3 className="font-semibold text-[#1a1412] mb-4">Servicios más solicitados</h3>
              {topServicios.length === 0 ? (
                <p className="text-sm text-[#6b6360] text-center py-8">Sin datos en este período</p>
              ) : (
                <div className="space-y-2.5">
                  {topServicios.map((s, i) => (
                    <div key={s.nombre} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#6b6360] w-4">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#1a1412] font-medium truncate">{s.nombre}</span>
                          <span className="text-[#C4728A] font-bold ml-2">{s.count}</span>
                        </div>
                        <div className="h-1.5 bg-[#f4f1ef] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C4728A] rounded-full" style={{ width: `${(s.count / topServicios[0].count) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
