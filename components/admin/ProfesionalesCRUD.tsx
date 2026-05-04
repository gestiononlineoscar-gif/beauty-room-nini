"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { Profesional, Servicio } from "@/types";
import { Plus, Pencil, Check, X } from "lucide-react";

interface Props {
  profesionalesIniciales: Profesional[];
  servicios: Servicio[];
}

const PROF_VACIA: Partial<Profesional> = {
  nombre: "", especialidad: "", color: "#C4728A", activo: true,
};

export function ProfesionalesCRUD({ profesionalesIniciales, servicios }: Props) {
  const [profesionales, setProfesionales] = useState(profesionalesIniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<Partial<Profesional>>(PROF_VACIA);

  const supabase = createClient();

  async function guardar() {
    if (!form.nombre || !form.color) return;
    if (editando) {
      const { data, error } = await supabase.from("profesionales").update({
        nombre: form.nombre, especialidad: form.especialidad, color: form.color,
      }).eq("id", editando).select().single();
      if (error) { toast.error("Error al guardar"); return; }
      setProfesionales((prev) => prev.map((p) => p.id === editando ? data as Profesional : p));
      toast.success("Profesional actualizada");
      setEditando(null);
    } else {
      const { data, error } = await supabase.from("profesionales").insert({
        nombre: form.nombre, especialidad: form.especialidad ?? "",
        color: form.color ?? "#C4728A", activo: true,
      }).select().single();
      if (error) { toast.error("Error al crear"); return; }
      setProfesionales((prev) => [...prev, data as Profesional]);
      toast.success("Profesional creada");
      setNuevo(false);
      setForm(PROF_VACIA);
    }
  }

  async function toggleActivo(p: Profesional) {
    const { error } = await supabase.from("profesionales").update({ activo: !p.activo }).eq("id", p.id);
    if (error) { toast.error("Error"); return; }
    setProfesionales((prev) => prev.map((x) => x.id === p.id ? { ...x, activo: !x.activo } : x));
  }


  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setNuevo(true); setEditando(null); setForm(PROF_VACIA); }}
          className="flex items-center gap-1.5 bg-[#C4728A] hover:bg-[#a85a72] text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nueva profesional
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Formulario nueva */}
        {nuevo && !editando && (
          <div className="bg-white rounded-2xl border-2 border-[#C4728A] p-4 space-y-3">
            <p className="font-semibold text-[#1a1412] text-sm">Nueva profesional</p>
            <input value={form.nombre ?? ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre" className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
            <input value={form.especialidad ?? ""} onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
              placeholder="Especialidad" className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
            <div className="flex items-center gap-3">
              <label className="text-xs text-[#6b6360]">Color:</label>
              <input type="color" value={form.color ?? "#C4728A"} onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-10 h-8 rounded cursor-pointer border border-[#e8c5ce]" />
            </div>
            <div className="flex gap-2">
              <button onClick={guardar} className="flex-1 bg-[#4a9b6f] text-white py-2 rounded-xl text-sm flex items-center justify-center gap-1">
                <Check size={14} /> Guardar
              </button>
              <button onClick={() => { setNuevo(false); setForm(PROF_VACIA); }}
                className="px-3 border border-[#e8c5ce] rounded-xl text-[#6b6360]"><X size={14} /></button>
            </div>
          </div>
        )}

        {profesionales.map((p) => (
          editando === p.id ? (
            <div key={p.id} className="bg-white rounded-2xl border-2 border-[#C4728A] p-4 space-y-3">
              <p className="font-semibold text-[#1a1412] text-sm">Editando</p>
              <input value={form.nombre ?? ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
              <input value={form.especialidad ?? ""} onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
                className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
              <div className="flex items-center gap-3">
                <label className="text-xs text-[#6b6360]">Color:</label>
                <input type="color" value={form.color ?? "#C4728A"} onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-8 rounded cursor-pointer border border-[#e8c5ce]" />
              </div>
              <div className="flex gap-2">
                <button onClick={guardar} className="flex-1 bg-[#4a9b6f] text-white py-2 rounded-xl text-sm flex items-center justify-center gap-1">
                  <Check size={14} /> Guardar
                </button>
                <button onClick={() => setEditando(null)} className="px-3 border border-[#e8c5ce] rounded-xl text-[#6b6360]"><X size={14} /></button>
              </div>
            </div>
          ) : (
            <div key={p.id} className={`bg-white rounded-2xl border border-[#e8c5ce] p-4 ${!p.activo ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.nombre[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1412]">{p.nombre}</p>
                    <p className="text-xs text-[#6b6360]">{p.especialidad}</p>
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full border border-white shadow flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditando(p.id); setForm(p); setNuevo(false); }}
                  className="flex-1 text-xs border border-[#e8c5ce] py-1.5 rounded-xl text-[#6b6360] hover:text-[#C4728A] hover:border-[#C4728A] transition-colors flex items-center justify-center gap-1">
                  <Pencil size={12} /> Editar
                </button>
                <button onClick={() => toggleActivo(p)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${p.activo ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                  {p.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
