"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Cliente } from "@/types";

interface Props {
  clientes: Cliente[];
}

export function ClientesLista({ clientes }: Props) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  function exportarCSV() {
    const headers = ["Nombre", "Teléfono", "Email", "Fecha registro"];
    const rows = filtrados.map((c) => [
      c.nombre, c.telefono ?? "", c.email ?? "",
      format(parseISO(c.created_at), "dd/MM/yyyy", { locale: es }),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes-beauty-room-nini.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 items-center">
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
        />
        <button
          onClick={exportarCSV}
          className="text-sm border border-[#e8c5ce] px-3 py-2 rounded-xl text-[#6b6360] hover:bg-[#f4f1ef] transition-colors flex-shrink-0"
        >
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8c5ce] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f7e8ed] text-[#1a1412]">
              <th className="text-left px-4 py-3 font-semibold">Nombre</th>
              <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Teléfono</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Desde</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-[#6b6360]">Sin clientes</td></tr>
            )}
            {filtrados.map((c) => (
              <tr key={c.id} className="border-t border-[#f4f1ef] hover:bg-[#fdf6f0] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#1a1412]">{c.nombre}</p>
                  {c.notas && <p className="text-xs text-[#6b6360] mt-0.5 italic">{c.notas}</p>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-[#6b6360]">{c.telefono ?? "—"}</td>
                <td className="px-4 py-3 hidden md:table-cell text-[#6b6360]">{c.email ?? "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-[#6b6360] text-xs">
                  {format(parseISO(c.created_at), "d MMM yyyy", { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#6b6360] mt-3">{filtrados.length} clientes</p>
    </div>
  );
}
