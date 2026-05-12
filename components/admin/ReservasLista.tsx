"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import type { Reserva, Profesional, EstadoReserva } from "@/types";
import { NuevaReservaModal } from "./NuevaReservaModal";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

const COLORES_ESTADO: Record<EstadoReserva, string> = {
  pendiente:     "bg-amber-100 text-amber-700",
  confirmada:    "bg-green-100 text-green-700",
  completada:    "bg-gray-100 text-gray-600",
  cancelada:     "bg-red-100 text-red-600",
  no_presentada: "bg-orange-100 text-orange-700",
};

const POR_PAGINA = 20;

interface Props {
  reservasIniciales: Reserva[];
  profesionales: Profesional[];
}

export function ReservasLista({ reservasIniciales, profesionales }: Props) {
  const [reservas, setReservas] = useState(reservasIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [filtroProf, setFiltroProf] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modalNueva, setModalNueva] = useState(false);

  const filtradas = reservas.filter((r) => {
    const nombreCliente = r.clientes?.nombre?.toLowerCase() ?? "";
    const porBusqueda = !busqueda || nombreCliente.includes(busqueda.toLowerCase());
    const porProf = !filtroProf || r.profesional_id === filtroProf;
    const porEstado = !filtroEstado || r.estado === filtroEstado;
    const porFecha = !filtroFecha || r.fecha === filtroFecha;
    return porBusqueda && porProf && porEstado && porFecha;
  });

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginadas = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  async function cambiarEstado(id: string, nuevoEstado: EstadoReserva) {
    const supabase = createClient();
    const { error } = await supabase.from("reservas").update({ estado: nuevoEstado }).eq("id", id);
    if (error) { toast.error("Error al actualizar"); return; }
    setReservas((prev) => prev.map((r) => r.id === id ? { ...r, estado: nuevoEstado } : r));
    toast.success("Estado actualizado");
  }

  function onReservaCreada(nueva: Reserva) {
    setReservas((prev) => [nueva, ...prev]);
    setModalNueva(false);
    toast.success("Reserva creada");
  }

  function resetFiltros() {
    setBusqueda(""); setFiltroProf(""); setFiltroEstado(""); setFiltroFecha(""); setPagina(1);
  }

  const hayFiltros = busqueda || filtroProf || filtroEstado || filtroFecha;

  return (
    <div>
      {/* Controles */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <input
          type="search"
          placeholder="Buscar cliente..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          className="border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white flex-1 min-w-[140px]"
        />
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => { setFiltroFecha(e.target.value); setPagina(1); }}
          className="border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
        />
        <select
          value={filtroProf}
          onChange={(e) => { setFiltroProf(e.target.value); setPagina(1); }}
          className="border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
        >
          <option value="">Todas</option>
          {profesionales.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
          className="border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
          <option value="no_presentada">No presentada</option>
        </select>
        {hayFiltros && (
          <button onClick={resetFiltros} className="text-xs text-[#6b6360] underline">Limpiar</button>
        )}
        <button
          onClick={() => setModalNueva(true)}
          className="flex items-center gap-1.5 bg-[#C4728A] hover:bg-[#a85a72] text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors ml-auto"
        >
          <Plus size={16} /> Nueva reserva
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-[#e8c5ce] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f7e8ed] text-[#1a1412]">
                <th className="text-left px-4 py-3 font-semibold">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Servicio</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Profesional</th>
                <th className="text-left px-4 py-3 font-semibold">Fecha / Hora</th>
                <th className="text-left px-4 py-3 font-semibold">Estado</th>
                <th className="text-left px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginadas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#6b6360]">
                    Sin reservas con estos filtros
                  </td>
                </tr>
              )}
              {paginadas.map((r) => {
                const prof = profesionales.find((p) => p.id === r.profesional_id);
                return (
                  <tr key={r.id} className="border-t border-[#f4f1ef] hover:bg-[#fdf6f0] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1a1412]">{r.clientes?.nombre ?? "—"}</p>
                      <p className="text-xs text-[#6b6360]">{r.clientes?.telefono}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#1a1412]">
                      <p>{r.servicios?.nombre ?? "—"}</p>
                      {r.servicios && (
                        <p className="text-xs text-[#C4728A]">{Number(r.servicios.precio).toFixed(2)} €</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {prof && (
                        <span className="flex items-center gap-1.5 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: prof.color }} />
                          {prof.nombre}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#1a1412]">
                      <p className="capitalize">{format(parseISO(r.fecha), "d MMM", { locale: es })}</p>
                      <p className="text-xs text-[#6b6360]">{r.hora_inicio.slice(0, 5)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${COLORES_ESTADO[r.estado as EstadoReserva]}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {r.estado !== "cancelada" && r.estado !== "completada" && r.estado !== "no_presentada" && (
                          <button onClick={() => cambiarEstado(r.id, "no_presentada")}
                            className="text-xs bg-orange-500 text-white px-2 py-1 rounded-lg hover:bg-orange-600 transition-colors">
                            Inasistencia
                          </button>
                        )}
                        {r.estado !== "cancelada" && r.estado !== "completada" && r.estado !== "no_presentada" && (
                          <button onClick={() => cambiarEstado(r.id, "cancelada")}
                            className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación + contador */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-[#6b6360]">{filtradas.length} reservas · página {pagina} de {Math.max(totalPaginas, 1)}</p>
        {totalPaginas > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="p-1.5 border border-[#e8c5ce] rounded-lg disabled:opacity-40 hover:border-[#C4728A] transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="p-1.5 border border-[#e8c5ce] rounded-lg disabled:opacity-40 hover:border-[#C4728A] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {modalNueva && (
        <NuevaReservaModal
          open={modalNueva}
          onClose={() => setModalNueva(false)}
          fechaInicial={new Date()}
          profesionales={profesionales}
          onCreada={onReservaCreada}
        />
      )}
    </div>
  );
}
