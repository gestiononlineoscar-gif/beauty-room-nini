"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";
import type { Cliente } from "@/types";

interface Props {
  clientes: Cliente[];
}

interface EditForm {
  nombre: string;
  telefono: string;
  email: string;
  notas: string;
  inasistencias: number;
  bloqueado: boolean;
}

export function ClientesLista({ clientes: inicial }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState(inicial);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nombre: "", telefono: "", email: "", notas: "", inasistencias: 0, bloqueado: false });
  const [guardando, setGuardando] = useState(false);

  const filtrados = clientes.filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  function abrirEdicion(c: Cliente) {
    setClienteEditando(c);
    setEditForm({
      nombre: c.nombre,
      telefono: c.telefono ?? "",
      email: c.email ?? "",
      notas: c.notas ?? "",
      inasistencias: c.inasistencias ?? 0,
      bloqueado: c.bloqueado,
    });
  }

  async function guardarEdicion() {
    if (!clienteEditando) return;
    if (!editForm.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setGuardando(true);

    const res = await fetch(`/api/clientes/${clienteEditando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: editForm.nombre.trim(),
        telefono: editForm.telefono.trim() || null,
        email: editForm.email.trim() || null,
        notas: editForm.notas.trim() || null,
        inasistencias: editForm.inasistencias,
        bloqueado: editForm.bloqueado,
      }),
    });

    if (!res.ok) {
      toast.error("Error al guardar los cambios");
      setGuardando(false);
      return;
    }

    const actualizado = await res.json();
    setClientes((prev) => prev.map((c) => c.id === clienteEditando.id ? { ...c, ...actualizado } : c));
    setClienteEditando(null);
    toast.success("Cliente actualizado");
    setGuardando(false);
  }

  async function toggleBloqueado(cliente: Cliente) {
    const nuevo = !cliente.bloqueado;
    const res = await fetch(`/api/clientes/${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bloqueado: nuevo }),
    });
    if (!res.ok) { toast.error("Error al actualizar el cliente"); return; }
    setClientes((prev) => prev.map((c) => c.id === cliente.id ? { ...c, bloqueado: nuevo } : c));
    toast.success(nuevo ? "Clienta bloqueada" : "Clienta desbloqueada");
  }

  function exportarCSV() {
    const headers = ["Nombre", "Teléfono", "Email", "Inasistencias", "Bloqueada", "Fecha registro"];
    const rows = filtrados.map((c) => [
      c.nombre, c.telefono ?? "", c.email ?? "",
      String(c.inasistencias ?? 0),
      c.bloqueado ? "Sí" : "No",
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
              <th className="text-center px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-[#6b6360]">Sin clientes</td></tr>
            )}
            {filtrados.map((c) => (
              <tr key={c.id} className={`border-t border-[#f4f1ef] transition-colors ${c.bloqueado ? "bg-red-50" : "hover:bg-[#fdf6f0]"}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-[#1a1412]">{c.nombre}</p>
                    {c.bloqueado && (
                      <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-medium">
                        Bloqueada
                      </span>
                    )}
                    {(c.inasistencias ?? 0) > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full font-medium">
                        {c.inasistencias} inasistencia{c.inasistencias !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {c.notas && <p className="text-xs text-[#6b6360] mt-0.5 italic">{c.notas}</p>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-[#6b6360]">{c.telefono ?? "—"}</td>
                <td className="px-4 py-3 hidden md:table-cell text-[#6b6360]">{c.email ?? "—"}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-[#6b6360] text-xs">
                  {format(parseISO(c.created_at), "d MMM yyyy", { locale: es })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => abrirEdicion(c)}
                      title="Editar cliente"
                      className="p-1.5 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:bg-[#f7e8ed] hover:text-[#C4728A] hover:border-[#C4728A] transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => toggleBloqueado(c)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
                        c.bloqueado
                          ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                          : "bg-[#f4f1ef] text-[#6b6360] border-[#e8c5ce] hover:bg-[#e8c5ce]"
                      }`}
                    >
                      {c.bloqueado ? "Desbloquear" : "Bloquear"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#6b6360] mt-3">{filtrados.length} clientes</p>

      {/* Modal edición cliente */}
      {clienteEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#fdf6f0] border border-[#e8c5ce] rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8c5ce]">
              <h2 className="font-heading text-lg text-[#1a1412]">Editar cliente</h2>
              <button onClick={() => setClienteEditando(null)} className="text-[#6b6360] hover:text-[#C4728A] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-[#6b6360] font-medium block mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b6360] font-medium block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editForm.telefono}
                    onChange={(e) => setEditForm((f) => ({ ...f, telefono: e.target.value }))}
                    className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b6360] font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#6b6360] font-medium block mb-1">Notas internas</label>
                <textarea
                  value={editForm.notas}
                  onChange={(e) => setEditForm((f) => ({ ...f, notas: e.target.value }))}
                  rows={2}
                  className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A] resize-none"
                  placeholder="Preferencias, alergias, observaciones..."
                />
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs text-[#6b6360] font-medium block mb-1">Inasistencias</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, inasistencias: Math.max(0, f.inasistencias - 1) }))}
                      className="w-7 h-7 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:bg-[#f4f1ef] transition-colors flex items-center justify-center text-base font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold text-[#1a1412]">{editForm.inasistencias}</span>
                    <button
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, inasistencias: f.inasistencias + 1 }))}
                      className="w-7 h-7 rounded-lg border border-[#e8c5ce] text-[#6b6360] hover:bg-[#f4f1ef] transition-colors flex items-center justify-center text-base font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <label className="text-xs text-[#6b6360] font-medium block mb-1">Estado</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.bloqueado}
                      onChange={(e) => setEditForm((f) => ({ ...f, bloqueado: e.target.checked }))}
                      className="rounded accent-red-500"
                    />
                    <span className={`text-sm font-medium ${editForm.bloqueado ? "text-red-600" : "text-[#6b6360]"}`}>
                      {editForm.bloqueado ? "Bloqueada" : "Activa"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={() => setClienteEditando(null)}
                className="flex-1 border border-[#e8c5ce] text-[#6b6360] py-2.5 rounded-xl hover:bg-[#f4f1ef] transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                className="flex-1 bg-[#C4728A] hover:bg-[#a85a72] text-white py-2.5 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
