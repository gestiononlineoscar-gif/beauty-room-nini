"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { HorarioLocal } from "@/types";
import { DIAS_SEMANA } from "@/types";

interface Props {
  horariosIniciales: HorarioLocal[];
}

export function HorariosGestion({ horariosIniciales }: Props) {
  const [horarios, setHorarios] = useState(horariosIniciales);
  const [guardando, setGuardando] = useState<number | null>(null);

  async function actualizar(dia: number, campo: keyof HorarioLocal, valor: boolean | string) {
    const supabase = createClient();
    setGuardando(dia);
    const { error } = await supabase
      .from("horario_local")
      .update({ [campo]: valor })
      .eq("dia_semana", dia);

    if (error) {
      toast.error("Error al guardar");
    } else {
      setHorarios((prev) =>
        prev.map((h) => h.dia_semana === dia ? { ...h, [campo]: valor } : h)
      );
      toast.success("Horario actualizado");
    }
    setGuardando(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e8c5ce] overflow-hidden">
      <div className="bg-[#f7e8ed] px-4 py-3 border-b border-[#e8c5ce]">
        <p className="font-semibold text-[#1a1412] text-sm">Horario del local</p>
      </div>
      <div className="divide-y divide-[#f4f1ef]">
        {horarios.map((h) => (
          <div key={h.dia_semana} className="px-4 py-4 flex items-center gap-4">
            <p className="w-24 text-sm font-medium text-[#1a1412]">{DIAS_SEMANA[h.dia_semana]}</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={h.abierto}
                onChange={(e) => actualizar(h.dia_semana, "abierto", e.target.checked)}
              />
              <div className="w-10 h-6 bg-[#e8c5ce] rounded-full peer peer-checked:bg-[#C4728A] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-5 after:h-5 after:transition-all peer-checked:after:translate-x-4" />
            </label>
            {h.abierto ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={h.hora_apertura?.slice(0, 5) ?? "10:00"}
                  onChange={(e) => actualizar(h.dia_semana, "hora_apertura", e.target.value)}
                  className="border border-[#e8c5ce] rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none"
                />
                <span className="text-[#6b6360] text-sm">–</span>
                <input
                  type="time"
                  value={h.hora_cierre?.slice(0, 5) ?? "20:00"}
                  onChange={(e) => actualizar(h.dia_semana, "hora_cierre", e.target.value)}
                  className="border border-[#e8c5ce] rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none"
                />
                {guardando === h.dia_semana && <span className="text-xs text-[#6b6360]">Guardando...</span>}
              </div>
            ) : (
              <span className="text-sm text-[#D4621A]">Cerrado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
