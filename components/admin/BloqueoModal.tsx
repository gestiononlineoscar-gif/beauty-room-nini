"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Profesional } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  fechaInicial: Date;
  horaInicial?: string;
  profesionales: Profesional[];
  profesionalPreseleccionada?: Profesional | null;
  onCreado: (bloqueo: any) => void;
}

export function BloqueoModal({
  open, onClose, fechaInicial, horaInicial, profesionales, profesionalPreseleccionada, onCreado
}: Props) {
  const [profesionalId, setProfesionalId] = useState(profesionalPreseleccionada?.id ?? "");
  const [fecha, setFecha] = useState(format(fechaInicial, "yyyy-MM-dd"));
  const [horaInicio, setHoraInicio] = useState(horaInicial ?? "10:00");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!profesionalId || !fecha || !horaInicio || !horaFin) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (horaFin <= horaInicio) {
      toast.error("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/bloqueos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profesional_id: profesionalId,
        fecha,
        hora_inicio: horaInicio + ":00",
        hora_fin: horaFin + ":00",
        motivo,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(`Error: ${data?.error ?? "No se pudo crear el bloqueo"}`);
    } else {
      toast.success("Horario bloqueado");
      onCreado(data);
      onClose();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-[#fdf6f0] border border-[#e8c5ce] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-[#1a1412]">🔒 Bloquear horario</DialogTitle>
          <p className="text-sm text-[#6b6360]">Las clientas no podrán reservar en este tramo.</p>
        </DialogHeader>

        <form onSubmit={handleGuardar} className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-[#6b6360]">Profesional *</Label>
            <select
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
              required
              className="mt-1 w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
            >
              <option value="">Selecciona...</option>
              {profesionales.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs text-[#6b6360]">Fecha *</Label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#6b6360]">Desde *</Label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
                className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
              />
            </div>
            <div>
              <Label className="text-xs text-[#6b6360]">Hasta *</Label>
              <Input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                required
                className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#6b6360]">Motivo (opcional)</Label>
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Descanso, Formación, Cierre..."
              className="mt-1 border-[#e8c5ce] focus-visible:ring-[#C4728A]"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[#e8c5ce] text-[#6b6360] py-2.5 rounded-xl hover:bg-[#f4f1ef] transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#1a1412] hover:bg-[#2d2220] text-white py-2.5 rounded-xl font-medium transition-colors text-sm disabled:opacity-50">
              {loading ? "Guardando..." : "Bloquear"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
