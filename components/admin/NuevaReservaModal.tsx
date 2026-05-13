"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addMinutes, parse } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Profesional, Servicio, Reserva, SlotDisponible, ServicioVariante } from "@/types";

interface ClienteSugerencia {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
}

interface LineaServicio {
  uid: string;
  servicioId: string;
  varianteId: string;
  servicio: Servicio;
  variantes: ServicioVariante[];
  duracion: number;
  precio: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  fechaInicial: Date;
  profesionales: Profesional[];
  profesionalPreseleccionada?: Profesional | null;
  onCreada: (r: Reserva) => void;
}

let uidCounter = 0;
function genUid() { return `linea-${++uidCounter}`; }

export function NuevaReservaModal({ open, onClose, fechaInicial, profesionales, profesionalPreseleccionada, onCreada }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cliente
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [sugerencias, setSugerencias] = useState<ClienteSugerencia[]>([]);
  const [mostrarSug, setMostrarSug] = useState(false);
  const sugRef = useRef<HTMLDivElement>(null);

  // Multi-servicio (picker inline, nunca absolute)
  const [lineas, setLineas] = useState<LineaServicio[]>([]);
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [busquedaServicio, setBusquedaServicio] = useState("");
  const busquedaRef = useRef<HTMLInputElement>(null);

  // Profesional / fecha
  const [profesionalId, setProfesionalId] = useState(profesionalPreseleccionada?.id ?? "");
  const [fecha, setFecha] = useState(format(fechaInicial, "yyyy-MM-dd"));

  // Hora
  const [horaManual, setHoraManual] = useState(false);
  const [horaInicioManual, setHoraInicioManual] = useState(
    format(fechaInicial, "HH:mm") !== "00:00" ? format(fechaInicial, "HH:mm") : "10:00"
  );
  const [horaFinManual, setHoraFinManual] = useState("");
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);

  const totalDuracion = lineas.reduce((sum, l) => sum + l.duracion, 0);
  const totalPrecio = lineas.reduce((sum, l) => sum + l.precio, 0);
  const lineasSinVariante = lineas.filter((l) => l.servicio.precio_desde && !l.varianteId);
  const listo = lineas.length > 0 && totalDuracion > 0 && lineasSinVariante.length === 0;

  // Reset al abrir
  useEffect(() => {
    if (!open) return;
    setClienteNombre("");
    setClienteTelefono("");
    setClienteEmail("");
    setSugerencias([]);
    setMostrarSug(false);
    setLineas([]);
    setPickerAbierto(false);
    setBusquedaServicio("");
    setProfesionalId(profesionalPreseleccionada?.id ?? "");
    setFecha(format(fechaInicial, "yyyy-MM-dd"));
    setHoraManual(false);
    setHoraInicioManual(
      format(fechaInicial, "HH:mm") !== "00:00" ? format(fechaInicial, "HH:mm") : "10:00"
    );
    setHoraFinManual("");
    setSlotSeleccionado(null);
    setSlots([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fetch lista de servicios
  useEffect(() => {
    fetch("/api/servicios")
      .then((r) => r.json())
      .then((data) => setServicios(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Fetch slots cuando hay todo lo necesario
  useEffect(() => {
    if (horaManual) return;
    setSlots([]);
    setSlotSeleccionado(null);
    if (!profesionalId || !fecha || !listo) return;
    setLoadingSlots(true);
    fetch(`/api/slots?profesional_id=${profesionalId}&fecha=${fecha}&duracion_min=${totalDuracion}`)
      .then((r) => r.json())
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalId, fecha, totalDuracion, listo, horaManual]);

  // Hora fin automática en modo manual
  useEffect(() => {
    if (!horaManual || !horaInicioManual || totalDuracion === 0) return;
    try {
      const base = new Date();
      const ini = parse(horaInicioManual, "HH:mm", base);
      setHoraFinManual(format(addMinutes(ini, totalDuracion), "HH:mm"));
    } catch {}
  }, [horaInicioManual, totalDuracion, horaManual]);

  // Autocomplete clientes
  useEffect(() => {
    const q = clienteTelefono.length >= 3 ? clienteTelefono : clienteNombre.length >= 3 ? clienteNombre : "";
    if (!q) { setSugerencias([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => setSugerencias(Array.isArray(data) ? data : []))
        .catch(() => setSugerencias([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [clienteTelefono, clienteNombre]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) setMostrarSug(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Abrir picker y hacer focus en el buscador
  function abrirPicker() {
    setPickerAbierto(true);
    setBusquedaServicio("");
    setTimeout(() => busquedaRef.current?.focus(), 50);
  }

  function seleccionarCliente(c: ClienteSugerencia) {
    setClienteNombre(c.nombre);
    setClienteTelefono(c.telefono);
    setClienteEmail(c.email ?? "");
    setSugerencias([]);
    setMostrarSug(false);
  }

  async function agregarServicio(servicio: Servicio) {
    setBusquedaServicio("");
    setSlotSeleccionado(null);
    // Mantener el picker abierto para añadir más servicios fácilmente
    busquedaRef.current?.focus();

    let variantes: ServicioVariante[] = [];
    if (servicio.precio_desde) {
      try {
        const res = await fetch(`/api/servicio-variantes?servicio_id=${servicio.id}`);
        const data = await res.json();
        if (Array.isArray(data)) variantes = data;
      } catch {}
    }

    setLineas((prev) => [
      ...prev,
      {
        uid: genUid(),
        servicioId: servicio.id,
        varianteId: "",
        servicio,
        variantes,
        duracion: servicio.precio_desde ? 0 : servicio.duracion_min,
        precio: servicio.precio_desde ? 0 : Number(servicio.precio),
      },
    ]);
  }

  function cambiarVariante(uid: string, varianteId: string) {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.uid !== uid) return l;
        const v = l.variantes.find((v) => v.id === varianteId);
        return { ...l, varianteId, duracion: v?.duracion_min ?? 0, precio: v ? Number(v.precio) : 0 };
      })
    );
    setSlotSeleccionado(null);
  }

  function eliminarLinea(uid: string) {
    setLineas((prev) => prev.filter((l) => l.uid !== uid));
    setSlotSeleccionado(null);
  }

  const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const serviciosFiltrados = servicios.filter(
    (s) => !busquedaServicio || normalize(s.nombre).includes(normalize(busquedaServicio))
  );

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();

    if (lineas.length === 0) { toast.error("Añade al menos un servicio"); return; }
    if (lineasSinVariante.length > 0) { toast.error("Selecciona el tamaño de todos los servicios"); return; }
    if (!profesionalId) { toast.error("Selecciona una profesional"); return; }
    if (!horaManual && !slotSeleccionado) { toast.error("Selecciona una hora"); return; }
    if (horaManual && (!horaInicioManual || !horaFinManual)) { toast.error("Introduce hora de inicio y fin"); return; }
    if (horaManual && horaFinManual <= horaInicioManual) { toast.error("La hora de fin debe ser posterior a la de inicio"); return; }

    if (!clienteTelefono && !clienteNombre) {
      toast.error("Introduce al menos el nombre o teléfono del cliente");
      return;
    }

    setLoading(true);

    const resCliente = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: clienteNombre, telefono: clienteTelefono, email: clienteEmail }),
    });
    if (!resCliente.ok) { toast.error("Error al registrar el cliente"); setLoading(false); return; }
    const clienteData = await resCliente.json();
    const clienteId: string = clienteData.id;

    const horaInicio = horaManual ? horaInicioManual + ":00" : slotSeleccionado!.hora_inicio + ":00";
    const horaFin    = horaManual ? horaFinManual    + ":00" : slotSeleccionado!.hora_fin    + ":00";

    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();

    const primera = lineas[0];
    const { data: reserva, error } = await supabase
      .from("reservas")
      .insert({
        cliente_id: clienteId,
        profesional_id: profesionalId,
        servicio_id: primera.servicioId,
        variante_id: primera.varianteId || null,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: "confirmada",
      })
      .select("*, clientes(*), profesionales(*), servicios(*), variante:servicio_variantes(*)")
      .single();

    if (error) { toast.error("Error al crear la reserva"); setLoading(false); return; }

    if (lineas.length > 1) {
      const { error: errLineas } = await supabase.from("reserva_servicios").insert(
        lineas.map((l, i) => ({
          reserva_id: reserva.id,
          servicio_id: l.servicioId,
          variante_id: l.varianteId || null,
          orden: i,
        }))
      );
      if (errLineas) console.error("reserva_servicios:", errLineas.message);
    }

    toast.success("Reserva creada correctamente");
    onCreada(reserva as Reserva);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#fdf6f0] border border-[#e8c5ce] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-[#1a1412]">Nueva reserva</DialogTitle>
          <p className="text-sm text-[#6b6360]">
            {format(fechaInicial, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </DialogHeader>

        <form onSubmit={handleCrear} className="space-y-4 mt-2">
          {/* Cliente */}
          <div className="bg-white rounded-xl border border-[#e8c5ce] p-4 space-y-3">
            <p className="text-sm font-semibold text-[#1a1412]">Datos del cliente</p>

            <div className="relative" ref={sugRef}>
              <Label className="text-xs text-[#6b6360]">Teléfono</Label>
              <Input
                value={clienteTelefono}
                onChange={(e) => { setClienteTelefono(e.target.value); setMostrarSug(true); }}
                onFocus={() => sugerencias.length > 0 && setMostrarSug(true)}
                placeholder="600 000 000"
                className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
                autoComplete="off"
              />
              {mostrarSug && sugerencias.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e8c5ce] rounded-xl shadow-lg overflow-hidden">
                  {sugerencias.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => seleccionarCliente(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#f7e8ed] transition-colors border-b border-[#f4f1ef] last:border-0"
                    >
                      <span className="font-medium text-[#1a1412]">{c.nombre}</span>
                      <span className="text-[#6b6360] ml-2">{c.telefono}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-[#6b6360]">Nombre *</Label>
              <Input
                value={clienteNombre}
                onChange={(e) => { setClienteNombre(e.target.value); setMostrarSug(true); }}
                onFocus={() => sugerencias.length > 0 && setMostrarSug(true)}
                placeholder="Nombre completo"
                required
                className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
                autoComplete="off"
              />
            </div>

            <div>
              <Label className="text-xs text-[#6b6360]">Email</Label>
              <Input
                type="email"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
              />
            </div>
          </div>

          {/* Servicios */}
          <div className="space-y-2">
            <Label className="text-xs text-[#6b6360]">Servicios *</Label>

            {/* Servicios añadidos */}
            {lineas.map((l) => (
              <div key={l.uid} className="bg-white rounded-xl border border-[#e8c5ce] p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1412] truncate">{l.servicio.nombre}</p>
                    {!l.servicio.precio_desde && (
                      <p className="text-xs text-[#6b6360]">{l.duracion} min · {l.precio.toFixed(2)} €</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarLinea(l.uid)}
                    className="text-[#6b6360] hover:text-red-500 transition-colors text-xl leading-none flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
                {l.servicio.precio_desde && l.variantes.length > 0 && (
                  <select
                    value={l.varianteId}
                    onChange={(e) => cambiarVariante(l.uid, e.target.value)}
                    className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#C4728A]"
                  >
                    <option value="">Selecciona tamaño...</option>
                    {l.variantes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre} — {v.duracion_min} min — {Number(v.precio).toFixed(2)} €
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            {/* Totales */}
            {listo && (
              <div className="flex justify-between text-xs text-[#6b6360] px-1">
                <span>{lineas.length} servicio{lineas.length > 1 ? "s" : ""} · {totalDuracion} min en total</span>
                <span className="font-semibold text-[#1a1412]">{totalPrecio.toFixed(2)} €</span>
              </div>
            )}

            {/* Picker inline — nunca con position absolute para evitar recorte del modal */}
            {pickerAbierto ? (
              <div className="border border-[#C4728A] rounded-xl overflow-hidden bg-white">
                <div className="p-2 border-b border-[#f4f1ef]">
                  <Input
                    ref={busquedaRef}
                    placeholder="Buscar servicio..."
                    value={busquedaServicio}
                    onChange={(e) => setBusquedaServicio(e.target.value)}
                    className="border-[#e8c5ce] focus-visible:ring-[#C4728A] text-sm"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {serviciosFiltrados.length === 0 && (
                    <p className="text-xs text-[#6b6360] px-3 py-4 text-center">Sin resultados</p>
                  )}
                  {serviciosFiltrados.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => agregarServicio(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[#f7e8ed] transition-colors border-b border-[#f4f1ef] last:border-0"
                    >
                      <span className="font-medium text-[#1a1412]">{s.nombre}</span>
                      <span className="text-xs text-[#6b6360] ml-2">
                        {s.precio_desde
                          ? `desde ${Number(s.precio).toFixed(0)} €`
                          : `${Number(s.precio).toFixed(2)} €`}
                        {" · "}{s.duracion_min} min
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPickerAbierto(false)}
                  className="w-full text-xs text-[#6b6360] py-2 hover:bg-[#f4f1ef] transition-colors border-t border-[#f4f1ef]"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={abrirPicker}
                className="w-full border border-dashed border-[#C4728A] text-[#C4728A] rounded-xl py-2 text-sm hover:bg-[#f7e8ed] transition-colors"
              >
                + Añadir servicio
              </button>
            )}
          </div>

          {/* Profesional */}
          <div>
            <Label className="text-xs text-[#6b6360]">Profesional *</Label>
            <select
              value={profesionalId}
              onChange={(e) => { setProfesionalId(e.target.value); setSlotSeleccionado(null); }}
              required
              className="mt-1 w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
            >
              <option value="">Selecciona una profesional...</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <Label className="text-xs text-[#6b6360]">Fecha *</Label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); setSlotSeleccionado(null); }}
              required
              className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
            />
          </div>

          {/* Toggle hora manual */}
          <label className="flex items-center gap-2 text-sm text-[#6b6360] cursor-pointer">
            <input
              type="checkbox"
              checked={horaManual}
              onChange={(e) => { setHoraManual(e.target.checked); setSlotSeleccionado(null); }}
              className="rounded accent-[#C4728A]"
            />
            Poner hora manual (fuera de horario del salón)
          </label>

          {horaManual && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#6b6360]">Desde *</Label>
                <Input
                  type="time"
                  value={horaInicioManual}
                  onChange={(e) => setHoraInicioManual(e.target.value)}
                  required
                  className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#6b6360]">Hasta (calculado)</Label>
                <Input
                  type="time"
                  value={horaFinManual}
                  onChange={(e) => setHoraFinManual(e.target.value)}
                  className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
                />
              </div>
            </div>
          )}

          {/* Slots */}
          {!horaManual && listo && (
            <div>
              <Label className="text-xs text-[#6b6360]">Hora disponible *</Label>
              {loadingSlots ? (
                <p className="text-xs text-[#6b6360] text-center py-3">Buscando horas...</p>
              ) : slots.length > 0 ? (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.hora_inicio}
                      type="button"
                      disabled={!slot.disponible}
                      onClick={() => setSlotSeleccionado(slot)}
                      className={`text-xs py-2 rounded-lg border transition-colors ${
                        !slot.disponible
                          ? "opacity-30 cursor-not-allowed border-[#e8c5ce] bg-[#f4f1ef]"
                          : slotSeleccionado?.hora_inicio === slot.hora_inicio
                          ? "bg-[#C4728A] text-white border-[#C4728A]"
                          : "border-[#e8c5ce] hover:border-[#C4728A] hover:text-[#C4728A] bg-white"
                      }`}
                    >
                      {slot.hora_inicio}
                    </button>
                  ))}
                </div>
              ) : profesionalId && fecha ? (
                <p className="text-sm text-[#6b6360] text-center py-2">
                  Sin horas disponibles. Usa la opción de hora manual.
                </p>
              ) : null}
            </div>
          )}

          {/* Resumen */}
          {(slotSeleccionado || (horaManual && horaInicioManual)) && listo && (
            <div className="bg-[#1a1412] rounded-xl p-4 text-white text-sm">
              <p className="font-medium mb-2 text-[#C4728A]">Resumen</p>
              {lineas.map((l) => {
                const variante = l.variantes.find((v) => v.id === l.varianteId);
                return (
                  <p key={l.uid} className="text-[#f7e8ed] text-xs">
                    {l.servicio.nombre}{variante ? ` — ${variante.nombre}` : ""}
                  </p>
                );
              })}
              <p className="mt-1 text-[#f7e8ed]">
                {format(new Date(fecha + "T12:00:00"), "dd/MM/yyyy")} a las{" "}
                {horaManual ? horaInicioManual : slotSeleccionado!.hora_inicio}
                {" – "}
                {horaManual ? horaFinManual : slotSeleccionado!.hora_fin}
              </p>
              <p className="text-[#C4728A] font-semibold mt-1">{totalPrecio.toFixed(2)} €</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#e8c5ce] text-[#6b6360] py-2.5 rounded-xl hover:bg-[#f4f1ef] transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#C4728A] hover:bg-[#a85a72] text-white py-2.5 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Crear reserva"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
