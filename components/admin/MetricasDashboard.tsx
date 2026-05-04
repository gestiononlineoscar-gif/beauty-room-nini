"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import type { Reserva, Profesional } from "@/types";
import { format, parseISO, startOfWeek, addWeeks, isBefore, isAfter } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  profesionales: Profesional[];
  reservasMes: Reserva[];
  reservasHoy: Reserva[];
  reservas8semanas: Reserva[];
}

export function MetricasDashboard({ profesionales, reservasMes, reservasHoy, reservas8semanas }: Props) {
  const completadasMes = reservasMes.filter((r) => r.estado === "completada");
  const completadasHoy = reservasHoy.filter((r) => r.estado === "completada");

  const ingresosMes = completadasMes.reduce((s, r) => s + Number((r as any).servicios?.precio ?? 0), 0);
  const ingresosHoy = completadasHoy.reduce((s, r) => s + Number((r as any).servicios?.precio ?? 0), 0);

  const citasMesActivas = reservasMes.filter((r) => r.estado !== "cancelada").length;
  const citasHoyActivas = reservasHoy.filter((r) => r.estado !== "cancelada").length;

  const cards = [
    { label: "Citas hoy", value: citasHoyActivas, sub: `${completadasHoy.length} completadas`, color: "#2B5BA8" },
    { label: "Citas este mes", value: citasMesActivas, sub: `${completadasMes.length} completadas`, color: "#C4728A" },
    { label: "Ingresos hoy", value: `${ingresosHoy.toFixed(2)} €`, sub: "de citas completadas", color: "#4a9b6f" },
    { label: "Ingresos este mes", value: `${ingresosMes.toFixed(2)} €`, sub: "de citas completadas", color: "#D4621A" },
  ];

  // Ingresos por semana (últimas 8)
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const inicio = startOfWeek(addWeeks(new Date(), i - 7), { weekStartsOn: 1 });
    const fin = addWeeks(inicio, 1);
    const reservasSemana = reservas8semanas.filter((r) => {
      const d = parseISO(r.fecha);
      return !isBefore(d, inicio) && isBefore(d, fin) && r.estado === "completada";
    });
    return {
      semana: format(inicio, "d MMM", { locale: es }),
      ingresos: reservasSemana.reduce((s, r) => s + Number((r as any).servicios?.precio ?? 0), 0),
      citas: reservasSemana.length,
    };
  });

  // Citas por profesional este mes
  const citasPorProfesional = profesionales
    .map((p) => ({
      nombre: p.nombre,
      color: p.color,
      citas: reservasMes.filter((r) => r.profesional_id === p.id && r.estado !== "cancelada").length,
    }))
    .sort((a, b) => b.citas - a.citas);

  // Top servicios
  const serviciosCount: Record<string, { nombre: string; count: number }> = {};
  reservasMes.filter((r) => r.estado !== "cancelada").forEach((r) => {
    const nombre = (r as any).servicios?.nombre ?? "Desconocido";
    if (!serviciosCount[nombre]) serviciosCount[nombre] = { nombre, count: 0 };
    serviciosCount[nombre].count++;
  });
  const topServicios = Object.values(serviciosCount).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-[#e8c5ce] p-5">
            <p className="text-xs text-[#6b6360] mb-1">{c.label}</p>
            <p className="font-heading text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs text-[#6b6360] mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfica de línea: ingresos 8 semanas */}
      <div className="bg-white rounded-2xl border border-[#e8c5ce] p-5">
        <h3 className="font-semibold text-[#1a1412] mb-4">Ingresos últimas 8 semanas</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={semanas} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f1ef" />
            <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#6b6360" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6b6360" }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e8c5ce", fontSize: 12 }}
              formatter={(v) => [`${Number(v ?? 0).toFixed(2)} €`, "Ingresos"]}
            />
            <Line
              type="monotone"
              dataKey="ingresos"
              stroke="#C4728A"
              strokeWidth={2.5}
              dot={{ fill: "#C4728A", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Citas por profesional */}
        <div className="bg-white rounded-2xl border border-[#e8c5ce] p-5">
          <h3 className="font-semibold text-[#1a1412] mb-4">Citas por profesional (este mes)</h3>
          {citasPorProfesional.every((p) => p.citas === 0) ? (
            <p className="text-sm text-[#6b6360] text-center py-8">Sin datos este mes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={citasPorProfesional} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f1ef" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: "#6b6360" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6b6360" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e8c5ce", fontSize: 12 }}
                  formatter={(v) => [`${v} citas`, "Citas"]}
                />
                <Bar dataKey="citas" radius={[6, 6, 0, 0]}>
                  {citasPorProfesional.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Servicios más solicitados */}
        <div className="bg-white rounded-2xl border border-[#e8c5ce] p-5">
          <h3 className="font-semibold text-[#1a1412] mb-4">Servicios más solicitados</h3>
          {topServicios.length === 0 ? (
            <p className="text-sm text-[#6b6360] text-center py-8">Sin datos este mes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topServicios} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f1ef" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6b6360" }} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: "#6b6360" }} width={130} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e8c5ce", fontSize: 12 }}
                  formatter={(v) => [`${v} veces`, "Solicitudes"]}
                />
                <Bar dataKey="count" fill="#C4728A" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
