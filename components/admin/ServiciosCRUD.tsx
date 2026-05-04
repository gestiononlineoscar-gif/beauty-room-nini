"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { Servicio } from "@/types";
import { CATEGORIAS_SERVICIOS, ICONOS_CATEGORIA } from "@/types";
import { Plus, Pencil, Check, X } from "lucide-react";

interface Props {
  serviciosIniciales: Servicio[];
}

const SERVICIO_VACIO = {
  nombre: "", categoria: "Manicura", duracion_min: 60, precio: 0, activo: true,
};

export function ServiciosCRUD({ serviciosIniciales }: Props) {
  const [servicios, setServicios] = useState(serviciosIniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<Partial<Servicio>>(SERVICIO_VACIO);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

  const supabase = createClient();

  const categorias = Array.from(new Set(servicios.map((s) => s.categoria)));
  const filtrados = categoriaFiltro ? servicios.filter((s) => s.categoria === categoriaFiltro) : servicios;

  async function guardar() {
    if (!form.nombre || !form.categoria) return;
    if (editando) {
      const { data, error } = await supabase.from("servicios").update({
        nombre: form.nombre,
        categoria: form.categoria,
        duracion_min: Number(form.duracion_min),
        precio: Number(form.precio),
      }).eq("id", editando).select().single();
      if (error) { toast.error("Error al guardar"); return; }
      setServicios((prev) => prev.map((s) => s.id === editando ? data as Servicio : s));
      toast.success("Servicio actualizado");
      setEditando(null);
    } else {
      const { data, error } = await supabase.from("servicios").insert({
        nombre: form.nombre,
        categoria: form.categoria,
        duracion_min: Number(form.duracion_min),
        precio: Number(form.precio),
        activo: true,
      }).select().single();
      if (error) { toast.error("Error al crear"); return; }
      setServicios((prev) => [...prev, data as Servicio]);
      toast.success("Servicio creado");
      setNuevo(false);
      setForm(SERVICIO_VACIO);
    }
  }

  async function toggleActivo(servicio: Servicio) {
    const { error } = await supabase.from("servicios").update({ activo: !servicio.activo }).eq("id", servicio.id);
    if (error) { toast.error("Error"); return; }
    setServicios((prev) => prev.map((s) => s.id === servicio.id ? { ...s, activo: !s.activo } : s));
  }

  function iniciarEdicion(s: Servicio) {
    setEditando(s.id);
    setForm(s);
    setNuevo(false);
  }

  const FormRow = () => (
    <tr className="bg-[#f7e8ed]">
      <td className="px-3 py-2">
        <input value={form.nombre ?? ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre del servicio" className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
      </td>
      <td className="px-3 py-2">
        <select value={form.categoria ?? ""} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="border border-[#e8c5ce] rounded-lg px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-[#C4728A] focus:outline-none w-full">
          {CATEGORIAS_SERVICIOS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <input type="number" value={form.duracion_min ?? 60} onChange={(e) => setForm({ ...form, duracion_min: Number(e.target.value) })}
          className="w-20 border border-[#e8c5ce] rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
      </td>
      <td className="px-3 py-2">
        <input type="number" step="0.01" value={form.precio ?? 0} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
          className="w-24 border border-[#e8c5ce] rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2">
          <button onClick={guardar} className="p-1.5 bg-[#4a9b6f] text-white rounded-lg"><Check size={14} /></button>
          <button onClick={() => { setEditando(null); setNuevo(false); setForm(SERVICIO_VACIO); }}
            className="p-1.5 border border-[#e8c5ce] rounded-lg text-[#6b6360]"><X size={14} /></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      {/* Filtros y botón nuevo */}
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoriaFiltro(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!categoriaFiltro ? "bg-[#C4728A] text-white border-[#C4728A]" : "border-[#e8c5ce] text-[#6b6360]"}`}
          >Todos</button>
          {CATEGORIAS_SERVICIOS.filter((c) => servicios.some((s) => s.categoria === c)).map((c) => (
            <button
              key={c}
              onClick={() => setCategoriaFiltro(c === categoriaFiltro ? null : c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${categoriaFiltro === c ? "bg-[#C4728A] text-white border-[#C4728A]" : "border-[#e8c5ce] text-[#6b6360]"}`}
            >{ICONOS_CATEGORIA[c]} {c}</button>
          ))}
        </div>
        <button
          onClick={() => { setNuevo(true); setEditando(null); setForm(SERVICIO_VACIO); }}
          className="flex items-center gap-1.5 bg-[#C4728A] hover:bg-[#a85a72] text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8c5ce] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7e8ed] text-[#1a1412]">
                <th className="text-left px-3 py-3 font-semibold">Nombre</th>
                <th className="text-left px-3 py-3 font-semibold">Categoría</th>
                <th className="text-left px-3 py-3 font-semibold">Duración</th>
                <th className="text-left px-3 py-3 font-semibold">Precio</th>
                <th className="text-left px-3 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {nuevo && !editando && <FormRow />}
              {filtrados.map((s) => (
                editando === s.id ? (
                  <FormRow key={s.id} />
                ) : (
                  <tr key={s.id} className={`border-t border-[#f4f1ef] hover:bg-[#fdf6f0] transition-colors ${!s.activo ? "opacity-50" : ""}`}>
                    <td className="px-3 py-3 font-medium text-[#1a1412]">{s.nombre}</td>
                    <td className="px-3 py-3 text-[#6b6360]">{ICONOS_CATEGORIA[s.categoria]} {s.categoria}</td>
                    <td className="px-3 py-3 text-[#6b6360]">{s.duracion_min} min</td>
                    <td className="px-3 py-3 font-semibold text-[#C4728A]">{Number(s.precio).toFixed(2)} €</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => iniciarEdicion(s)}
                          className="p-1.5 border border-[#e8c5ce] rounded-lg text-[#6b6360] hover:text-[#C4728A] hover:border-[#C4728A] transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => toggleActivo(s)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${s.activo ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                          {s.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
