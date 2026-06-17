"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format, parseISO, isBefore, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { Check } from "lucide-react";

interface ReservaInfo {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  servicios: { id: string; nombre: string; duracion_min: number; precio: number; precio_desde: boolean } | null;
  profesionales: { id: string; nombre: string } | null;
  clientes: { nombre: string } | null;
  variante: { id: string; nombre: string; duracion_min: number; precio: number } | null;
}

interface Servicio { id: string; nombre: string; categoria: string; duracion_min: number; precio: number; precio_desde: boolean; activo: boolean; }
interface Variante { id: string; nombre: string; duracion_min: number; precio: number; }
interface Slot { hora_inicio: string; hora_fin: string; disponible: boolean; }

type Vista = "cargando" | "error" | "detalle" | "modificar" | "cancelando" | "ok_cancelar" | "ok_modificar";

const hoy = new Date().toISOString().slice(0, 10);

export default function GestionReservaPage() {
  const params = useParams();
  const token = params.token as string;

  const [reserva, setReserva] = useState<ReservaInfo | null>(null);
  const [vista, setVista] = useState<Vista>("cargando");

  // Modification state
  const [paso, setPaso] = useState(0); // 0=servicio 1=variante 2=fecha+slot 3=confirmar
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioSel, setServicioSel] = useState<Servicio | null>(null);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [varianteSel, setVarianteSel] = useState<Variante | null>(null);
  const [fecha, setFecha] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotSel, setSlotSel] = useState<Slot | null>(null);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/reserva/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setVista("error"); return; }
        setReserva(data);
        setVista("detalle");
      })
      .catch(() => setVista("error"));
  }, [token]);

  async function iniciarModificacion() {
    if (!reserva?.profesionales?.id) return;
    const [resIds, resServicios] = await Promise.all([
      fetch(`/api/profesional-servicios?profesional_id=${reserva.profesionales.id}`).then(r => r.json()),
      fetch("/api/servicios").then(r => r.json()),
    ]);
    const ids = new Set<string>(Array.isArray(resIds) ? resIds : []);
    const todos: Servicio[] = Array.isArray(resServicios) ? resServicios.filter((s: Servicio) => s.activo) : [];
    setServicios(todos.filter(s => ids.has(s.id)));
    setBusqueda("");

    // Pre-fill current service
    const actual = todos.find(s => s.id === reserva.servicios?.id);
    setServicioSel(actual ?? null);
    setVarianteSel(reserva.variante ?? null);
    setVariantes([]);
    setFecha(reserva.fecha);
    setSlots([]);
    setSlotSel(null);
    setErrMsg("");
    setPaso(0);
    setVista("modificar");
  }

  async function seleccionarServicio(s: Servicio) {
    setServicioSel(s);
    setVarianteSel(null);
    setSlots([]);
    setSlotSel(null);
    if (s.precio_desde) {
      const vars = await fetch(`/api/servicio-variantes?servicio_id=${s.id}`).then(r => r.json());
      const lista: Variante[] = Array.isArray(vars) ? vars : [];
      setVariantes(lista);
      if (lista.length > 0) {
        setPaso(1);
      } else {
        setPaso(2);
        if (fecha) cargarSlots(fecha, s, null);
      }
    } else {
      setVariantes([]);
      setPaso(2);
      if (fecha) cargarSlots(fecha, s, null);
    }
  }

  async function cargarSlots(f: string, svc?: Servicio | null, vrnt?: Variante | null) {
    const servicio = svc !== undefined ? svc : servicioSel;
    const variante = vrnt !== undefined ? vrnt : varianteSel;
    if (!reserva?.profesionales?.id || !servicio) return;
    setFecha(f);
    setCargandoSlots(true);
    setSlots([]);
    setSlotSel(null);
    const dur = variante?.duracion_min ?? servicio.duracion_min;
    const res = await fetch(
      `/api/slots?profesional_id=${reserva.profesionales.id}&fecha=${f}&duracion_min=${dur}&exclude_reserva_id=${reserva.id}`
    );
    const data = await res.json();
    setSlots(Array.isArray(data) ? data : []);
    setCargandoSlots(false);
  }

  async function confirmarCancelacion() {
    setGuardando(true);
    const res = await fetch(`/api/reserva/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "cancelar" }),
    });
    setGuardando(false);
    if (!res.ok) { setErrMsg("Error al cancelar. Por favor inténtalo de nuevo."); return; }
    setVista("ok_cancelar");
  }

  async function confirmarModificacion() {
    if (!servicioSel || !slotSel || !fecha) return;
    setGuardando(true);
    setErrMsg("");
    const res = await fetch(`/api/reserva/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicio_id: servicioSel.id,
        variante_id: varianteSel?.id ?? null,
        fecha,
        hora_inicio: slotSel.hora_inicio + ":00",
        hora_fin: slotSel.hora_fin + ":00",
      }),
    });
    setGuardando(false);
    if (!res.ok) {
      setErrMsg("Error al modificar. Por favor inténtalo de nuevo.");
      return;
    }
    setVista("ok_modificar");
  }

  const esPasada = reserva ? isBefore(new Date(`${reserva.fecha}T${reserva.hora_inicio}`), new Date()) : false;
  const menosDe24h = reserva ? isBefore(new Date(`${reserva.fecha}T${reserva.hora_inicio}`), addHours(new Date(), 24)) : false;

  const fechaFormateada = (f: string) =>
    format(parseISO(f), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  const serviciosFiltrados = servicios.filter(s =>
    !busqueda || s.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(
      busqueda.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    )
  );

  const categorias = [...new Set(serviciosFiltrados.map(s => s.categoria))];

  return (
    <main className="min-h-screen bg-[#fdf6f0] font-sans">
      {/* Header */}
      <div className="bg-[#1a1412] px-4 py-5 text-center">
        <p className="text-[#C4728A] text-xs font-bold tracking-widest uppercase mb-1">Beauty Room Nini</p>
        <p className="text-[#a08880] text-xs">Alcobendas · Madrid</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">

        {/* Cargando */}
        {vista === "cargando" && (
          <div className="flex flex-col items-center gap-3 py-16 text-[#6b6360]">
            <div className="w-8 h-8 rounded-full border-2 border-[#C4728A] border-t-transparent animate-spin" />
            <p className="text-sm">Cargando tu cita...</p>
          </div>
        )}

        {/* Error */}
        {vista === "error" && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h1 className="font-heading text-xl text-[#1a1412] mb-2">Cita no encontrada</h1>
            <p className="text-sm text-[#6b6360]">El enlace puede haber expirado o ser incorrecto.</p>
            <a href="https://wa.me/34604850249" className="inline-block mt-6 bg-[#25D366] text-white px-5 py-3 rounded-xl text-sm font-bold">
              💬 Contactar por WhatsApp
            </a>
          </div>
        )}

        {/* Detalle */}
        {vista === "detalle" && reserva && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex bg-[#f7e8ed] rounded-full w-14 h-14 items-center justify-center text-2xl mb-3">🌸</div>
              <h1 className="font-heading text-xl text-[#1a1412]">Tu cita</h1>
              {reserva.clientes?.nombre && (
                <p className="text-sm text-[#6b6360] mt-1">Hola, <strong className="text-[#1a1412]">{reserva.clientes.nombre}</strong></p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e8c5ce] p-5 mb-5">
              <p className="text-[#C4728A] text-xs font-bold tracking-widest uppercase mb-3">Detalles</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b6360]">Servicio</span>
                  <span className="font-semibold text-[#1a1412] text-right max-w-[60%]">
                    {reserva.servicios?.nombre ?? "—"}
                    {reserva.variante ? ` — ${reserva.variante.nombre}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b6360]">Profesional</span>
                  <span className="font-semibold text-[#1a1412]">{reserva.profesionales?.nombre ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b6360]">Fecha</span>
                  <span className="font-semibold text-[#1a1412] capitalize text-right max-w-[60%]">
                    {fechaFormateada(reserva.fecha)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b6360]">Hora</span>
                  <span className="font-semibold text-[#1a1412]">{reserva.hora_inicio.slice(0, 5)} h</span>
                </div>
              </div>
            </div>

            {reserva.estado === "cancelada" ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-red-600 font-semibold text-sm">Esta cita fue cancelada</p>
                <a href="/" className="inline-block mt-3 text-[#C4728A] text-sm font-medium">Hacer nueva reserva →</a>
              </div>
            ) : esPasada ? (
              <div className="bg-[#f4f1ef] border border-[#e8c5ce] rounded-2xl p-4 text-center">
                <p className="text-[#6b6360] text-sm">Esta cita ya ha pasado.</p>
                <a href="/" className="inline-block mt-3 text-[#C4728A] text-sm font-medium">Hacer nueva reserva →</a>
              </div>
            ) : menosDe24h ? (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <p className="text-amber-700 text-sm font-medium">Tu cita es en menos de 24 horas</p>
                  <p className="text-amber-600 text-xs mt-1">Para cambios con tan poca antelación, contáctanos directamente.</p>
                </div>
                <a href="https://wa.me/34604850249?text=Hola%2C+necesito+cambiar+mi+cita"
                   className="block w-full bg-[#25D366] text-white text-center py-3 rounded-xl text-sm font-bold">
                  💬 Contactar por WhatsApp
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={iniciarModificacion}
                  className="w-full bg-[#C4728A] hover:bg-[#a85a72] text-white py-3 rounded-xl text-sm font-bold transition-colors">
                  Modificar cita
                </button>
                <button onClick={() => { setErrMsg(""); setVista("cancelando"); }}
                  className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-xl text-sm font-medium transition-colors">
                  Cancelar cita
                </button>
              </div>
            )}
          </div>
        )}

        {/* Confirmar cancelación */}
        {vista === "cancelando" && reserva && (
          <div className="text-center">
            <div className="inline-flex bg-red-100 rounded-full w-14 h-14 items-center justify-center text-2xl mb-4">⚠️</div>
            <h1 className="font-heading text-xl text-[#1a1412] mb-2">¿Cancelar tu cita?</h1>
            <p className="text-sm text-[#6b6360] mb-2">
              {reserva.servicios?.nombre}{reserva.variante ? ` — ${reserva.variante.nombre}` : ""}
            </p>
            <p className="text-sm text-[#6b6360] capitalize mb-6">
              {fechaFormateada(reserva.fecha)} a las {reserva.hora_inicio.slice(0, 5)} h
            </p>
            {errMsg && <p className="text-red-500 text-sm mb-4">{errMsg}</p>}
            <div className="space-y-3">
              <button onClick={confirmarCancelacion} disabled={guardando}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-colors">
                {guardando ? "Cancelando..." : "Sí, cancelar mi cita"}
              </button>
              <button onClick={() => setVista("detalle")}
                className="w-full border border-[#e8c5ce] text-[#6b6360] py-3 rounded-xl text-sm hover:bg-[#f4f1ef] transition-colors">
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Éxito cancelación */}
        {vista === "ok_cancelar" && (
          <div className="text-center py-8">
            <div className="inline-flex bg-[#f4f1ef] rounded-full w-16 h-16 items-center justify-center text-3xl mb-4">✓</div>
            <h1 className="font-heading text-xl text-[#1a1412] mb-2">Cita cancelada</h1>
            <p className="text-sm text-[#6b6360] mb-6">Tu cita ha sido cancelada correctamente. Esperamos verte pronto.</p>
            <a href="/" className="inline-block bg-[#C4728A] text-white px-6 py-3 rounded-xl text-sm font-bold">
              Hacer nueva reserva
            </a>
          </div>
        )}

        {/* Modificar — flujo por pasos */}
        {vista === "modificar" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setVista("detalle")} className="text-[#6b6360] hover:text-[#1a1412] text-xl leading-none">←</button>
              <h1 className="font-heading text-lg text-[#1a1412]">Modificar cita</h1>
            </div>

            {/* Paso 0: Servicio */}
            <div className="mb-5">
              <p className="text-xs font-bold text-[#C4728A] uppercase tracking-wide mb-3">1. Servicio</p>
              {paso === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e8c5ce] overflow-hidden">
                  <div className="p-3 border-b border-[#f4f1ef]">
                    <input
                      type="search"
                      placeholder="Buscar servicio..."
                      value={busqueda}
                      onChange={e => setBusqueda(e.target.value)}
                      className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {categorias.map(cat => (
                      <div key={cat}>
                        <p className="px-3 py-2 text-xs font-bold text-[#6b6360] uppercase tracking-wide bg-[#fdf6f0]">{cat}</p>
                        {serviciosFiltrados.filter(s => s.categoria === cat).map(s => (
                          <button key={s.id} onClick={() => seleccionarServicio(s)}
                            className="w-full text-left px-3 py-2.5 text-sm border-b border-[#f4f1ef] last:border-0 hover:bg-[#f7e8ed] flex justify-between items-center">
                            <span className="text-[#1a1412] font-medium">{s.nombre}</span>
                            <span className="text-xs text-[#6b6360] ml-2 flex-shrink-0">
                              {s.precio_desde ? `desde ${Number(s.precio).toFixed(0)} €` : `${Number(s.precio).toFixed(2)} €`}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                    {serviciosFiltrados.length === 0 && (
                      <p className="text-sm text-[#6b6360] text-center py-6">Sin resultados</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white rounded-xl border border-[#C4728A] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1a1412]">{servicioSel?.nombre}</p>
                    {varianteSel && <p className="text-xs text-[#6b6360]">{varianteSel.nombre}</p>}
                  </div>
                  <button onClick={() => { setPaso(0); setVarianteSel(null); setSlots([]); setSlotSel(null); }}
                    className="text-xs text-[#C4728A] font-medium">Cambiar</button>
                </div>
              )}
            </div>

            {/* Paso 1: Variante */}
            {paso >= 1 && variantes.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-[#C4728A] uppercase tracking-wide mb-3">2. Tamaño</p>
                {paso === 1 ? (
                  <div className="space-y-2">
                    {variantes.map(v => (
                      <button key={v.id} onClick={() => {
                        setVarianteSel(v);
                        setPaso(2);
                        if (fecha) cargarSlots(fecha, servicioSel, v);
                      }}
                        className="w-full flex items-center justify-between bg-white border border-[#e8c5ce] hover:border-[#C4728A] rounded-xl px-4 py-3 transition-colors">
                        <span className="text-sm font-medium text-[#1a1412]">{v.nombre}</span>
                        <span className="text-sm font-bold text-[#C4728A]">{Number(v.precio).toFixed(2)} €</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white rounded-xl border border-[#C4728A] px-4 py-3">
                    <p className="text-sm font-semibold text-[#1a1412]">{varianteSel?.nombre}</p>
                    <button onClick={() => { setPaso(1); setSlots([]); setSlotSel(null); }}
                      className="text-xs text-[#C4728A] font-medium">Cambiar</button>
                  </div>
                )}
              </div>
            )}

            {/* Paso 2: Fecha y hora */}
            {paso >= 2 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-[#C4728A] uppercase tracking-wide mb-3">{variantes.length > 0 ? "3." : "2."} Fecha y hora</p>
                <input
                  type="date"
                  value={fecha}
                  min={hoy}
                  onChange={e => cargarSlots(e.target.value)}
                  className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
                />
                {cargandoSlots ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 rounded-full border-2 border-[#C4728A] border-t-transparent animate-spin" />
                  </div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button key={slot.hora_inicio} disabled={!slot.disponible}
                        onClick={() => { setSlotSel(slot); setPaso(3); }}
                        className={`text-xs py-2.5 rounded-xl border transition-colors ${
                          !slot.disponible ? "opacity-30 cursor-not-allowed border-[#e8c5ce] bg-[#f4f1ef]" :
                          slotSel?.hora_inicio === slot.hora_inicio ? "bg-[#C4728A] text-white border-[#C4728A]" :
                          "border-[#e8c5ce] hover:border-[#C4728A] hover:text-[#C4728A] bg-white"
                        }`}>
                        {slot.hora_inicio}
                      </button>
                    ))}
                  </div>
                ) : fecha ? (
                  <p className="text-sm text-[#6b6360] text-center py-2">Sin horas disponibles para este día.</p>
                ) : null}
              </div>
            )}

            {/* Paso 3: Confirmar */}
            {paso >= 3 && slotSel && (
              <div className="mb-5">
                <p className="text-xs font-bold text-[#C4728A] uppercase tracking-wide mb-3">{variantes.length > 0 ? "4." : "3."} Confirmar cambio</p>
                <div className="bg-[#1a1412] rounded-2xl p-4 text-white text-sm mb-4">
                  <p className="text-[#C4728A] font-semibold mb-2 text-xs uppercase tracking-wide">Nueva cita</p>
                  <p className="text-[#f7e8ed]">{servicioSel?.nombre}{varianteSel ? ` — ${varianteSel.nombre}` : ""}</p>
                  <p className="text-[#f7e8ed] capitalize mt-1">{fechaFormateada(fecha)}</p>
                  <p className="text-[#f7e8ed]">a las {slotSel.hora_inicio} h</p>
                  <p className="text-[#C4728A] font-bold mt-1">
                    {Number(varianteSel?.precio ?? servicioSel?.precio ?? 0).toFixed(2)} €
                  </p>
                </div>
                {errMsg && <p className="text-red-500 text-sm mb-3">{errMsg}</p>}
                <button onClick={confirmarModificacion} disabled={guardando}
                  className="w-full bg-[#C4728A] hover:bg-[#a85a72] disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                  <Check size={16} /> {guardando ? "Guardando..." : "Confirmar cambio"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Éxito modificación */}
        {vista === "ok_modificar" && (
          <div className="text-center py-8">
            <div className="inline-flex bg-green-100 rounded-full w-16 h-16 items-center justify-center text-3xl mb-4">✓</div>
            <h1 className="font-heading text-xl text-[#1a1412] mb-2">¡Cita modificada!</h1>
            <p className="text-sm text-[#6b6360] mb-2">Tu cita ha sido actualizada.</p>
            {reserva && (
              <div className="bg-white rounded-2xl border border-[#e8c5ce] p-4 text-left mt-4 mb-6 text-sm">
                <p className="font-semibold text-[#1a1412]">
                  {servicioSel?.nombre ?? reserva.servicios?.nombre}
                  {varianteSel ? ` — ${varianteSel.nombre}` : ""}
                </p>
                <p className="text-[#6b6360] capitalize mt-1">{fechaFormateada(fecha || reserva.fecha)}</p>
                <p className="text-[#6b6360]">a las {slotSel?.hora_inicio ?? reserva.hora_inicio.slice(0, 5)} h</p>
              </div>
            )}
            <a href="/" className="inline-block bg-[#C4728A] text-white px-6 py-3 rounded-xl text-sm font-bold">
              Volver al inicio
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-[#a08880]">📞 604 850 249 · beautyroomnini.es</p>
          <p className="text-xs text-[#c8bfbb] mt-1">C. de la Constitución, 53 · Alcobendas</p>
        </div>
      </div>
    </main>
  );
}
