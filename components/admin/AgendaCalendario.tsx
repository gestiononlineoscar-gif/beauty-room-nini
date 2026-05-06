"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import {
  format, parse, startOfWeek, endOfWeek, startOfMonth,
  endOfMonth, startOfDay, endOfDay, getDay
} from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Profesional, Reserva, Usuario, BloqueoHorario } from "@/types";
import { CitaModal } from "./CitaModal";
import { NuevaReservaModal } from "./NuevaReservaModal";
import { BloqueoModal } from "./BloqueoModal";
import { toast } from "sonner";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

interface AgendaEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Reserva | BloqueoHorario;
  resourceId: string;
  color: string;
  estado: string;
  tipo: "reserva" | "bloqueo";
}

interface Props {
  profesionales: Profesional[];
  reservasIniciales: Reserva[];
  bloqueosIniciales: BloqueoHorario[];
  usuario: Usuario;
}

function reservaToEvent(r: Reserva, colorPorProf: Record<string, string>): AgendaEvent {
  const base = r.fecha;
  const [h1, m1] = r.hora_inicio.split(":").map(Number);
  const [h2, m2] = r.hora_fin.split(":").map(Number);
  const start = new Date(`${base}T00:00:00`);
  start.setHours(h1, m1, 0, 0);
  const end = new Date(`${base}T00:00:00`);
  end.setHours(h2, m2, 0, 0);
  return {
    id: r.id,
    title: `${r.clientes?.nombre ?? "Cliente"} · ${r.servicios?.nombre ?? "Servicio"}`,
    start, end,
    resource: r,
    resourceId: r.profesional_id ?? "",
    color: colorPorProf[r.profesional_id ?? ""] ?? "#C4728A",
    estado: r.estado,
    tipo: "reserva",
  };
}

function bloqueoToEvent(b: BloqueoHorario, colorPorProf: Record<string, string>): AgendaEvent {
  const base = b.fecha;
  const [h1, m1] = b.hora_inicio.split(":").map(Number);
  const [h2, m2] = b.hora_fin.split(":").map(Number);
  const start = new Date(`${base}T00:00:00`);
  start.setHours(h1, m1, 0, 0);
  const end = new Date(`${base}T00:00:00`);
  end.setHours(h2, m2, 0, 0);
  return {
    id: b.id,
    title: `🔒 ${b.motivo ?? "Bloqueado"}`,
    start, end,
    resource: b,
    resourceId: b.profesional_id,
    color: "#374151",
    estado: "bloqueado",
    tipo: "bloqueo",
  };
}

export function AgendaCalendario({ profesionales, reservasIniciales, bloqueosIniciales, usuario }: Props) {
  const [reservas, setReservas] = useState<Reserva[]>(reservasIniciales);
  const [bloqueos, setBloqueos] = useState<BloqueoHorario[]>(bloqueosIniciales);
  const [view, setView] = useState<View>("week");
  const [fecha, setFecha] = useState(new Date());
  const [cargando, setCargando] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Reserva | null>(null);
  const [bloqueoSeleccionado, setBloqueoSeleccionado] = useState<BloqueoHorario | null>(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState<{ start: Date; end: Date; resourceId?: string | number } | null>(null);
  const [bloqueoModalOpen, setBloqueoModalOpen] = useState(false);
  const [profFiltro, setProfFiltro] = useState<Set<string>>(new Set());

  const colorPorProfesional = useMemo(() => {
    const mapa: Record<string, string> = {};
    profesionales.forEach((p) => { mapa[p.id] = p.color; });
    return mapa;
  }, [profesionales]);

  const cargarDatos = useCallback(async (fecha: Date, vista: View) => {
    let desde: Date, hasta: Date;
    if (vista === "week") {
      desde = startOfWeek(fecha, { weekStartsOn: 1 });
      hasta = endOfWeek(fecha, { weekStartsOn: 1 });
    } else if (vista === "month") {
      desde = startOfMonth(fecha);
      hasta = endOfMonth(fecha);
    } else {
      desde = startOfDay(fecha);
      hasta = endOfDay(fecha);
    }
    const desdeStr = format(desde, "yyyy-MM-dd");
    const hastaStr = format(hasta, "yyyy-MM-dd");
    setCargando(true);
    try {
      const [resReservas, resBloqueos] = await Promise.all([
        fetch(`/api/reservas?desde=${desdeStr}&hasta=${hastaStr}`),
        fetch(`/api/bloqueos?desde=${desdeStr}&hasta=${hastaStr}`),
      ]);
      const [dataReservas, dataBloqueos] = await Promise.all([resReservas.json(), resBloqueos.json()]);
      if (Array.isArray(dataReservas)) setReservas(dataReservas);
      if (Array.isArray(dataBloqueos)) setBloqueos(dataBloqueos);
    } finally {
      setCargando(false);
    }
  }, []);

  const handleNavigate = useCallback((newDate: Date) => {
    setFecha(newDate);
    cargarDatos(newDate, view);
  }, [view, cargarDatos]);

  const handleView = useCallback((newView: View) => {
    setView(newView);
    cargarDatos(fecha, newView);
  }, [fecha, cargarDatos]);

  const profsFiltradas = useMemo(
    () => profFiltro.size === 0 ? profesionales : profesionales.filter((p) => profFiltro.has(p.id)),
    [profFiltro, profesionales]
  );

  const profIdsFiltradas = useMemo(() => new Set(profsFiltradas.map((p) => p.id)), [profsFiltradas]);

  const events = useMemo<AgendaEvent[]>(() => [
    ...reservas
      .filter((r) => r.estado !== "cancelada" && (profFiltro.size === 0 || profIdsFiltradas.has(r.profesional_id ?? "")))
      .map((r) => reservaToEvent(r, colorPorProfesional)),
    ...bloqueos
      .filter((b) => profFiltro.size === 0 || profIdsFiltradas.has(b.profesional_id))
      .map((b) => bloqueoToEvent(b, colorPorProfesional)),
  ], [reservas, bloqueos, colorPorProfesional, profFiltro, profIdsFiltradas]);

  const eventStyleGetter = useCallback((event: AgendaEvent) => {
    if (event.tipo === "bloqueo") {
      return {
        style: {
          background: "rgba(55,65,81,0.75)",
          backdropFilter: "blur(8px)",
          borderRadius: "6px",
          border: "1.5px dashed #6b7280",
          color: "#e5e7eb",
          fontSize: "11px",
          padding: "2px 6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }
      };
    }
    const { color, estado } = event;
    let style: React.CSSProperties = {
      background: `linear-gradient(135deg, ${color}dd, ${color}bb)`,
      backdropFilter: "blur(8px)",
      borderRadius: "6px",
      border: `1px solid ${color}80`,
      color: "#fff",
      fontSize: "12px",
      padding: "2px 6px",
      boxShadow: `0 4px 12px ${color}50`,
    };
    if (estado === "pendiente") {
      style = {
        ...style,
        background: `linear-gradient(135deg, ${color}55, ${color}33)`,
        border: `1.5px dashed ${color}`,
        color: "#1a1412",
        boxShadow: `0 2px 8px ${color}30`,
      };
    } else if (estado === "completada") {
      style = {
        ...style,
        background: "rgba(156,163,175,0.7)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(156,163,175,0.4)",
        boxShadow: "none",
      };
    }
    return { style };
  }, []);

  function handleSelectEvent(event: AgendaEvent) {
    if (event.tipo === "bloqueo") {
      setBloqueoSeleccionado(event.resource as BloqueoHorario);
    } else {
      setCitaSeleccionada(event.resource as Reserva);
    }
  }

  async function eliminarBloqueo(id: string) {
    const res = await fetch(`/api/bloqueos?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setBloqueos((prev) => prev.filter((b) => b.id !== id));
      setBloqueoSeleccionado(null);
      toast.success("Bloqueo eliminado");
    } else {
      toast.error("Error al eliminar el bloqueo");
    }
  }

  function onReservaCreada(nueva: Reserva) {
    setReservas((prev) => [...prev, nueva]);
    setSlotSeleccionado(null);
  }

  function onReservaActualizada(actualizada: Reserva) {
    setReservas((prev) => prev.map((r) => r.id === actualizada.id ? actualizada : r));
    setCitaSeleccionada(null);
  }

  function onReservaEliminada(id: string) {
    setReservas((prev) => prev.filter((r) => r.id !== id));
    setCitaSeleccionada(null);
  }

  function onBloqueoCreado(bloqueo: BloqueoHorario) {
    setBloqueos((prev) => [...prev, bloqueo]);
  }

  const mensajes = {
    today: "Hoy", previous: "‹", next: "›",
    month: "Mes", week: "Semana", day: "Día", agenda: "Lista",
    date: "Fecha", time: "Hora", event: "Cita",
    noEventsInRange: "Sin citas en este período",
    showMore: (n: number) => `+${n} más`,
  };

  const minHour = new Date(); minHour.setHours(9, 30, 0, 0);
  const maxHour = new Date(); maxHour.setHours(20, 30, 0, 0);
  const isDayView = view === "day";

  const profesionalPreseleccionada = slotSeleccionado?.resourceId
    ? profesionales.find((p) => p.id === String(slotSeleccionado.resourceId)) ?? null
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1412] to-[#2d1820] border-b border-[rgba(196,114,138,0.2)] flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setProfFiltro(new Set())}
            className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 transition-all border ${
              profFiltro.size === 0
                ? "bg-white text-[#1a1412] border-white"
                : "bg-white/10 text-white/60 border-white/20 hover:bg-white/20"
            }`}
          >
            Todas
          </button>
          {profesionales.map((p) => {
            const activa = profFiltro.size === 0 || profFiltro.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => {
                  setProfFiltro((prev) => {
                    const next = new Set(prev.size === 0 ? profesionales.map((x) => x.id) : prev);
                    if (next.has(p.id)) {
                      next.delete(p.id);
                      if (next.size === 0 || next.size === profesionales.length) return new Set();
                    } else {
                      next.add(p.id);
                      if (next.size === profesionales.length) return new Set();
                    }
                    return next;
                  });
                }}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 transition-all"
                style={{
                  backgroundColor: activa ? p.color + "30" : "rgba(255,255,255,0.05)",
                  color: activa ? p.color : "rgba(255,255,255,0.35)",
                  border: `1px solid ${activa ? p.color + "60" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: activa ? p.color : "rgba(255,255,255,0.2)" }} />
                {p.nombre}
              </button>
            );
          })}
          {cargando && (
            <span className="flex items-center gap-1.5 text-xs text-white/50">
              <span className="w-3 h-3 rounded-full border border-[#C4728A] border-t-transparent animate-spin inline-block" />
              Actualizando...
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => {
              const ahora = new Date();
              const fin = new Date(ahora.getTime() + 30 * 60 * 1000);
              setSlotSeleccionado({ start: ahora, end: fin });
            }}
            className="flex items-center gap-1.5 text-xs bg-[#C4728A] hover:bg-[#a85a72] text-white px-3 py-2 rounded-xl transition-colors"
          >
            ➕ Walk-in
          </button>
          <button
            onClick={() => setBloqueoModalOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-[#1a1412] hover:bg-[#2d2220] text-white px-3 py-2 rounded-xl transition-colors"
          >
            🔒 Bloquear
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="flex-1 p-4 overflow-hidden min-h-0">
        <div className="h-full bg-white rounded-2xl border border-[#e8c5ce] overflow-hidden shadow-sm">
          <Calendar
            localizer={localizer}
            events={events}
            view={view}
            onView={handleView}
            date={fecha}
            onNavigate={handleNavigate}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={(slotInfo) =>
              setSlotSeleccionado({ start: slotInfo.start, end: slotInfo.end, resourceId: slotInfo.resourceId })
            }
            selectable
            min={minHour}
            max={maxHour}
            step={30}
            timeslots={1}
            culture="es"
            messages={mensajes}
            style={{ height: "100%" }}
            {...(isDayView ? {
              resources: profsFiltradas,
              resourceIdAccessor: "id",
              resourceTitleAccessor: "nombre",
            } : {})}
            formats={{
              timeGutterFormat: (date: Date) => format(date, "HH:mm"),
              eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
                `${format(start, "HH:mm")}–${format(end, "HH:mm")}`,
              dayHeaderFormat: (date: Date) => format(date, "EEE d MMM", { locale: es }),
              monthHeaderFormat: (date: Date) => format(date, "MMMM yyyy", { locale: es }),
              dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
                `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`,
            }}
          />
        </div>
      </div>

      {/* Modal cita */}
      {citaSeleccionada && (
        <CitaModal
          reserva={citaSeleccionada}
          profesionales={profesionales}
          open={!!citaSeleccionada}
          onClose={() => setCitaSeleccionada(null)}
          onActualizada={onReservaActualizada}
          onEliminada={onReservaEliminada}
        />
      )}

      {/* Modal nueva reserva */}
      {slotSeleccionado && (
        <NuevaReservaModal
          open={!!slotSeleccionado}
          onClose={() => setSlotSeleccionado(null)}
          fechaInicial={slotSeleccionado.start}
          profesionales={profesionales}
          profesionalPreseleccionada={profesionalPreseleccionada}
          onCreada={onReservaCreada}
        />
      )}

      {/* Modal bloqueo desde botón */}
      {bloqueoModalOpen && (
        <BloqueoModal
          open={bloqueoModalOpen}
          onClose={() => setBloqueoModalOpen(false)}
          fechaInicial={fecha}
          profesionales={profesionales}
          onCreado={onBloqueoCreado}
        />
      )}

      {/* Popup bloqueo seleccionado */}
      {bloqueoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setBloqueoSeleccionado(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-heading text-lg text-[#1a1412] mb-1">🔒 Bloqueo de horario</p>
            <p className="text-sm text-[#6b6360] mb-1">
              {bloqueoSeleccionado.fecha} · {bloqueoSeleccionado.hora_inicio.slice(0,5)}–{bloqueoSeleccionado.hora_fin.slice(0,5)}
            </p>
            {bloqueoSeleccionado.motivo && (
              <p className="text-sm text-[#1a1412] mb-4">{bloqueoSeleccionado.motivo}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setBloqueoSeleccionado(null)}
                className="flex-1 border border-[#e8c5ce] text-[#6b6360] py-2 rounded-xl text-sm hover:bg-[#f4f1ef] transition-colors">
                Cerrar
              </button>
              <button onClick={() => eliminarBloqueo(bloqueoSeleccionado.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm transition-colors">
                Eliminar bloqueo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
