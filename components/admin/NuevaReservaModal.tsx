"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { obtenerSlotsDisponibles } from "@/lib/disponibilidad";
import type { Profesional, Servicio, Reserva, SlotDisponible, ServicioVariante } from "@/types";

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

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [varianteId, setVarianteId] = useState("");
  const [profesionalId, setProfesionalId] = useState(profesionalPreseleccionada?.id ?? "");
  const [fecha, setFecha] = useState(format(fechaInicial, "yyyy-MM-dd"));
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("servicios").select("*").eq("activo", true).order("categoria").then(({ data }) => {
      setServicios(data ?? []);
    });
  }, []);

  // Fetch variants when service changes
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

  // Compute duration based on variant or service
  const servicioSeleccionado = servicios.find((s) => s.id === servicioId);
  const varianteSeleccionada = variantes.find((v) => v.id === varianteId);
  const duracion = varianteSeleccionada?.duracion_min ?? servicioSeleccionado?.duracion_min;

  useEffect(() => {
    setSlots([]);
    setSlotSeleccionado(null);
    if (!profesionalId || !servicioId || !fecha || !duracion) return;
    // Only calculate slots when variant is selected (if service has variants)
    if (servicioSeleccionado?.precio_desde && variantes.length > 0 && !varianteId) return;
    obtenerSlotsDisponibles(profesionalId, fecha, duracion).then(setSlots);
  }, [profesionalId, servicioId, varianteId, fecha, duracion, variantes.length, servicioSeleccionado?.precio_desde]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!slotSeleccionado || !servicioId || !profesionalId) {
      toast.error("Completa todos los campos");
      return;
    }
    if (servicioSeleccionado?.precio_desde && variantes.length > 0 && !varianteId) {
      toast.error("Selecciona el tamaño del servicio");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    let clienteId: string;
    const { data: clienteExistente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefono", clienteTelefono)
      .maybeSingle();

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      const { data: nuevoCliente, error: errCliente } = await supabase
        .from("clientes")
        .insert({ nombre: clienteNombre, telefono: clienteTelefono, email: clienteEmail })
        .select()
        .single();
      if (errCliente) { toast.error("Error al crear cliente"); setLoading(false); return; }
      clienteId = nuevoCliente.id;
    }

    const { data: reserva, error } = await supabase
      .from("reservas")
      .insert({
        cliente_id: clienteId,
        profesional_id: profesionalId,
        servicio_id: servicioId,
        variante_id: varianteId || null,
        fecha,
        hora_inicio: slotSeleccionado.hora_inicio + ":00",
        hora_fin: slotSeleccionado.hora_fin + ":00",
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
          {/* Cliente */}
          <div className="bg-white rounded-xl border border-[#e8c5ce] p-4 space-y-3">
            <p className="text-sm font-semibold text-[#1a1412]">Datos del cliente</p>
            <div>
              <Label className="text-xs text-[#6b6360]">Nombre *</Label>
              <Input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Nombre completo" required className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]" />
            </div>
            <div>
              <Label className="text-xs text-[#6b6360]">Teléfono</Label>
              <Input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="600 000 000" className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]" />
            </div>
            <div>
              <Label className="text-xs text-[#6b6360]">Email</Label>
              <Input type="email" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="email@ejemplo.com" className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]" />
            </div>
          </div>

          {/* Servicio */}
          <div>
            <Label className="text-xs text-[#6b6360]">Servicio *</Label>
            <select
              value={servicioId}
              onChange={(e) => { setServicioId(e.target.value); setSlotSeleccionado(null); }}
              required
              className="mt-1 w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
            >
              <option value="">Selecciona un servicio...</option>
              {Array.from(new Set(servicios.map((s) => s.categoria))).map((cat) => (
                <optgroup key={cat} label={cat}>
                  {servicios.filter((s) => s.categoria === cat).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}{s.precio_desde ? ` — desde ${Number(s.precio).toFixed(0)}€` : ` — ${Number(s.precio).toFixed(2)}€`}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Variante (solo si el servicio tiene precio_desde y variantes) */}
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

          {/* Slots */}
          {slots.length > 0 && (
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

          {/* Resumen */}
          {slotSeleccionado && servicioSeleccionado && (
            <div className="bg-[#1a1412] rounded-xl p-4 text-white text-sm">
              <p className="font-medium mb-2 text-[#C4728A]">Resumen</p>
              <p>{servicioSeleccionado.nombre}{varianteSeleccionada ? ` — ${varianteSeleccionada.nombre}` : ""}</p>
              <p className="text-[#f7e8ed]">{format(new Date(fecha + "T12:00:00"), "dd/MM/yyyy")} a las {slotSeleccionado.hora_inicio}</p>
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
              disabled={loading || !slotSeleccionado}
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
