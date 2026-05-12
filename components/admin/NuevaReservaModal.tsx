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

interface Props {
  open: boolean;
  onClose: () => void;
  fechaInicial: Date;
  profesionales: Profesional[];
  profesionalPreseleccionada?: Profesional | null;
  onCreada: (r: Reserva) => void;
}

export function NuevaReservaModal({ open, onClose, fechaInicial, profesionales, profesionalPreseleccionada, onCreada }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [variantes, setVariantes] = useState<ServicioVariante[]>([]);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [loading, setLoading] = useState(false);

  // Cliente
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [sugerencias, setSugerencias] = useState<ClienteSugerencia[]>([]);
  const [mostrarSug, setMostrarSug] = useState(false);
  const sugRef = useRef<HTMLDivElement>(null);

  // Servicio
  const [servicioId, setServicioId] = useState("");
  const [varianteId, setVarianteId] = useState("");
  const [busquedaServicio, setBusquedaServicio] = useState("");

  // Profesional / fecha
  const [profesionalId, setProfesionalId] = useState(profesionalPreseleccionada?.id ?? "");
  const [fecha, setFecha] = useState(format(fechaInicial, "yyyy-MM-dd"));

  // Hora manual (para reservas fuera de horario del salón)
  const [horaManual, setHoraManual] = useState(false);
  const [horaInicioManual, setHoraInicioManual] = useState(
    format(fechaInicial, "HH:mm") !== "00:00" ? format(fechaInicial, "HH:mm") : "10:00"
  );
  const [horaFinManual, setHoraFinManual] = useState("");
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);

  // Fetch servicios
  useEffect(() => {
    fetch("/api/servicios")
      .then((r) => r.json())
      .then((data) => setServicios(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Fetch variantes cuando cambia el servicio
  useEffect(() => {
    setVariantes([]);
    setVarianteId("");
    setSlotSeleccionado(null);
    if (!servicioId) return;
    const servicio = servicios.find((s) => s.id === servicioId);
    if (!servicio?.precio_desde) return;
    fetch(`/api/servicio-variantes?servicio_id=${servicioId}`)
      .then((r) => r.json())
      .then((data) => setVariantes(Array.isArray(data) ? data : []));
  }, [servicioId, servicios]);

  const servicioSeleccionado = servicios.find((s) => s.id === servicioId);
  const varianteSeleccionada = variantes.find((v) => v.id === varianteId);
  const duracion = varianteSeleccionada?.duracion_min ?? servicioSeleccionado?.duracion_min;

  // Fetch slots (solo si no es hora manual)
  useEffect(() => {
    if (horaManual) return;
    setSlots([]);
    setSlotSeleccionado(null);
    if (!profesionalId || !servicioId || !fecha || !duracion) return;
    if (servicioSeleccionado?.precio_desde && variantes.length > 0 && !varianteId) return;
    fetch(`/api/slots?profesional_id=${profesionalId}&fecha=${fecha}&duracion_min=${duracion}`)
      .then((r) => r.json())
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]));
  }, [profesionalId, servicioId, varianteId, fecha, duracion, variantes.length, servicioSeleccionado?.precio_desde, horaManual]);

  // Calcular horaFin automáticamente en modo manual
  useEffect(() => {
    if (!horaManual || !horaInicioManual || !duracion) return;
    try {
      const base = new Date();
      const ini = parse(horaInicioManual, "HH:mm", base);
      const fin = addMinutes(ini, duracion);
      setHoraFinManual(format(fin, "HH:mm"));
    } catch {}
  }, [horaInicioManual, duracion, horaManual]);

  // Autocomplete de clientes
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

  // Cerrar sugerencias al clicar fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sugRef.current && !sugRef.current.contains(e.target as Node)) {
        setMostrarSug(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function seleccionarCliente(c: ClienteSugerencia) {
    setClienteNombre(c.nombre);
    setClienteTelefono(c.telefono);
    setClienteEmail(c.email ?? "");
    setSugerencias([]);
    setMostrarSug(false);
  }

  // Servicios filtrados por búsqueda
  const serviciosFiltrados = servicios.filter((s) =>
    !busquedaServicio || s.nombre.toLowerCase().includes(busquedaServicio.toLowerCase())
  );

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();

    if (!servicioId || !profesionalId) {
      toast.error("Selecciona servicio y profesional");
      return;
    }
    if (servicioSeleccionado?.precio_desde && variantes.length > 0 && !varianteId) {
      toast.error("Selecciona el tamaño del servicio");
      return;
    }
    if (!horaManual && !slotSeleccionado) {
      toast.error("Selecciona una hora");
      return;
    }
    if (horaManual && (!horaInicioManual || !horaFinManual)) {
      toast.error("Introduce hora de inicio y fin");
      return;
    }
    if (horaManual && horaFinManual <= horaInicioManual) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }

    setLoading(true);

    // Buscar o crear cliente vía API (service role key)
    let clienteId: string;
    if (clienteTelefono || clienteNombre) {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: clienteNombre, telefono: clienteTelefono, email: clienteEmail }),
      });
      if (!res.ok) { toast.error("Error al registrar el cliente"); setLoading(false); return; }
      const c = await res.json();
      clienteId = c.id;
    } else {
      toast.error("Introduce al menos el nombre o teléfono del cliente");
      setLoading(false);
      return;
    }

    const horaInicio = horaManual ? horaInicioManual + ":00" : slotSeleccionado!.hora_inicio + ":00";
    const horaFin    = horaManual ? horaFinManual    + ":00" : slotSeleccionado!.hora_fin    + ":00";

    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();

    const { data: reserva, error } = await supabase
      .from("reservas")
      .insert({
        cliente_id: clienteId,
        profesional_id: profesionalId,
        servicio_id: servicioId,
        variante_id: varianteId || null,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: "confirmada",
      })
      .select("*, clientes(*), profesionales(*), servicios(*), variante:servicio_variantes(*)")
      .single();

    if (error) {
      toast.error("Error al crear la reserva");
    } else {
      toast.success("Reserva creada correctamente");
      onCreada(reserva as Reserva);
    }
    setLoading(false);
  }

  const precioDisplay = varianteSeleccionada
    ? `${Number(varianteSeleccionada.precio).toFixed(2)} €`
    : servicioSeleccionado?.precio_desde
      ? `desde ${Number(servicioSeleccionado.precio).toFixed(0)} €`
      : servicioSeleccionado
        ? `${Number(servicioSeleccionado.precio).toFixed(2)} €`
        : "";

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
          {/* Cliente con autocomplete */}
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

            <div className="relative">
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

          {/* Servicio con buscador */}
          <div>
            <Label className="text-xs text-[#6b6360]">Servicio *</Label>
            <Input
              placeholder="Buscar servicio..."
              value={busquedaServicio}
              onChange={(e) => setBusquedaServicio(e.target.value)}
              className="mt-1 mb-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
            />
            <select
              value={servicioId}
              onChange={(e) => { setServicioId(e.target.value); setSlotSeleccionado(null); }}
              required
              size={serviciosFiltrados.length > 0 ? Math.min(serviciosFiltrados.length + 1, 6) : 2}
              className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
            >
              <option value="">Selecciona un servicio...</option>
              {serviciosFiltrados.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}{s.precio_desde ? ` — desde ${Number(s.precio).toFixed(0)}€` : ` — ${Number(s.precio).toFixed(2)}€`} · {s.duracion_min}min
                </option>
              ))}
            </select>
          </div>

          {/* Variante */}
          {servicioSeleccionado?.precio_desde && variantes.length > 0 && (
            <div>
              <Label className="text-xs text-[#6b6360]">Tamaño *</Label>
              <select
                value={varianteId}
                onChange={(e) => { setVarianteId(e.target.value); setSlotSeleccionado(null); }}
                required
                className="mt-1 w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
              >
                <option value="">Selecciona el tamaño...</option>
                {variantes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nombre} — {v.duracion_min}min — {Number(v.precio).toFixed(2)}€
                  </option>
                ))}
              </select>
            </div>
          )}

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

          {/* Hora manual */}
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

          {/* Slots normales */}
          {!horaManual && slots.length > 0 && (
            <div>
              <Label className="text-xs text-[#6b6360]">Hora disponible *</Label>
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
            </div>
          )}

          {!horaManual && profesionalId && servicioId && fecha && duracion && slots.length === 0 && (
            <p className="text-sm text-[#6b6360] text-center py-2">
              Sin horas disponibles. Usa la opción de hora manual si necesitas reservar fuera de horario.
            </p>
          )}

          {/* Resumen */}
          {(slotSeleccionado || (horaManual && horaInicioManual)) && servicioSeleccionado && (
            <div className="bg-[#1a1412] rounded-xl p-4 text-white text-sm">
              <p className="font-medium mb-2 text-[#C4728A]">Resumen</p>
              <p>{servicioSeleccionado.nombre}{varianteSeleccionada ? ` — ${varianteSeleccionada.nombre}` : ""}</p>
              <p className="text-[#f7e8ed]">
                {format(new Date(fecha + "T12:00:00"), "dd/MM/yyyy")} a las{" "}
                {horaManual ? horaInicioManual : slotSeleccionado!.hora_inicio}
                {horaManual && horaFinManual ? ` – ${horaFinManual}` : ""}
              </p>
              <p className="text-[#C4728A] font-semibold mt-1">{precioDisplay}</p>
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
