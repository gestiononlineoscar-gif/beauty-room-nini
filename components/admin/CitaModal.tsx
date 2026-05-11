"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Reserva, Profesional, EstadoReserva, Servicio, ServicioVariante } from "@/types";
import { CATEGORIAS_SERVICIOS } from "@/types";
import { Check, X, Pencil, Clock, Euro, User, Scissors, Banknote, CreditCard, Save, UserX } from "lucide-react";

const METODOS_PAGO = ["Efectivo", "Tarjeta", "Bizum"] as const;
type MetodoPago = (typeof METODOS_PAGO)[number];

const COLORES_ESTADO: Record<EstadoReserva, string> = {
  pendiente:      "bg-amber-100 text-amber-700 border-amber-200",
  confirmada:     "bg-green-100 text-green-700 border-green-200",
  completada:     "bg-gray-100 text-gray-600 border-gray-200",
  cancelada:      "bg-red-100 text-red-600 border-red-200",
  no_presentada:  "bg-orange-100 text-orange-700 border-orange-200",
};

const LABELS_ESTADO: Record<EstadoReserva, string> = {
  pendiente:     "Pendiente",
  confirmada:    "Confirmada",
  completada:    "Completada",
  cancelada:     "Cancelada",
  no_presentada: "No presentada",
};

interface Props {
  reserva: Reserva;
  profesionales: Profesional[];
  open: boolean;
  onClose: () => void;
  onActualizada: (r: Reserva) => void;
  onEliminada: (id: string) => void;
}

function calcularHoraFin(inicio: string, duracion: number): string {
  const [h, m] = inicio.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return inicio;
  const total = h * 60 + m + duracion;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function CitaModal({ reserva, profesionales, open, onClose, onActualizada, onEliminada }: Props) {
  const [loading, setLoading] = useState(false);
  const [notas, setNotas] = useState(reserva.notas ?? "");
  const [editandoNotas, setEditandoNotas] = useState(false);
  const [pagado, setPagado] = useState(reserva.pagado ?? false);
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">(
    (reserva.metodo_pago as MetodoPago) ?? ""
  );
  const [historial, setHistorial] = useState<Reserva[] | null>(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // Edit mode
  const [editando, setEditando] = useState(false);
  const [editFecha, setEditFecha] = useState(reserva.fecha);
  const [editHoraInicio, setEditHoraInicio] = useState(reserva.hora_inicio.slice(0, 5));
  const [editHoraFin, setEditHoraFin] = useState(reserva.hora_fin.slice(0, 5));
  const [editProfId, setEditProfId] = useState(reserva.profesional_id ?? "");
  const [editServicioId, setEditServicioId] = useState(reserva.servicio_id ?? "");
  const [editVarianteId, setEditVarianteId] = useState(reserva.variante_id ?? "");
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [variantesEdit, setVariantesEdit] = useState<ServicioVariante[]>([]);

  useEffect(() => {
    setNotas(reserva.notas ?? "");
    setEditandoNotas(false);
    setPagado(reserva.pagado ?? false);
    setMetodoPago((reserva.metodo_pago as MetodoPago) ?? "");
    setHistorial(null);
    setMostrarHistorial(false);
    setEditando(false);
    setEditFecha(reserva.fecha);
    setEditHoraInicio(reserva.hora_inicio.slice(0, 5));
    setEditHoraFin(reserva.hora_fin.slice(0, 5));
    setEditProfId(reserva.profesional_id ?? "");
    setEditServicioId(reserva.servicio_id ?? "");
    setEditVarianteId(reserva.variante_id ?? "");
    setVariantesEdit([]);
  }, [reserva.id]);

  // Cargar servicios la primera vez que se abre el formulario de edición
  useEffect(() => {
    if (!editando || servicios.length > 0) return;
    createClient()
      .from("servicios").select("*").eq("activo", true).order("categoria").order("nombre")
      .then(({ data }) => setServicios((data ?? []) as Servicio[]));
  }, [editando]);

  // Cargar variantes cuando cambia el servicio en edición
  useEffect(() => {
    if (!editando || !editServicioId) { setVariantesEdit([]); return; }
    const svc = servicios.find(s => s.id === editServicioId);
    if (!svc?.precio_desde) { setVariantesEdit([]); setEditVarianteId(""); return; }
    createClient()
      .from("servicio_variantes").select("*").eq("servicio_id", editServicioId).order("orden")
      .then(({ data }) => setVariantesEdit((data ?? []) as ServicioVariante[]));
  }, [editServicioId, editando]);

  const profesional = profesionales.find((p) => p.id === reserva.profesional_id);
  const fecha = format(parseISO(reserva.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const duracionServicio = reserva.variante?.duracion_min ?? reserva.servicios?.duracion_min ?? 60;
  const servicioEdit = servicios.find(s => s.id === editServicioId);
  const varianteEdit = variantesEdit.find(v => v.id === editVarianteId);
  const duracionEdit = varianteEdit?.duracion_min ?? servicioEdit?.duracion_min ?? duracionServicio;

  function generarLinkWhatsApp() {
    const tel = reserva.clientes?.telefono ?? "";
    const telLimpio = tel.replace(/\D/g, "").replace(/^0/, "").replace(/^(?!34)/, "34");
    const nombre = reserva.clientes?.nombre?.split(" ")[0] ?? "clienta";
    const servicio = reserva.servicios?.nombre ?? "tu servicio";
    const hora = reserva.hora_inicio.slice(0, 5);
    const fechaCorta = format(parseISO(reserva.fecha), "d 'de' MMMM", { locale: es });

    const mensaje =
      `Hola ${nombre}! Te recordamos tu cita en *Beauty Room Nini*:\n\n` +
      `*Fecha:* ${fechaCorta}\n` +
      `*Hora:* ${hora}h\n` +
      `*Servicio:* ${servicio}\n` +
      (profesional ? `*Con:* ${profesional.nombre}\n` : "") +
      `\n¡Te esperamos! Si necesitas cambiar o cancelar, escríbenos.`;

    return `https://wa.me/${telLimpio}?text=${encodeURIComponent(mensaje)}`;
  }

  async function actualizarEstado(nuevoEstado: EstadoReserva) {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reservas")
      .update({ estado: nuevoEstado })
      .eq("id", reserva.id)
      .select("*, clientes(*), profesionales(*), servicios(*), variante:servicio_variantes(*)")
      .single();

    if (error) {
      toast.error("Error al actualizar la cita");
    } else {
      toast.success(`Cita marcada como ${LABELS_ESTADO[nuevoEstado].toLowerCase()}`);
      onActualizada(data as Reserva);
    }
    setLoading(false);
  }

  async function guardarEdicion() {
    if (!editHoraInicio || !editHoraFin || !editFecha) return;
    if (editHoraFin <= editHoraInicio) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    // Verificar solapamientos con otras citas del mismo profesional
    if (editProfId) {
      const { data: conflictos } = await supabase
        .from("reservas")
        .select("id, hora_inicio, hora_fin, clientes(nombre), servicios(nombre)")
        .eq("profesional_id", editProfId)
        .eq("fecha", editFecha)
        .neq("id", reserva.id)
        .neq("estado", "cancelada");

      const solapadas = (conflictos ?? []).filter((r) => {
        // Overlap: inicio < rFin && fin > rInicio
        return editHoraInicio + ":00" < r.hora_fin && editHoraFin + ":00" > r.hora_inicio;
      });

      if (solapadas.length > 0) {
        const prof = profesionales.find((p) => p.id === editProfId);
        const detalle = solapadas
          .map((r) => `${r.hora_inicio.slice(0, 5)}–${r.hora_fin.slice(0, 5)} (${(r.clientes as unknown as {nombre:string}|undefined)?.nombre ?? "cliente"})`)
          .join(", ");
        const continuar = confirm(
          `⚠️ Solapamiento con ${prof?.nombre ?? "esta profesional"}:\n${detalle}\n\n¿Guardar igualmente?`
        );
        if (!continuar) {
          setLoading(false);
          return;
        }
      }
    }

    const { data, error } = await supabase
      .from("reservas")
      .update({
        fecha: editFecha,
        hora_inicio: editHoraInicio + ":00",
        hora_fin: editHoraFin + ":00",
        profesional_id: editProfId || null,
        servicio_id: editServicioId || null,
        variante_id: editVarianteId || null,
      })
      .eq("id", reserva.id)
      .select("*, clientes(*), profesionales(*), servicios(*), variante:servicio_variantes(*)")
      .single();

    if (error) {
      toast.error("Error al editar la cita");
    } else {
      toast.success("Cita actualizada");
      setEditando(false);
      onActualizada(data as Reserva);
    }
    setLoading(false);
  }

  async function guardarNotas() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reservas")
      .update({ notas })
      .eq("id", reserva.id)
      .select("*, clientes(*), profesionales(*), servicios(*), variante:servicio_variantes(*)")
      .single();

    if (error) {
      toast.error("Error al guardar notas");
    } else {
      toast.success("Notas guardadas");
      setEditandoNotas(false);
      onActualizada(data as Reserva);
    }
    setLoading(false);
  }

  async function cargarHistorial() {
    if (historial !== null || !reserva.cliente_id) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("reservas")
      .select("*, servicios(*), profesionales(*)")
      .eq("cliente_id", reserva.cliente_id)
      .neq("id", reserva.id)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false })
      .limit(20);
    setHistorial((data ?? []) as Reserva[]);
  }

  async function guardarPago(nuevoPagado: boolean, nuevoMetodo: MetodoPago | "") {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reservas")
      .update({ pagado: nuevoPagado, metodo_pago: nuevoMetodo || null })
      .eq("id", reserva.id)
      .select("*, clientes(*), profesionales(*), servicios(*), variante:servicio_variantes(*)")
      .single();
    if (error) {
      toast.error("Error al actualizar el pago");
    } else {
      setPagado(nuevoPagado);
      setMetodoPago(nuevoMetodo);
      onActualizada(data as Reserva);
    }
    setLoading(false);
  }

  async function cancelarCita() {
    if (!confirm("¿Cancelar esta cita?")) return;
    actualizarEstado("cancelada");
  }

  async function marcarInasistencia() {
    if (!confirm("¿Marcar como inasistencia? La clienta no se presentó a la cita.")) return;
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reservas")
      .update({ estado: "no_presentada" })
      .eq("id", reserva.id)
      .select("*, clientes(*), profesionales(*), servicios(*), variante:servicio_variantes(*)")
      .single();

    if (error) {
      toast.error("Error al actualizar la cita");
      setLoading(false);
      return;
    }

    if (reserva.cliente_id) {
      const { data: cli } = await supabase
        .from("clientes").select("inasistencias").eq("id", reserva.cliente_id).single();
      const total = (cli?.inasistencias ?? 0) + 1;
      await supabase.from("clientes").update({ inasistencias: total }).eq("id", reserva.cliente_id);

      toast.success(`Inasistencia registrada (${total} en total)`);

      if (total >= 2) {
        const bloquear = confirm(
          `Esta clienta lleva ${total} inasistencias. ¿Bloquearla para que no pueda reservar online?`
        );
        if (bloquear) {
          await supabase.from("clientes").update({ bloqueado: true }).eq("id", reserva.cliente_id);
          toast.success("Clienta bloqueada");
        }
      }
    } else {
      toast.success("Inasistencia registrada");
    }

    onActualizada(data as Reserva);
    setLoading(false);
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-[#fdf6f0] border-l border-[#e8c5ce] overflow-y-auto flex flex-col pb-10">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-heading text-xl text-[#1a1412]">Detalle de cita</SheetTitle>
        </SheetHeader>

        {/* Estado badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${COLORES_ESTADO[reserva.estado as EstadoReserva]}`}>
            {LABELS_ESTADO[reserva.estado as EstadoReserva]}
          </span>
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-[#e8c5ce] p-4 space-y-3 mb-4">
          {reserva.clientes && (
            <div className="flex items-start gap-3">
              <User size={16} className="text-[#C4728A] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#6b6360]">Cliente</p>
                <p className="font-medium text-[#1a1412]">{reserva.clientes.nombre}</p>
                {reserva.clientes.telefono && (
                  <p className="text-sm text-[#6b6360]">{reserva.clientes.telefono}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 pt-3 border-t border-[#f4f1ef]">
            <Scissors size={16} className="text-[#C4728A] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[#6b6360]">Servicio</p>
              {editando ? (
                <div className="mt-1 space-y-1.5">
                  <select
                    value={editServicioId}
                    onChange={(e) => {
                      setEditServicioId(e.target.value);
                      setEditVarianteId("");
                      // Recalcular hora_fin con la duración del nuevo servicio
                      const svc = servicios.find(s => s.id === e.target.value);
                      if (svc && editHoraInicio) {
                        setEditHoraFin(calcularHoraFin(editHoraInicio, svc.duracion_min));
                      }
                    }}
                    className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
                  >
                    <option value="">— Sin servicio —</option>
                    {CATEGORIAS_SERVICIOS.map(cat => {
                      const del = servicios.filter(s => s.categoria === cat);
                      if (!del.length) return null;
                      return (
                        <optgroup key={cat} label={cat}>
                          {del.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  {variantesEdit.length > 0 && (
                    <select
                      value={editVarianteId}
                      onChange={(e) => {
                        setEditVarianteId(e.target.value);
                        const v = variantesEdit.find(v => v.id === e.target.value);
                        if (v && editHoraInicio) {
                          setEditHoraFin(calcularHoraFin(editHoraInicio, v.duracion_min));
                        }
                      }}
                      className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
                    >
                      <option value="">— Sin variante —</option>
                      {variantesEdit.map(v => (
                        <option key={v.id} value={v.id}>{v.nombre} · {v.duracion_min} min</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <>
                  <p className="font-medium text-[#1a1412]">{reserva.servicios?.nombre ?? "—"}</p>
                  {reserva.variante && (
                    <p className="text-xs font-medium text-[#C4728A] mt-0.5">{reserva.variante.nombre}</p>
                  )}
                  {reserva.servicios && (
                    <p className="text-sm text-[#6b6360]">{reserva.variante?.duracion_min ?? reserva.servicios.duracion_min} min</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Profesional — view or edit */}
          <div className="flex items-start gap-3 pt-3 border-t border-[#f4f1ef]">
            <div
              className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
              style={{ backgroundColor: editando
                ? (profesionales.find(p => p.id === editProfId)?.color ?? "#e8c5ce")
                : (profesional?.color ?? "#e8c5ce") }}
            />
            <div className="flex-1">
              <p className="text-xs text-[#6b6360]">Profesional</p>
              {editando ? (
                <select
                  value={editProfId}
                  onChange={(e) => setEditProfId(e.target.value)}
                  className="mt-1 w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
                >
                  <option value="">— Sin asignar —</option>
                  {profesionales.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              ) : (
                <p className="font-medium text-[#1a1412]">{profesional?.nombre ?? "—"}</p>
              )}
            </div>
          </div>

          {/* Fecha y hora — view or edit */}
          <div className="flex items-start gap-3 pt-3 border-t border-[#f4f1ef]">
            <Clock size={16} className="text-[#C4728A] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[#6b6360]">Fecha y hora</p>
              {editando ? (
                <div className="mt-1 space-y-2">
                  <input
                    type="date"
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[10px] text-[#6b6360] mb-0.5">Inicio</p>
                      <input
                        type="time"
                        step="300"
                        value={editHoraInicio}
                        onChange={(e) => {
                          setEditHoraInicio(e.target.value);
                          setEditHoraFin(calcularHoraFin(e.target.value, duracionEdit));
                        }}
                        className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
                      />
                    </div>
                    <span className="text-[#6b6360] mt-4">–</span>
                    <div className="flex-1">
                      <p className="text-[10px] text-[#6b6360] mb-0.5">Fin</p>
                      <input
                        type="time"
                        step="300"
                        value={editHoraFin}
                        onChange={(e) => setEditHoraFin(e.target.value)}
                        className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#6b6360]">La hora fin se ajusta automáticamente pero puedes cambiarla manualmente.</p>
                </div>
              ) : (
                <>
                  <p className="font-medium text-[#1a1412] capitalize">{fecha}</p>
                  <p className="text-sm text-[#6b6360]">
                    {reserva.hora_inicio.slice(0, 5)} – {reserva.hora_fin.slice(0, 5)}
                  </p>
                </>
              )}
            </div>
          </div>

          {reserva.servicios && !editando && (
            <div className="flex items-start gap-3 pt-3 border-t border-[#f4f1ef]">
              <Euro size={16} className="text-[#C4728A] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#6b6360]">Precio</p>
                <p className="font-medium text-[#C4728A] text-lg">
                  {reserva.variante
                    ? `${Number(reserva.variante.precio).toFixed(2)} €`
                    : reserva.servicios.precio_desde
                      ? `desde ${Number(reserva.servicios.precio).toFixed(0)} €`
                      : `${Number(reserva.servicios.precio).toFixed(2)} €`}
                </p>
              </div>
            </div>
          )}

          {/* Edit action row */}
          {editando ? (
            <div className="flex gap-2 pt-3 border-t border-[#f4f1ef]">
              <button
                onClick={guardarEdicion}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#C4728A] text-white text-sm py-2 rounded-xl hover:bg-[#a85a72] transition-colors disabled:opacity-50"
              >
                <Save size={14} /> Guardar cambios
              </button>
              <button
                onClick={() => {
                  setEditando(false);
                  setEditFecha(reserva.fecha);
                  setEditHoraInicio(reserva.hora_inicio.slice(0, 5));
                  setEditHoraFin(reserva.hora_fin.slice(0, 5));
                  setEditProfId(reserva.profesional_id ?? "");
                  setEditServicioId(reserva.servicio_id ?? "");
                  setEditVarianteId(reserva.variante_id ?? "");
                  setVariantesEdit([]);
                }}
                className="px-4 text-sm border border-[#e8c5ce] rounded-xl hover:bg-[#f4f1ef] transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditando(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-[#6b6360] hover:text-[#C4728A] pt-3 border-t border-[#f4f1ef] transition-colors"
            >
              <Pencil size={12} /> Editar cita
            </button>
          )}
        </div>

        {/* Estado de pago */}
        <div className="bg-white rounded-2xl border border-[#e8c5ce] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {pagado
                ? <Banknote size={16} className="text-green-600" />
                : <Euro size={16} className="text-[#C4728A]" />
              }
              <span className="text-sm font-medium text-[#1a1412]">Pago</span>
            </div>
            <button
              onClick={() => {
                const next = !pagado;
                setPagado(next);
                guardarPago(next, metodoPago);
              }}
              disabled={loading}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                pagado
                  ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                  : "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200"
              }`}
            >
              {pagado ? "✓ Pagado" : "Pendiente de pago"}
            </button>
          </div>
          {pagado && (
            <div className="flex gap-2">
              {METODOS_PAGO.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMetodoPago(m);
                    guardarPago(true, m);
                  }}
                  disabled={loading}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${
                    metodoPago === m
                      ? "bg-[#C4728A] text-white border-[#C4728A]"
                      : "bg-[#fdf6f0] text-[#6b6360] border-[#e8c5ce] hover:border-[#C4728A]"
                  }`}
                >
                  {m === "Efectivo" && <Banknote size={12} />}
                  {m === "Tarjeta" && <CreditCard size={12} />}
                  {m === "Bizum" && <span className="text-[10px] font-bold">B</span>}
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[#1a1412]">Notas</p>
            {!editandoNotas && (
              <button
                onClick={() => setEditandoNotas(true)}
                className="text-xs text-[#C4728A] hover:underline flex items-center gap-1"
              >
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>
          {editandoNotas ? (
            <div>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full border border-[#e8c5ce] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white resize-none"
                rows={3}
                placeholder="Añade notas sobre esta cita..."
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={guardarNotas}
                  disabled={loading}
                  className="flex-1 bg-[#C4728A] text-white text-sm py-2 rounded-xl hover:bg-[#a85a72] transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setEditandoNotas(false); setNotas(reserva.notas ?? ""); }}
                  className="px-4 text-sm border border-[#e8c5ce] rounded-xl hover:bg-[#f4f1ef] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#6b6360] bg-white rounded-xl border border-[#e8c5ce] p-3 min-h-[60px]">
              {reserva.notas || <span className="italic opacity-50">Sin notas</span>}
            </p>
          )}
        </div>

        {/* Historial cliente */}
        {reserva.cliente_id && (
          <div className="mb-4">
            <button
              onClick={() => {
                if (!mostrarHistorial) cargarHistorial();
                setMostrarHistorial((v) => !v);
              }}
              className="w-full flex items-center justify-between text-sm font-medium text-[#1a1412] bg-white border border-[#e8c5ce] rounded-2xl px-4 py-3 hover:border-[#C4728A] transition-colors"
            >
              <span className="flex items-center gap-2">
                <User size={14} className="text-[#C4728A]" />
                Historial de {reserva.clientes?.nombre?.split(" ")[0] ?? "cliente"}
              </span>
              <span className="text-[#6b6360] text-xs">{mostrarHistorial ? "▲" : "▼"}</span>
            </button>
            {mostrarHistorial && (
              <div className="mt-2 space-y-2">
                {historial === null ? (
                  <p className="text-xs text-[#6b6360] text-center py-3">Cargando...</p>
                ) : historial.length === 0 ? (
                  <p className="text-xs text-[#6b6360] text-center py-3 italic">Sin citas anteriores</p>
                ) : (
                  historial.map((h) => (
                    <div key={h.id} className="bg-white border border-[#f4f1ef] rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-[#1a1412]">
                          {format(parseISO(h.fecha), "d MMM yyyy", { locale: es })} · {h.hora_inicio.slice(0,5)}
                        </p>
                        <p className="text-xs text-[#6b6360]">{h.servicios?.nombre ?? "—"} · {(h.profesionales as Profesional | undefined)?.nombre ?? "—"}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${COLORES_ESTADO[h.estado as EstadoReserva]}`}>
                        {LABELS_ESTADO[h.estado as EstadoReserva]}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Recordatorio WhatsApp */}
        {reserva.clientes?.telefono && reserva.estado !== "cancelada" && (
          <a
            href={generarLinkWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mb-3 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white py-2.5 rounded-xl font-medium transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar recordatorio por WhatsApp
          </a>
        )}

        {/* Acciones */}
        {reserva.estado !== "cancelada" && reserva.estado !== "completada" && reserva.estado !== "no_presentada" && (
          <div className="space-y-2">
            {reserva.estado === "pendiente" && (
              <button
                onClick={() => actualizarEstado("confirmada")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#4a9b6f] hover:bg-[#3a8060] text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <Check size={16} /> Confirmar cita
              </button>
            )}
            <button
              onClick={() => actualizarEstado("completada")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#2B5BA8] hover:bg-[#1e4a90] text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <Check size={16} /> Marcar completada
            </button>
            <button
              onClick={marcarInasistencia}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-orange-200 text-orange-600 hover:bg-orange-50 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <UserX size={16} /> Marcar inasistencia
            </button>
            <button
              onClick={cancelarCita}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <X size={16} /> Cancelar cita
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
