"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { format, parseISO, isBefore, startOfDay, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { obtenerSlotsDisponibles } from "@/lib/disponibilidad";
import type { Servicio, Profesional, ProfesionalServicio, SlotDisponible } from "@/types";
import { CATEGORIAS_SERVICIOS, ICONOS_CATEGORIA } from "@/types";
import { Check } from "lucide-react";

const stepTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };
const stepVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};
const cardHover = { scale: 1.02 } as const;
const cardTap   = { scale: 0.98 } as const;

const PASOS = ["Servicio", "Profesional", "Fecha y hora", "Confirmar"];

interface Props {
  servicios: Servicio[];
  profesionales: Profesional[];
  profesionalServicios: ProfesionalServicio[];
  servicioIdInicial?: string;
  profesionalIdInicial?: string;
}

export function ReservaFlujo({ servicios, profesionales, profesionalServicios, servicioIdInicial, profesionalIdInicial }: Props) {
  const router = useRouter();
  const servicioInicial = servicioIdInicial ? servicios.find((s) => s.id === servicioIdInicial) ?? null : null;
  const profesionalInicial = profesionalIdInicial ? profesionales.find((p) => p.id === profesionalIdInicial) ?? null : null;
  const pasoinicial = servicioInicial && profesionalInicial ? 2 : servicioInicial ? 1 : 0;
  const [paso, setPaso] = useState(pasoinicial);
  const [servicioSel, setServicioSel] = useState<Servicio | null>(servicioInicial);
  const [profesionalSel, setProfesionalSel] = useState<Profesional | null>(profesionalInicial);
  const [cualquiera, setCualquiera] = useState(false);
  const [fecha, setFecha] = useState("");
  const [slotSel, setSlotSel] = useState<SlotDisponible | null>(null);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoy = new Date();
    return { year: hoy.getFullYear(), month: hoy.getMonth() };
  });

  async function cargarSlots(profId: string, fechaStr: string) {
    if (!servicioSel) return;
    setCargandoSlots(true);
    const s = await obtenerSlotsDisponibles(profId, fechaStr, servicioSel.duracion_min);
    setSlots(s);
    setCargandoSlots(false);
  }

  async function seleccionarFecha(fechaStr: string) {
    setFecha(fechaStr);
    setSlotSel(null);
    setSlots([]);
    if (cualquiera) {
      const profId = profesionalesDelServicio[0]?.id;
      if (profId) await cargarSlots(profId, fechaStr);
    } else if (profesionalSel) {
      await cargarSlots(profesionalSel.id, fechaStr);
    }
  }

  async function confirmarReserva() {
    if (!slotSel || !servicioSel || !nombre) return;
    setEnviando(true);
    const supabase = createClient();

    // Buscar o crear cliente
    let clienteId: string;
    const { data: existente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefono", telefono)
      .maybeSingle();

    if (existente) {
      clienteId = existente.id;

      // Rate limit: máximo 3 reservas hoy por este cliente
      const hoy = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("reservas")
        .select("id", { count: "exact", head: true })
        .eq("cliente_id", clienteId)
        .eq("fecha", hoy)
        .neq("estado", "cancelada");
      if ((count ?? 0) >= 3) {
        setEnviando(false);
        alert("Has alcanzado el máximo de reservas para hoy. Llámanos para más información.");
        return;
      }
    } else {
      const { data: nuevo } = await supabase
        .from("clientes")
        .insert({ nombre, telefono, email })
        .select()
        .single();
      clienteId = nuevo?.id;
    }

    const profId = cualquiera ? profesionalesDelServicio[0]?.id : profesionalSel?.id;

    await supabase.from("reservas").insert({
      cliente_id: clienteId,
      profesional_id: profId,
      servicio_id: servicioSel.id,
      fecha,
      hora_inicio: slotSel.hora_inicio + ":00",
      hora_fin: slotSel.hora_fin + ":00",
      estado: "pendiente",
    });

    // Enviar email si hay email
    if (email && profId) {
      const profNombre = cualquiera ? "Cualquier profesional" : (profesionalSel?.nombre ?? "");
      await fetch("/api/email-confirmacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteEmail: email,
          clienteNombre: nombre,
          servicio: servicioSel.nombre,
          profesional: profNombre,
          fecha,
          horaInicio: slotSel.hora_inicio,
          duracionMin: servicioSel.duracion_min,
          precio: servicioSel.precio,
        }),
      });
    }

    router.push("/reservar/confirmacion");
  }

  // Calendario
  const diasEnMes = new Date(mesCalendario.year, mesCalendario.month + 1, 0).getDate();
  const primerDiaSemana = new Date(mesCalendario.year, mesCalendario.month, 1).getDay();
  const hoy = startOfDay(new Date());

  const profesionalesDelServicio = useMemo(() => {
    if (!servicioSel) return profesionales;
    const ids = new Set(
      profesionalServicios
        .filter((ps) => ps.servicio_id === servicioSel.id)
        .map((ps) => ps.profesional_id)
    );
    return profesionales.filter((p) => ids.has(p.id));
  }, [servicioSel, profesionales, profesionalServicios]);

  const serviciosFiltrados = servicios.filter((s) => {
    const porBusqueda = !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const porCategoria = !categoriaFiltro || s.categoria === categoriaFiltro;
    return porBusqueda && porCategoria;
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Barra de progreso */}
      <div className="flex items-center justify-between mb-8">
        {PASOS.map((p, i) => (
          <div key={p} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  i < paso
                    ? "bg-[#C4728A] border-[#C4728A] text-white"
                    : i === paso
                    ? "border-[#C4728A] text-[#C4728A] shadow-[0_0_0_3px_rgba(196,114,138,0.2)]"
                    : "border-[#e8c5ce] text-[#6b6360]"
                }`}
                animate={i < paso ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {i < paso ? <Check size={14} /> : i + 1}
              </motion.div>
              <span className={`text-xs mt-1 hidden sm:block ${i === paso ? "text-[#C4728A] font-medium" : "text-[#6b6360]"}`}>
                {p}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className="relative h-0.5 w-8 sm:w-16 mx-1 bg-[#e8c5ce] overflow-hidden rounded-full">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-[#C4728A] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: i < paso ? "100%" : "0%" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
      {/* PASO 1 — Servicio */}
      {paso === 0 && (
        <motion.div key="step-0" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-4">Elige tu servicio</h2>
          <input
            type="search"
            placeholder="Buscar servicio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-[#e8c5ce] rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
          />
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setCategoriaFiltro(null)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                !categoriaFiltro ? "bg-[#C4728A] text-white border-[#C4728A]" : "border-[#e8c5ce] text-[#6b6360]"
              }`}
            >
              Todos
            </button>
            {CATEGORIAS_SERVICIOS.filter((c) => servicios.some((s) => s.categoria === c)).map((c) => (
              <button
                key={c}
                onClick={() => setCategoriaFiltro(c === categoriaFiltro ? null : c)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  categoriaFiltro === c ? "bg-[#C4728A] text-white border-[#C4728A]" : "border-[#e8c5ce] text-[#6b6360]"
                }`}
              >
                {ICONOS_CATEGORIA[c]} {c}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {serviciosFiltrados.map((s) => (
              <motion.button
                key={s.id}
                whileHover={cardHover}
                whileTap={cardTap}
                onClick={() => { setServicioSel(s); setPaso(1); }}
                className={`w-full text-left bg-white rounded-2xl border p-4 flex items-center justify-between transition-colors shadow-sm ${
                  servicioSel?.id === s.id ? "border-[#C4728A] ring-2 ring-[#C4728A]/20" : "border-[#e8c5ce]"
                }`}
              >
                <div>
                  <p className="font-medium text-[#1a1412]">{s.nombre}</p>
                  <p className="text-xs text-[#6b6360]">{s.categoria} · {s.duracion_min} min</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-bold text-[#C4728A]">
                    {s.precio_desde ? `desde ${Number(s.precio).toFixed(0)} €` : `${Number(s.precio).toFixed(2)} €`}
                  </p>
                  <p className="text-xs text-[#C4728A]">Elegir →</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* PASO 2 — Profesional */}
      {paso === 1 && (
        <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-2">Elige tu profesional</h2>
          {servicioSel && (
            <p className="text-xs text-[#6b6360] mb-4">
              Para <span className="font-medium text-[#C4728A]">{servicioSel.nombre}</span>
              {" · "}{profesionalesDelServicio.length} disponible{profesionalesDelServicio.length !== 1 ? "s" : ""}
            </p>
          )}
          <div className="space-y-3">
            {/* Cualquiera */}
            <motion.button
              whileHover={cardHover}
              whileTap={cardTap}
              onClick={() => { setCualquiera(true); setProfesionalSel(null); setPaso(2); }}
              className="w-full bg-[#f7e8ed] border-2 border-[#C4728A]/30 rounded-2xl p-4 text-left hover:border-[#C4728A] transition-colors"
            >
              <p className="font-semibold text-[#1a1412]">🌸 Cualquier profesional</p>
              <p className="text-xs text-[#6b6360] mt-0.5">Se asignará automáticamente la primera disponible</p>
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              {profesionalesDelServicio.map((p) => (
                <motion.button
                  key={p.id}
                  whileHover={cardHover}
                  whileTap={cardTap}
                  onClick={() => { setProfesionalSel(p); setCualquiera(false); setPaso(2); }}
                  className={`bg-white rounded-2xl border p-4 text-center transition-colors ${
                    !cualquiera && profesionalSel?.id === p.id
                      ? "border-[#C4728A] ring-2 ring-[#C4728A]/20"
                      : "border-[#e8c5ce]"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.nombre[0]}
                  </div>
                  <p className="font-medium text-[#1a1412] text-sm">{p.nombre}</p>
                  <p className="text-xs text-[#6b6360]">{p.especialidad}</p>
                  <p className="text-xs text-amber-500 mt-1">⭐ 5.0</p>
                </motion.button>
              ))}
            </div>
          </div>
          <button onClick={() => setPaso(0)} className="mt-4 text-sm text-[#6b6360] hover:text-[#C4728A]">
            ← Volver
          </button>
        </motion.div>
      )}

      {/* PASO 3 — Fecha y hora */}
      {paso === 2 && (
        <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-4">Elige fecha y hora</h2>

          {/* Calendario */}
          <div className="bg-white rounded-2xl border border-[#e8c5ce] p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setMesCalendario((m) => {
                  const d = new Date(m.year, m.month - 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}
                className="text-[#6b6360] hover:text-[#C4728A] px-2 py-1"
              >
                ‹
              </button>
              <p className="font-semibold text-[#1a1412] capitalize">
                {format(new Date(mesCalendario.year, mesCalendario.month, 1), "MMMM yyyy", { locale: es })}
              </p>
              <button
                onClick={() => setMesCalendario((m) => {
                  const d = new Date(m.year, m.month + 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}
                className="text-[#6b6360] hover:text-[#C4728A] px-2 py-1"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-[#6b6360] mb-2">
              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map((d) => (
                <div key={d} className="py-1 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-sm">
              {/* Espacios vacíos inicio */}
              {Array.from({ length: primerDiaSemana === 0 ? 6 : primerDiaSemana - 1 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: diasEnMes }).map((_, i) => {
                const dia = i + 1;
                const fechaStr = format(new Date(mesCalendario.year, mesCalendario.month, dia), "yyyy-MM-dd");
                const diaSemana = getDay(new Date(fechaStr));
                const esDomingo = diaSemana === 0;
                const esPasado = isBefore(new Date(fechaStr), hoy);
                const seleccionado = fecha === fechaStr;
                const deshabilitado = esDomingo || esPasado;

                return (
                  <button
                    key={dia}
                    disabled={deshabilitado}
                    onClick={() => seleccionarFecha(fechaStr)}
                    className={`py-2 rounded-lg text-sm transition-colors ${
                      deshabilitado
                        ? "text-[#e8c5ce] cursor-not-allowed"
                        : seleccionado
                        ? "bg-[#C4728A] text-white font-semibold"
                        : "hover:bg-[#f7e8ed] text-[#1a1412]"
                    }`}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots de hora */}
          {cargandoSlots && (
            <p className="text-center text-[#6b6360] text-sm py-4">Cargando horarios...</p>
          )}
          {!cargandoSlots && fecha && slots.length === 0 && (
            <p className="text-center text-[#6b6360] text-sm py-4">Sin horas disponibles este día</p>
          )}
          {!cargandoSlots && slots.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[#1a1412] mb-2">Horas disponibles</p>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <motion.button
                    key={slot.hora_inicio}
                    disabled={!slot.disponible}
                    whileHover={slot.disponible ? cardHover : {}}
                    whileTap={slot.disponible ? cardTap : {}}
                    onClick={() => setSlotSel(slot)}
                    className={`text-sm py-2.5 rounded-xl border transition-colors ${
                      !slot.disponible
                        ? "opacity-30 cursor-not-allowed border-[#e8c5ce] bg-[#f4f1ef]"
                        : slotSel?.hora_inicio === slot.hora_inicio
                        ? "bg-[#C4728A] text-white border-[#C4728A]"
                        : "border-[#e8c5ce] hover:border-[#C4728A] hover:text-[#C4728A] bg-white"
                    }`}
                  >
                    {slot.hora_inicio}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setPaso(1)} className="flex-1 border border-[#e8c5ce] text-[#6b6360] py-2.5 rounded-xl text-sm hover:bg-[#f4f1ef] transition-colors">
              ← Volver
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPaso(3)}
              disabled={!slotSel}
              className="flex-1 bg-[#C4728A] hover:bg-[#a85a72] text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-40 transition-colors"
            >
              Continuar →
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* PASO 4 — Confirmar */}
      {paso === 3 && servicioSel && slotSel && (
        <motion.div key="step-3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-4">Confirmar reserva</h2>

          {/* Resumen */}
          <div className="bg-[#1a1412] text-white rounded-2xl p-5 mb-6">
            <p className="text-[#C4728A] font-semibold mb-3">Resumen de tu cita</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Servicio</span>
                <span className="font-medium">{servicioSel.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Profesional</span>
                <span className="font-medium">{cualquiera ? "Cualquier profesional" : profesionalSel?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Fecha</span>
                <span className="font-medium capitalize">
                  {format(parseISO(fecha), "EEEE d MMM", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Hora</span>
                <span className="font-medium">{slotSel.hora_inicio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Duración</span>
                <span className="font-medium">{servicioSel.duracion_min} min</span>
              </div>
              <div className="flex justify-between border-t border-[#ffffff10] pt-2 mt-2">
                <span className="text-[#6b6360]">Precio</span>
                <span className="font-bold text-[#C4728A] text-lg">
                  {servicioSel.precio_desde ? `desde ${Number(servicioSel.precio).toFixed(0)} €` : `${Number(servicioSel.precio).toFixed(2)} €`}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario cliente */}
          <div className="space-y-3 mb-6">
            <p className="font-medium text-[#1a1412]">Tus datos</p>
            <input
              type="text"
              placeholder="Nombre completo *"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-[#e8c5ce] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full border border-[#e8c5ce] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
            />
            <input
              type="email"
              placeholder="Email (para confirmación)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#e8c5ce] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={confirmarReserva}
            disabled={enviando || !nombre}
            className="w-full bg-[#C4728A] hover:bg-[#a85a72] text-white py-3.5 rounded-2xl font-semibold text-base disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} /> {enviando ? "Confirmando..." : "Confirmar reserva"}
          </motion.button>
          <p className="text-xs text-center text-[#6b6360] mt-2">Recibirás confirmación por email</p>

          <button onClick={() => setPaso(2)} className="mt-4 text-sm text-[#6b6360] hover:text-[#C4728A] block mx-auto">
            ← Volver
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
