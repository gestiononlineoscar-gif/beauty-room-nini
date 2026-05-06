"use client";

import { useState, useEffect } from "react";
import { Trash2, PlusCircle, CalendarOff } from "lucide-react";

interface DiaFestivo {
  fecha: string;
  motivo: string;
}

export function DiasFestivos() {
  const [dias, setDias] = useState<DiaFestivo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    const res = await fetch("/api/dias-festivos");
    const data = await res.json();
    setDias(data ?? []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  async function añadir() {
    if (!fecha) return;
    setGuardando(true);
    await fetch("/api/dias-festivos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, motivo: motivo || "Día festivo" }),
    });
    setFecha("");
    setMotivo("");
    await cargar();
    setGuardando(false);
  }

  async function eliminar(f: string) {
    await fetch(`/api/dias-festivos?fecha=${f}`, { method: "DELETE" });
    await cargar();
  }

  const hoy = new Date().toISOString().slice(0, 10);

  function formatearFecha(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <CalendarOff className="w-5 h-5 text-[#C4728A]" />
        <h2 className="font-heading text-xl text-[#1a1412]">Días festivos</h2>
      </div>
      <p className="text-sm text-[#6b6360] mb-5">
        Bloquea un día entero para todos los profesionales. Los clientes no podrán reservar en esas fechas.
      </p>

      <div className="bg-white rounded-2xl border border-[#e8c5ce] p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="date"
          min={hoy}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border border-[#e5d5c5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] flex-shrink-0"
        />
        <input
          type="text"
          placeholder="Motivo (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          className="border border-[#e5d5c5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] flex-1 min-w-0"
        />
        <button
          onClick={añadir}
          disabled={!fecha || guardando}
          className="flex items-center justify-center gap-1.5 bg-[#C4728A] hover:bg-[#a85a72] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          {guardando ? "Guardando…" : "Añadir"}
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-[#6b6360]">Cargando…</p>
      ) : dias.length === 0 ? (
        <p className="text-sm text-[#6b6360]">No hay días festivos próximos.</p>
      ) : (
        <ul className="space-y-2">
          {dias.map((d) => (
            <li
              key={d.fecha}
              className="flex items-center justify-between bg-white rounded-xl border border-[#e8c5ce] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#1a1412]">{formatearFecha(d.fecha)}</p>
                <p className="text-xs text-[#6b6360]">{d.motivo || "Día festivo"}</p>
              </div>
              <button
                onClick={() => eliminar(d.fecha)}
                className="text-[#C4728A] hover:text-[#a85a72] transition-colors p-1"
                title="Reabrir día"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
