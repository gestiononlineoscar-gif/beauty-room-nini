"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Reserva, Profesional, EstadoReserva } from "@/types";
import { Check, X, Pencil, Clock, Euro, User, Scissors } from "lucide-react";

const COLORES_ESTADO: Record<EstadoReserva, string> = {
  pendiente:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmada:  "bg-green-100 text-green-700 border-green-200",
  completada:  "bg-gray-100 text-gray-600 border-gray-200",
  cancelada:   "bg-red-100 text-red-600 border-red-200",
};

const LABELS_ESTADO: Record<EstadoReserva, string> = {
  pendiente:  "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada:  "Cancelada",
};

interface Props {
  reserva: Reserva;
  profesionales: Profesional[];
  open: boolean;
  onClose: () => void;
  onActualizada: (r: Reserva) => void;
  onEliminada: (id: string) => void;
}

export function CitaModal({ reserva, profesionales, open, onClose, onActualizada, onEliminada }: Props) {
  const [loading, setLoading] = useState(false);
  const [notas, setNotas] = useState(reserva.notas ?? "");
  const [editandoNotas, setEditandoNotas] = useState(false);

  const profesional = profesionales.find((p) => p.id === reserva.profesional_id);
  const fecha = format(parseISO(reserva.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

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
      .select("*, clientes(*), profesionales(*), servicios(*)")
      .single();

    if (error) {
      toast.error("Error al actualizar la cita");
    } else {
      toast.success(`Cita marcada como ${LABELS_ESTADO[nuevoEstado].toLowerCase()}`);
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
      .select("*, clientes(*), profesionales(*), servicios(*)")
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

  async function cancelarCita() {
    if (!confirm("¿Cancelar esta cita?")) return;
    actualizarEstado("cancelada");
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-[#fdf6f0] border-l border-[#e8c5ce]">
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

          {reserva.servicios && (
            <div className="flex items-start gap-3 pt-3 border-t border-[#f4f1ef]">
              <Scissors size={16} className="text-[#C4728A] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#6b6360]">Servicio</p>
                <p className="font-medium text-[#1a1412]">{reserva.servicios.nombre}</p>
                <p className="text-sm text-[#6b6360]">{reserva.servicios.duracion_min} min</p>
              </div>
            </div>
          )}

          {profesional && (
            <div className="flex items-start gap-3 pt-3 border-t border-[#f4f1ef]">
              <div
                className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                style={{ backgroundColor: profesional.color }}
              />
              <div>
                <p className="text-xs text-[#6b6360]">Profesional</p>
                <p className="font-medium text-[#1a1412]">{profesional.nombre}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 pt-3 border-t border-[#f4f1ef]">
            <Clock size={16} className="text-[#C4728A] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[#6b6360]">Fecha y hora</p>
              <p className="font-medium text-[#1a1412] capitalize">{fecha}</p>
              <p className="text-sm text-[#6b6360]">
                {reserva.hora_inicio.slice(0, 5)} – {reserva.hora_fin.slice(0, 5)}
              </p>
            </div>
          </div>

          {reserva.servicios && (
            <div className="flex items-start gap-3 pt-3 border-t border-[#f4f1ef]">
              <Euro size={16} className="text-[#C4728A] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#6b6360]">Precio</p>
                <p className="font-medium text-[#C4728A] text-lg">{Number(reserva.servicios.precio).toFixed(2)} €</p>
              </div>
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
        {reserva.estado !== "cancelada" && reserva.estado !== "completada" && (
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
