"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { format, parseISO, isBefore, startOfDay, getDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Servicio, Profesional, ProfesionalServicio, SlotDisponible, ServicioVariante } from "@/types";
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

// Internal paso numbering:
//   0 = Servicio
//   1 = Tamaño/Variante  (only for precio_desde services with variants)
//   2 = Profesional
//   3 = Fecha y hora
//   4 = Confirmar
// When no variants: paso 1 is skipped (service click goes directly to paso 2)

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

  const pasoinicial = servicioInicial && profesionalInicial
    ? 3
    : servicioInicial
      ? (servicioInicial.precio_desde ? 1 : 2)
      : 0;

  const [paso, setPaso] = useState(pasoinicial);
  const [servicioSel, setServicioSel] = useState<Servicio | null>(servicioInicial);
  const [variantes, setVariantes] = useState<ServicioVariante[]>([]);
  const [varianteSel, setVarianteSel] = useState<ServicioVariante | null>(null);
  const [cargandoVariantes, setCargandoVariantes] = useState(false);
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
  const [cualquieraProfMap, setCualquieraProfMap] = useState<Record<string, string>>({});

  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoy = new Date();
    return { year: hoy.getFullYear(), month: hoy.getMonth() };
  });

  // Progress bar
  const tieneVariantes = variantes.length > 0;
  const PASOS = tieneVariantes
    ? ["Servicio", "Tamaño", "Profesional", "Fecha y hora", "Confirmar"]
    : ["Servicio", "Profesional", "Fecha y hora", "Confirmar"];
  const displayPaso = tieneVariantes ? paso : (paso === 0 ? 0 : paso - 1);

  // Fetch variants when service changes
  useEffect(() => {
    if (!servicioSel?.precio_desde) { setVariantes([]); setVarianteSel(null); return; }
    setCargandoVariantes(true);
    fetch(`/api/servicio-variantes?servicio_id=${servicioSel.id}`)
      .then((r) => r.json())
      .then((data) => {
        const v: ServicioVariante[] = Array.isArray(data) ? data : [];
        setVariantes(v);
        setCargandoVariantes(false);
        // Service marked precio_desde but no variants configured → skip variant step
        if (v.length === 0) setPaso((prev) => prev === 1 ? 2 : prev);
      })
      .catch(() => { setCargandoVariantes(false); setPaso((prev) => prev === 1 ? 2 : prev); });
  }, [servicioSel?.id]);

  // Reset slots when variant changes (duration may differ)
  useEffect(() => {
    setSlots([]);
    setSlotSel(null);
  }, [varianteSel?.id]);

  async function cargarSlots(profId: string, fechaStr: string) {
    if (!servicioSel) return;
    const dur = varianteSel?.duracion_min ?? servicioSel.duracion_min;
    setCargandoSlots(true);
    try {
      const res = await fetch(`/api/slots?profesional_id=${profId}&fecha=${fechaStr}&duracion_min=${dur}`);
      const data: SlotDisponible[] = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch {
      setSlots([]);
    }
    setCargandoSlots(false);
  }

  async function seleccionarFecha(fechaStr: string) {
    setFecha(fechaStr);
    setSlotSel(null);
    setSlots([]);
    if (!servicioSel) return;
    const dur = varianteSel?.duracion_min ?? servicioSel.duracion_min;

    if (cualquiera) {
      setCargandoSlots(true);
      try {
        const resultados = await Promise.all(
          profesionalesDelServicio.map(async (prof) => {
            const res = await fetch(`/api/slots?profesional_id=${prof.id}&fecha=${fechaStr}&duracion_min=${dur}`);
            const data: SlotDisponible[] = await res.json();
            return { profId: prof.id, slots: Array.isArray(data) ? data : [] };
          })
        );
        const slotMap: Record<string, SlotDisponible> = {};
        const profMap: Record<string, string> = {};
        for (const { profId, slots } of resultados) {
          for (const slot of slots) {
            const existing = slotMap[slot.hora_inicio];
            if (!existing || (!existing.disponible && slot.disponible)) {
              slotMap[slot.hora_inicio] = slot;
              if (slot.disponible) profMap[slot.hora_inicio] = profId;
            }
          }
        }
        setCualquieraProfMap(profMap);
        setSlots(Object.values(slotMap).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)));
      } catch {
        setSlots([]);
      }
      setCargandoSlots(false);
    } else if (profesionalSel) {
      await cargarSlots(profesionalSel.id, fechaStr);
    }
  }

  async function confirmarReserva() {
    if (!slotSel || !servicioSel || !nombre) return;
    setEnviando(true);

    // Re-verificar que el slot sigue disponible (previene doble reserva)
    const profIdVerif = cualquiera ? cualquieraProfMap[slotSel.hora_inicio] : profesionalSel?.id;
    if (profIdVerif) {
      try {
        const dur = varianteSel?.duracion_min ?? servicioSel.duracion_min;
        const res = await fetch(`/api/slots?profesional_id=${profIdVerif}&fecha=${fecha}&duracion_min=${dur}`);
        const slotsActuales: SlotDisponible[] = await res.json();
        const slotActual = slotsActuales.find((s) => s.hora_inicio === slotSel.hora_inicio);
        if (!slotActual?.disponible) {
          setEnviando(false);
          alert("Lo sentimos, ese horario ya no está disponible. Por favor elige otro.");
          setSlotSel(null);
          setSlots([]);
          setPaso(3);
          return;
        }
      } catch { /* si falla la verificación, continuamos */ }
    }

    const supabase = createClient();

    let clienteId: string;
    const { data: existente } = await supabase
      .from("clientes")
      .select("id")
      .eq("telefono", telefono)
      .maybeSingle();

    if (existente) {
      clienteId = existente.id;
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

    const profId = cualquiera ? (cualquieraProfMap[slotSel.hora_inicio] ?? profesionalesDelServicio[0]?.id) : profesionalSel?.id;
    const duracion = varianteSel?.duracion_min ?? servicioSel.duracion_min;
    const precio = Number(varianteSel?.precio ?? servicioSel.precio);

    await supabase.from("reservas").insert({
      cliente_id: clienteId,
      profesional_id: profId,
      servicio_id: servicioSel.id,
      variante_id: varianteSel?.id ?? null,
      fecha,
      hora_inicio: slotSel.hora_inicio + ":00",
      hora_fin: slotSel.hora_fin + ":00",
      estado: "pendiente",
    });

    if (email && profId) {
      const profNombre = cualquiera ? "Cualquier profesional" : (profesionalSel?.nombre ?? "");
      await fetch("/api/email-confirmacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteEmail: email,
          clienteNombre: nombre,
          servicio: varianteSel ? `${servicioSel.nombre} — ${varianteSel.nombre}` : servicioSel.nombre,
          profesional: profNombre,
          fecha,
          horaInicio: slotSel.hora_inicio,
          duracionMin: duracion,
          precio,
        }),
      });
    }

    router.push("/reservar/confirmacion");
  }

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

  const duracionDisplay = varianteSel?.duracion_min ?? servicioSel?.duracion_min ?? 0;
  const precioDisplay = varianteSel
    ? `${Number(varianteSel.precio).toFixed(2)} €`
    : servicioSel?.precio_desde
      ? `desde ${Number(servicioSel.precio).toFixed(0)} €`
      : `${Number(servicioSel?.precio ?? 0).toFixed(2)} €`;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Barra de progreso */}
      <div className="flex items-center justify-between mb-8">
        {PASOS.map((p, i) => (
          <div key={p} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  i < displayPaso
                    ? "bg-[#C4728A] border-[#C4728A] text-white"
                    : i === displayPaso
                    ? "border-[#C4728A] text-[#C4728A] shadow-[0_0_0_3px_rgba(196,114,138,0.2)]"
                    : "border-[#e8c5ce] text-[#6b6360]"
                }`}
                animate={i < displayPaso ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {i < displayPaso ? <Check size={14} /> : i + 1}
              </motion.div>
              <span className={`text-xs mt-1 hidden sm:block ${i === displayPaso ? "text-[#C4728A] font-medium" : "text-[#6b6360]"}`}>
                {p}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className="relative h-0.5 w-8 sm:w-16 mx-1 bg-[#e8c5ce] overflow-hidden rounded-full">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-[#C4728A] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: i < displayPaso ? "100%" : "0%" }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

      {/* PASO 0 — Servicio */}
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
                onClick={() => {
                  setServicioSel(s);
                  setVarianteSel(null);
                  setVariantes([]);
                  // precio_desde → go to variant step (will auto-skip if no variants configured)
                  setPaso(s.precio_desde ? 1 : 2);
                }}
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

      {/* PASO 1 — Tamaño / Variante */}
      {paso === 1 && servicioSel && (
        <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-2">Elige el tamaño</h2>
          <p className="text-xs text-[#6b6360] mb-5">
            Para <span className="font-medium text-[#C4728A]">{servicioSel.nombre}</span>
          </p>
          {cargandoVariantes ? (
            <div className="text-center py-10 text-[#6b6360] text-sm">
              <div className="w-5 h-5 rounded-full border-2 border-[#C4728A] border-t-transparent animate-spin mx-auto mb-3" />
              Cargando opciones...
            </div>
          ) : (
            <div className="space-y-2">
              {variantes.map((v) => (
                <motion.button
                  key={v.id}
                  whileHover={cardHover}
                  whileTap={cardTap}
                  onClick={() => { setVarianteSel(v); setPaso(2); }}
                  className={`w-full text-left bg-white rounded-2xl border p-4 flex items-center justify-between transition-colors shadow-sm ${
                    varianteSel?.id === v.id ? "border-[#C4728A] ring-2 ring-[#C4728A]/20" : "border-[#e8c5ce]"
                  }`}
                >
                  <div>
                    <p className="font-medium text-[#1a1412]">{v.nombre}</p>
                    <p className="text-xs text-[#6b6360]">{v.duracion_min} min</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-bold text-[#C4728A]">{Number(v.precio).toFixed(2)} €</p>
                    <p className="text-xs text-[#C4728A]">Elegir →</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
          <button
            onClick={() => { setPaso(0); setVarianteSel(null); setVariantes([]); }}
            className="mt-4 text-sm text-[#6b6360] hover:text-[#C4728A]"
          >
            ← Volver
          </button>
        </motion.div>
      )}

      {/* PASO 2 — Profesional */}
      {paso === 2 && (
        <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-2">Elige tu profesional</h2>
          {servicioSel && (
            <p className="text-xs text-[#6b6360] mb-4">
              Para <span className="font-medium text-[#C4728A]">{servicioSel.nombre}</span>
              {varianteSel && <span className="text-[#C4728A]"> — {varianteSel.nombre}</span>}
              {" · "}{profesionalesDelServicio.length} disponible{profesionalesDelServicio.length !== 1 ? "s" : ""}
            </p>
          )}
          <div className="space-y-3">
            <motion.button
              whileHover={cardHover}
              whileTap={cardTap}
              onClick={() => { setCualquiera(true); setProfesionalSel(null); setPaso(3); }}
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
                  onClick={() => { setProfesionalSel(p); setCualquiera(false); setPaso(3); }}
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
          <button onClick={() => { setPaso(tieneVariantes ? 1 : 0); setSlotSel(null); setSlots([]); setFecha(""); setCualquieraProfMap({}); }} className="mt-4 text-sm text-[#6b6360] hover:text-[#C4728A]">
            ← Volver
          </button>
        </motion.div>
      )}

      {/* PASO 3 — Fecha y hora */}
      {paso === 3 && (
        <motion.div key="step-3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
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
            <button onClick={() => { setPaso(2); setSlotSel(null); setSlots([]); setFecha(""); }} className="flex-1 border border-[#e8c5ce] text-[#6b6360] py-2.5 rounded-xl text-sm hover:bg-[#f4f1ef] transition-colors">
              ← Volver
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPaso(4)}
              disabled={!slotSel}
              className="flex-1 bg-[#C4728A] hover:bg-[#a85a72] text-white py-2.5 rounded-xl font-medium text-sm disabled:opacity-40 transition-colors"
            >
              Continuar →
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* PASO 4 — Confirmar */}
      {paso === 4 && servicioSel && slotSel && (
        <motion.div key="step-4" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-4">Confirmar reserva</h2>

          {/* Resumen */}
          <div className="bg-[#1a1412] text-white rounded-2xl p-5 mb-6">
            <p className="text-[#C4728A] font-semibold mb-3">Resumen de tu cita</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Servicio</span>
                <span className="font-medium">{servicioSel.nombre}</span>
              </div>
              {varianteSel && (
                <div className="flex justify-between">
                  <span className="text-[#6b6360]">Tamaño</span>
                  <span className="font-medium">{varianteSel.nombre}</span>
                </div>
              )}
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
                <span className="font-medium">{duracionDisplay} min</span>
              </div>
              <div className="flex justify-between border-t border-[#ffffff10] pt-2 mt-2">
                <span className="text-[#6b6360]">Precio</span>
                <span className="font-bold text-[#C4728A] text-lg">{precioDisplay}</span>
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

          <button onClick={() => setPaso(3)} className="mt-4 text-sm text-[#6b6360] hover:text-[#C4728A] block mx-auto">
            ← Volver
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
