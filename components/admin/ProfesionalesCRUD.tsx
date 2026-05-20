"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { Profesional, Servicio } from "@/types";
import { DIAS_SEMANA } from "@/types";
import { Plus, Pencil, Check, X, Clock, Scissors, Eye, EyeOff, CalendarPlus, Trash2 } from "lucide-react";
import { CATEGORIAS_SERVICIOS } from "@/types";

interface Props {
  profesionalesIniciales: Profesional[];
  servicios: Servicio[];
}

interface HorarioProf {
  id: string;
  dia_semana: number;
  trabaja: boolean;
  hora_inicio: string;
  hora_fin: string;
}

const PROF_VACIA: Partial<Profesional> = {
  nombre: "", especialidad: "", color: "#C4728A", activo: true,
};

export function ProfesionalesCRUD({ profesionalesIniciales, servicios }: Props) {
  const [profesionales, setProfesionales] = useState(profesionalesIniciales);
  const [editando, setEditando] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState<Partial<Profesional>>(PROF_VACIA);

  const [modalHorarios, setModalHorarios] = useState<{ prof: Profesional; horarios: HorarioProf[] } | null>(null);
  const [guardandoDia, setGuardandoDia] = useState<number | null>(null);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  interface Excepcion { id: string; fecha: string; hora_inicio: string; hora_fin: string; motivo: string | null; }
  const [modalExcepciones, setModalExcepciones] = useState<{ prof: Profesional; excepciones: Excepcion[] } | null>(null);
  const [nuevaExcepcion, setNuevaExcepcion] = useState({ fecha: "", hora_inicio: "10:00", hora_fin: "15:00", motivo: "" });
  const [guardandoExcepcion, setGuardandoExcepcion] = useState(false);

  const [modalServicios, setModalServicios] = useState<{ prof: Profesional; seleccionados: Set<string> } | null>(null);
  const [guardandoServicios, setGuardandoServicios] = useState(false);

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

  async function toggleVisiblePublico(p: Profesional) {
    const { error } = await supabase.from("profesionales").update({ visible_publico: !p.visible_publico }).eq("id", p.id);
    if (error) { toast.error("Error"); return; }
    setProfesionales((prev) => prev.map((x) => x.id === p.id ? { ...x, visible_publico: !x.visible_publico } : x));
    toast.success(p.visible_publico ? "Oculta en la web pública" : "Visible en la web pública");
  }

  async function abrirServicios(p: Profesional) {
    const res = await fetch(`/api/profesional-servicios?profesional_id=${p.id}`);
    const ids: string[] = await res.json();
    setModalServicios({ prof: p, seleccionados: new Set(ids) });
  }

  function toggleServicio(id: string) {
    if (!modalServicios) return;
    const next = new Set(modalServicios.seleccionados);
    next.has(id) ? next.delete(id) : next.add(id);
    setModalServicios({ ...modalServicios, seleccionados: next });
  }

  async function guardarServicios() {
    if (!modalServicios) return;
    setGuardandoServicios(true);
    const res = await fetch("/api/profesional-servicios", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profesional_id: modalServicios.prof.id,
        servicio_ids: Array.from(modalServicios.seleccionados),
      }),
    });
    setGuardandoServicios(false);
    if (!res.ok) { toast.error("Error al guardar"); return; }
    toast.success("Servicios guardados");
    setModalServicios(null);
  }

  async function abrirExcepciones(p: Profesional) {
    const res = await fetch(`/api/horario-excepciones?profesional_id=${p.id}`);
    const data = await res.json();
    setModalExcepciones({ prof: p, excepciones: Array.isArray(data) ? data : [] });
    setNuevaExcepcion({ fecha: "", hora_inicio: "10:00", hora_fin: "15:00", motivo: "" });
  }

  async function guardarExcepcion() {
    if (!modalExcepciones || !nuevaExcepcion.fecha) { toast.error("Indica la fecha"); return; }
    if (nuevaExcepcion.hora_fin <= nuevaExcepcion.hora_inicio) { toast.error("La hora de fin debe ser posterior"); return; }
    setGuardandoExcepcion(true);
    const res = await fetch("/api/horario-excepciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profesional_id: modalExcepciones.prof.id, ...nuevaExcepcion }),
    });
    setGuardandoExcepcion(false);
    if (!res.ok) { toast.error("Error al guardar"); return; }
    const data = await res.json();
    setModalExcepciones((prev) => prev ? {
      ...prev,
      excepciones: [...prev.excepciones.filter((e) => e.fecha !== data.fecha), data].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    } : null);
    setNuevaExcepcion({ fecha: "", hora_inicio: "10:00", hora_fin: "15:00", motivo: "" });
    toast.success("Excepción guardada");
  }

  async function eliminarExcepcion(id: string) {
    const res = await fetch(`/api/horario-excepciones?id=${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Error al eliminar"); return; }
    setModalExcepciones((prev) => prev ? { ...prev, excepciones: prev.excepciones.filter((e) => e.id !== id) } : null);
    toast.success("Excepción eliminada");
  }

  async function abrirHorarios(p: Profesional) {
    setCargandoHorarios(true);
    const res = await fetch(`/api/horario-profesional?profesional_id=${p.id}`);
    const data = await res.json();
    setCargandoHorarios(false);
    setModalHorarios({ prof: p, horarios: data });
  }

  async function actualizarHorario(h: HorarioProf, campo: keyof HorarioProf, valor: boolean | string) {
    if (!modalHorarios) return;
    setGuardandoDia(h.dia_semana);
    const res = await fetch("/api/horario-profesional", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: h.id, trabaja: campo === "trabaja" ? valor : h.trabaja, hora_inicio: campo === "hora_inicio" ? valor + ":00" : h.hora_inicio, hora_fin: campo === "hora_fin" ? valor + ":00" : h.hora_fin }),
    });
    if (!res.ok) { toast.error("Error al guardar horario"); setGuardandoDia(null); return; }
    setModalHorarios((prev) => prev ? {
      ...prev,
      horarios: prev.horarios.map((x) => x.id === h.id ? { ...x, [campo]: campo === "hora_inicio" || campo === "hora_fin" ? valor + ":00" : valor } : x),
    } : null);
    toast.success("Horario guardado");
    setGuardandoDia(null);
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: p.color }}>
                    {p.nombre[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1a1412]">{p.nombre}</p>
                    <p className="text-xs text-[#6b6360]">{p.especialidad}</p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border border-white shadow flex-shrink-0" style={{ backgroundColor: p.color }} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setEditando(p.id); setForm(p); setNuevo(false); }}
                  className="flex-1 text-xs border border-[#e8c5ce] py-1.5 rounded-xl text-[#6b6360] hover:text-[#C4728A] hover:border-[#C4728A] transition-colors flex items-center justify-center gap-1">
                  <Pencil size={12} /> Editar
                </button>
                <button onClick={() => abrirHorarios(p)} disabled={cargandoHorarios}
                  className="flex-1 text-xs border border-[#e8c5ce] py-1.5 rounded-xl text-[#6b6360] hover:text-[#C4728A] hover:border-[#C4728A] transition-colors flex items-center justify-center gap-1">
                  <Clock size={12} /> Horarios
                </button>
                <button onClick={() => abrirServicios(p)}
                  className="flex-1 text-xs border border-[#e8c5ce] py-1.5 rounded-xl text-[#6b6360] hover:text-[#C4728A] hover:border-[#C4728A] transition-colors flex items-center justify-center gap-1">
                  <Scissors size={12} /> Servicios
                </button>
                <button onClick={() => abrirExcepciones(p)}
                  className="flex-1 text-xs border border-[#e8c5ce] py-1.5 rounded-xl text-[#6b6360] hover:text-[#C4728A] hover:border-[#C4728A] transition-colors flex items-center justify-center gap-1">
                  <CalendarPlus size={12} /> Excepciones
                </button>
                <button onClick={() => toggleActivo(p)}
                  className={`flex-1 text-xs px-3 py-1.5 rounded-xl border transition-colors ${p.activo ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
                  {p.activo ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => toggleVisiblePublico(p)}
                  title={p.visible_publico ? "Ocultar de la web pública" : "Mostrar en la web pública"}
                  className={`flex-1 text-xs px-3 py-1.5 rounded-xl border transition-colors flex items-center justify-center gap-1 ${p.visible_publico ? "border-[#e8c5ce] text-[#6b6360] hover:border-[#C4728A] hover:text-[#C4728A]" : "border-amber-200 text-amber-600 hover:bg-amber-50"}`}>
                  {p.visible_publico ? <><Eye size={12} /> En web</> : <><EyeOff size={12} /> Oculta</>}
                </button>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Modal servicios */}
      {modalServicios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalServicios(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h3 className="font-heading text-lg text-[#1a1412]">Servicios de {modalServicios.prof.nombre}</h3>
                <p className="text-xs text-[#6b6360] mt-0.5">{modalServicios.seleccionados.size} servicio{modalServicios.seleccionados.size !== 1 ? "s" : ""} asignado{modalServicios.seleccionados.size !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setModalServicios(null)} className="text-[#6b6360] hover:text-[#1a1412]"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {CATEGORIAS_SERVICIOS.filter((cat) => servicios.some((s) => s.categoria === cat)).map((cat) => {
                const items = servicios.filter((s) => s.categoria === cat);
                const todosSeleccionados = items.every((s) => modalServicios.seleccionados.has(s.id));
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-[#1a1412] uppercase tracking-wide">{cat}</p>
                      <button
                        onClick={() => {
                          const next = new Set(modalServicios.seleccionados);
                          if (todosSeleccionados) {
                            items.forEach((s) => next.delete(s.id));
                          } else {
                            items.forEach((s) => next.add(s.id));
                          }
                          setModalServicios({ ...modalServicios, seleccionados: next });
                        }}
                        className="text-xs text-[#C4728A] hover:underline"
                      >
                        {todosSeleccionados ? "Quitar todos" : "Seleccionar todos"}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {items.map((s) => (
                        <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#fdf6f0] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={modalServicios.seleccionados.has(s.id)}
                            onChange={() => toggleServicio(s.id)}
                            className="w-4 h-4 accent-[#C4728A] cursor-pointer flex-shrink-0"
                          />
                          <span className="text-sm text-[#1a1412] flex-1">{s.nombre}</span>
                          <span className="text-xs text-[#6b6360] flex-shrink-0">{s.duracion_min} min</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-5 flex-shrink-0">
              <button onClick={() => setModalServicios(null)}
                className="flex-1 border border-[#e8c5ce] text-[#6b6360] py-2.5 rounded-xl text-sm hover:bg-[#f4f1ef] transition-colors">
                Cancelar
              </button>
              <button onClick={guardarServicios} disabled={guardandoServicios}
                className="flex-1 bg-[#C4728A] hover:bg-[#a85a72] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Check size={15} /> {guardandoServicios ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal excepciones de horario */}
      {modalExcepciones && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalExcepciones(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h3 className="font-heading text-lg text-[#1a1412]">Excepciones de {modalExcepciones.prof.nombre}</h3>
                <p className="text-xs text-[#6b6360] mt-0.5">Días con horario especial o días extra</p>
              </div>
              <button onClick={() => setModalExcepciones(null)} className="text-[#6b6360] hover:text-[#1a1412]"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4">
              {/* Añadir nueva excepción */}
              <div className="border border-[#e8c5ce] rounded-xl p-4 space-y-3 bg-[#fdf6f0]">
                <p className="text-xs font-semibold text-[#1a1412]">Añadir día especial</p>
                <div>
                  <label className="text-xs text-[#6b6360] block mb-1">Fecha</label>
                  <input type="date" value={nuevaExcepcion.fecha}
                    onChange={(e) => setNuevaExcepcion((p) => ({ ...p, fecha: e.target.value }))}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[#6b6360] block mb-1">Desde</label>
                    <input type="time" value={nuevaExcepcion.hora_inicio}
                      onChange={(e) => setNuevaExcepcion((p) => ({ ...p, hora_inicio: e.target.value }))}
                      className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b6360] block mb-1">Hasta</label>
                    <input type="time" value={nuevaExcepcion.hora_fin}
                      onChange={(e) => setNuevaExcepcion((p) => ({ ...p, hora_fin: e.target.value }))}
                      className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b6360] block mb-1">Motivo (opcional)</label>
                  <input type="text" value={nuevaExcepcion.motivo} placeholder="Ej: Horas extra sábado"
                    onChange={(e) => setNuevaExcepcion((p) => ({ ...p, motivo: e.target.value }))}
                    className="w-full border border-[#e8c5ce] rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none" />
                </div>
                <button onClick={guardarExcepcion} disabled={guardandoExcepcion || !nuevaExcepcion.fecha}
                  className="w-full bg-[#C4728A] hover:bg-[#a85a72] disabled:opacity-50 text-white py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Check size={14} /> {guardandoExcepcion ? "Guardando…" : "Guardar excepción"}
                </button>
              </div>

              {/* Lista de excepciones existentes */}
              {modalExcepciones.excepciones.length === 0 ? (
                <p className="text-sm text-[#6b6360] text-center py-4">Sin excepciones programadas</p>
              ) : (
                <div className="space-y-2">
                  {modalExcepciones.excepciones.map((exc) => (
                    <div key={exc.id} className="flex items-center justify-between gap-2 border border-[#e8c5ce] rounded-xl px-3 py-2.5 bg-white">
                      <div>
                        <p className="text-sm font-medium text-[#1a1412]">
                          {new Date(exc.fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs text-[#6b6360]">
                          {exc.hora_inicio.slice(0, 5)} – {exc.hora_fin.slice(0, 5)}
                          {exc.motivo ? ` · ${exc.motivo}` : ""}
                        </p>
                      </div>
                      <button onClick={() => eliminarExcepcion(exc.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setModalExcepciones(null)}
              className="mt-5 w-full border border-[#e8c5ce] text-[#6b6360] py-2.5 rounded-xl text-sm hover:bg-[#f4f1ef] transition-colors flex-shrink-0">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal horarios */}
      {modalHorarios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalHorarios(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-heading text-lg text-[#1a1412]">Horario de {modalHorarios.prof.nombre}</h3>
                <p className="text-xs text-[#6b6360] mt-0.5">Los clientes solo podrán reservar en los días y horas activos</p>
              </div>
              <button onClick={() => setModalHorarios(null)} className="text-[#6b6360] hover:text-[#1a1412]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {modalHorarios.horarios.map((h) => (
                <div key={h.dia_semana} className="flex items-center gap-3 py-2 border-b border-[#f4f1ef] last:border-0">
                  <p className="w-12 text-sm font-medium text-[#1a1412] flex-shrink-0">{DIAS_SEMANA[h.dia_semana]?.slice(0, 3)}</p>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={h.trabaja}
                      onChange={(e) => actualizarHorario(h, "trabaja", e.target.checked)} />
                    <div className="w-9 h-5 bg-[#e8c5ce] rounded-full peer peer-checked:bg-[#C4728A] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                  {h.trabaja ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="time" value={h.hora_inicio?.slice(0, 5) ?? "10:00"}
                        onChange={(e) => actualizarHorario(h, "hora_inicio", e.target.value)}
                        className="border border-[#e8c5ce] rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none flex-1" />
                      <span className="text-[#6b6360] text-sm">–</span>
                      <input type="time" value={h.hora_fin?.slice(0, 5) ?? "20:00"}
                        onChange={(e) => actualizarHorario(h, "hora_fin", e.target.value)}
                        className="border border-[#e8c5ce] rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-[#C4728A] focus:outline-none flex-1" />
                      {guardandoDia === h.dia_semana && <span className="text-xs text-[#6b6360]">...</span>}
                    </div>
                  ) : (
                    <span className="text-sm text-[#D4621A]">No trabaja</span>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setModalHorarios(null)}
              className="mt-5 w-full bg-[#C4728A] hover:bg-[#a85a72] text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
