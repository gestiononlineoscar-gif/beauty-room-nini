"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { format, parseISO, isBefore, startOfDay, getDay, addMinutes, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { Servicio, Profesional, ProfesionalServicio, SlotDisponible, ServicioVariante } from "@/types";
import { CATEGORIAS_SERVICIOS, ICONOS_CATEGORIA } from "@/types";
import { Check, Plus, X } from "lucide-react";

const stepTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };
const stepVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};
const cardHover = { scale: 1.02 } as const;
const cardTap   = { scale: 0.98 } as const;

// Paso numbering:
//   0 = Servicio (también usado para 2.° servicio en modo S2)
//   1 = Tamaño/Variante  (solo servicios precio_desde con variantes)
//   2 = Profesional
//   3 = Fecha y hora
//   4 = Confirmar

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

  // ── Servicio 1 ──
  const [paso, setPaso] = useState(pasoinicial);
  const [servicioSel, setServicioSel] = useState<Servicio | null>(servicioInicial);
  const [variantes, setVariantes] = useState<ServicioVariante[]>([]);
  const [varianteSel, setVarianteSel] = useState<ServicioVariante | null>(null);
  const [cargandoVariantes, setCargandoVariantes] = useState(false);
  const [profesionalSel, setProfesionalSel] = useState<Profesional | null>(profesionalInicial);
  const [cualquiera, setCualquiera] = useState(false);
  const [cualquieraProfMap, setCualquieraProfMap] = useState<Record<string, string>>({});

  // ── Fecha y slots ──
  const [fecha, setFecha] = useState("");
  const [slotSel, setSlotSel] = useState<SlotDisponible | null>(null);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);

  // ── Servicio 2 ──
  const [servicio2, setServicio2] = useState<Servicio | null>(null);
  const [variante2, setVariante2] = useState<ServicioVariante | null>(null);
  const [profesional2, setProfesional2] = useState<Profesional | null>(null);
  const [cualquiera2, setCualquiera2] = useState(false);
  const [cualquieraProfMap2, setCualquieraProfMap2] = useState<Record<string, string>>({});

  // ── Modo configuración S2 ──
  const [configurandoS2, setConfigurandoS2] = useState(false);
  const [s1Backup, setS1Backup] = useState<{
    servicio: Servicio;
    variante: ServicioVariante | null;
    profesional: Profesional | null;
    cualquiera: boolean;
    cualquieraProfMap: Record<string, string>;
  } | null>(null);
  const [verificandoS2, setVerificandoS2] = useState(false);
  const [errorS2, setErrorS2] = useState("");

  // ── Datos del cliente ──
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);

  // ── UI ──
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoy = new Date();
    return { year: hoy.getFullYear(), month: hoy.getMonth() };
  });

  // ── Progress bar ──
  const tieneVariantes = variantes.length > 0;
  const PASOS = tieneVariantes
    ? ["Servicio", "Tamaño", "Profesional", "Fecha y hora", "Confirmar"]
    : ["Servicio", "Profesional", "Fecha y hora", "Confirmar"];
  const displayPaso = tieneVariantes ? paso : (paso === 0 ? 0 : paso - 1);

  // Fetch variantes when service changes
  useEffect(() => {
    if (!servicioSel?.precio_desde) { setVariantes([]); setVarianteSel(null); return; }
    setCargandoVariantes(true);
    fetch(`/api/servicio-variantes?servicio_id=${servicioSel.id}`)
      .then((r) => r.json())
      .then((data) => {
        const v: ServicioVariante[] = Array.isArray(data) ? data : [];
        setVariantes(v);
        setCargandoVariantes(false);
        if (v.length === 0) setPaso((prev) => prev === 1 ? 2 : prev);
      })
      .catch(() => { setCargandoVariantes(false); setPaso((prev) => prev === 1 ? 2 : prev); });
  }, [servicioSel?.id]);

  useEffect(() => {
    setSlots([]);
    setSlotSel(null);
  }, [varianteSel?.id]);

  // ── Profesionales del servicio activo ──
  const profesionalesDelServicio = useMemo(() => {
    if (!servicioSel) return profesionales;
    const ids = new Set(
      profesionalServicios
        .filter((ps) => ps.servicio_id === servicioSel.id)
        .map((ps) => ps.profesional_id)
    );
    // Si no hay asignaciones configuradas para este servicio, mostrar todos
    return ids.size > 0 ? profesionales.filter((p) => ids.has(p.id)) : profesionales;
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

  const dur2Display = variante2?.duracion_min ?? servicio2?.duracion_min ?? 0;
  const precio2Display = variante2
    ? `${Number(variante2.precio).toFixed(2)} €`
    : servicio2?.precio_desde
      ? `desde ${Number(servicio2.precio).toFixed(0)} €`
      : `${Number(servicio2?.precio ?? 0).toFixed(2)} €`;

  // Professional assigned to service 2 (for display)
  const prof2Asignado = cualquiera2
    ? profesionales.find((p) => p.id === cualquieraProfMap2[slotSel?.hora_fin ?? ""])
    : profesional2;

  // ── Slot loading ──
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
    // Clear S2 when date changes since availability was tied to old slot
    quitarServicio2();
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
        for (const { profId, slots: sl } of resultados) {
          for (const slot of sl) {
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

  // ── S2 helpers ──
  function iniciarS2() {
    setS1Backup({
      servicio: servicioSel!,
      variante: varianteSel,
      profesional: profesionalSel,
      cualquiera,
      cualquieraProfMap,
    });
    setServicioSel(null);
    setVarianteSel(null);
    setVariantes([]);
    setProfesionalSel(null);
    setCualquiera(false);
    setCualquieraProfMap({});
    setBusqueda("");
    setCategoriaFiltro(null);
    setConfigurandoS2(true);
    setErrorS2("");
    setPaso(0);
  }

  function cancelarS2() {
    if (s1Backup) {
      setServicioSel(s1Backup.servicio);
      setVarianteSel(s1Backup.variante);
      setVariantes([]);
      setProfesionalSel(s1Backup.profesional);
      setCualquiera(s1Backup.cualquiera);
      setCualquieraProfMap(s1Backup.cualquieraProfMap);
      setS1Backup(null);
    }
    setConfigurandoS2(false);
    setErrorS2("");
    setPaso(3);
  }

  function quitarServicio2() {
    setServicio2(null);
    setVariante2(null);
    setProfesional2(null);
    setCualquiera2(false);
    setCualquieraProfMap2({});
  }

  async function seleccionarProfesionalS2(prof: Profesional | null, esCualquiera: boolean) {
    if (!servicioSel || !slotSel) return;
    setVerificandoS2(true);
    setErrorS2("");
    const dur2 = varianteSel?.duracion_min ?? servicioSel.duracion_min;
    const horaInicioS2 = slotSel.hora_fin;

    const checkDisponible = async (profId: string) => {
      const res = await fetch(
        `/api/disponible?profesional_id=${profId}&fecha=${fecha}&hora_inicio=${horaInicioS2}&duracion_min=${dur2}`
      );
      const data = await res.json();
      return data.disponible === true;
    };

    try {
      if (esCualquiera) {
        const resultados = await Promise.all(
          profesionalesDelServicio.map(async (p) => ({
            profId: p.id,
            disponible: await checkDisponible(p.id),
          }))
        );
        const disponible = resultados.find((r) => r.disponible);
        if (!disponible) {
          setErrorS2(`No hay profesionales disponibles a las ${horaInicioS2}. Prueba con otro horario para el primer servicio.`);
          setVerificandoS2(false);
          return;
        }
        setCualquieraProfMap2({ [horaInicioS2]: disponible.profId });
      } else {
        const libre = await checkDisponible(prof!.id);
        if (!libre) {
          setErrorS2(`${prof!.nombre} no está disponible a las ${horaInicioS2}. Prueba con otro profesional o cambia el horario.`);
          setVerificandoS2(false);
          return;
        }
        setCualquieraProfMap2({});
      }

      // Guardar S2 y restaurar S1
      setServicio2(servicioSel);
      setVariante2(varianteSel);
      setProfesional2(esCualquiera ? null : prof);
      setCualquiera2(esCualquiera);
      if (s1Backup) {
        setServicioSel(s1Backup.servicio);
        setVarianteSel(s1Backup.variante);
        setVariantes([]);
        setProfesionalSel(s1Backup.profesional);
        setCualquiera(s1Backup.cualquiera);
        setCualquieraProfMap(s1Backup.cualquieraProfMap);
        setS1Backup(null);
      }
      setConfigurandoS2(false);
      setVerificandoS2(false);
      setPaso(4);
    } catch {
      setErrorS2("Error al verificar disponibilidad. Inténtalo de nuevo.");
      setVerificandoS2(false);
    }
  }

  // ── Confirmar reserva ──
  async function confirmarReserva() {
    if (!slotSel || !servicioSel || !nombre) return;
    setEnviando(true);

    // Re-verificar slot S1
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
      .select("id, bloqueado")
      .eq("telefono", telefono)
      .maybeSingle();

    if (existente?.bloqueado) {
      setEnviando(false);
      alert("No es posible realizar reservas online desde esta cuenta. Por favor contacta con el salón.");
      return;
    }

    if (existente) {
      clienteId = existente.id;
      const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
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
      const { data: nuevo, error: errorCliente } = await supabase
        .from("clientes")
        .insert({ nombre, telefono, email })
        .select()
        .single();
      if (errorCliente || !nuevo?.id) {
        setEnviando(false);
        alert("Error al registrar tus datos. Por favor inténtalo de nuevo.");
        return;
      }
      clienteId = nuevo.id;
    }

    const profId = cualquiera ? (cualquieraProfMap[slotSel.hora_inicio] ?? profesionalesDelServicio[0]?.id) : profesionalSel?.id;
    const duracion = varianteSel?.duracion_min ?? servicioSel.duracion_min;
    const precio = Number(varianteSel?.precio ?? servicioSel.precio);

    // Insertar reserva 1
    await supabase.from("reservas").insert({
      cliente_id: clienteId,
      profesional_id: profId,
      servicio_id: servicioSel.id,
      variante_id: varianteSel?.id ?? null,
      fecha,
      hora_inicio: slotSel.hora_inicio + ":00",
      hora_fin: slotSel.hora_fin + ":00",
      estado: "confirmada",
    });

    // Insertar reserva 2 (si aplica)
    if (servicio2) {
      const dur2 = variante2?.duracion_min ?? servicio2.duracion_min;
      const profId2 = cualquiera2
        ? (cualquieraProfMap2[slotSel.hora_fin] ?? profId)
        : (profesional2?.id ?? profId);

      // Re-verificar disponibilidad S2 (previene doble reserva)
      try {
        const res2 = await fetch(`/api/slots?profesional_id=${profId2}&fecha=${fecha}&duracion_min=${dur2}`);
        const slotsS2: SlotDisponible[] = await res2.json();
        const slotS2 = slotsS2.find((s) => s.hora_inicio === slotSel.hora_fin);
        if (!slotS2?.disponible) {
          setEnviando(false);
          alert(`Lo sentimos, el segundo servicio ya no está disponible a las ${slotSel.hora_fin}. La primera cita ya fue guardada. Por favor contacta con el salón.`);
          router.push("/reservar/confirmacion");
          return;
        }
      } catch { /* continuar */ }

      const base = new Date();
      const s2InicioDate = parse(slotSel.hora_fin, "HH:mm", base);
      const s2FinDate = addMinutes(s2InicioDate, dur2);
      const s2FinStr = format(s2FinDate, "HH:mm");

      await supabase.from("reservas").insert({
        cliente_id: clienteId,
        profesional_id: profId2,
        servicio_id: servicio2.id,
        variante_id: variante2?.id ?? null,
        fecha,
        hora_inicio: slotSel.hora_fin + ":00",
        hora_fin: s2FinStr + ":00",
        estado: "confirmada",
      });
    }

    // Email de confirmación
    if (email && profId) {
      const s1Label = varianteSel ? `${servicioSel.nombre} — ${varianteSel.nombre}` : servicioSel.nombre;
      const s2Label = servicio2
        ? (variante2 ? `${servicio2.nombre} — ${variante2.nombre}` : servicio2.nombre)
        : null;
      const servicioLabel = s2Label ? `${s1Label} + ${s2Label}` : s1Label;

      const prof1Nombre = cualquiera ? "Sin preferencia" : (profesionalSel?.nombre ?? "");
      const profId2Final = servicio2
        ? (cualquiera2 ? (cualquieraProfMap2[slotSel.hora_fin] ?? null) : profesional2?.id)
        : null;
      const prof2Nombre = profId2Final
        ? (profesionales.find((p) => p.id === profId2Final)?.nombre ?? "")
        : null;
      const profesionalLabel = (prof2Nombre && prof2Nombre !== prof1Nombre)
        ? `${prof1Nombre} + ${prof2Nombre}`
        : prof1Nombre;

      const dur2 = servicio2 ? (variante2?.duracion_min ?? servicio2.duracion_min) : 0;
      const duracionTotal = duracion + dur2;
      const precio2 = servicio2 ? Number(variante2?.precio ?? servicio2.precio) : 0;

      await fetch("/api/email-confirmacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteEmail: email,
          clienteNombre: nombre,
          servicio: servicioLabel,
          profesional: profesionalLabel,
          fecha,
          horaInicio: slotSel.hora_inicio,
          duracionMin: duracionTotal,
          precio: precio + precio2,
        }),
      });
    }

    router.push("/reservar/confirmacion");
  }

  // ── Calendario ──
  const diasEnMes = new Date(mesCalendario.year, mesCalendario.month + 1, 0).getDate();
  const primerDiaSemana = new Date(mesCalendario.year, mesCalendario.month, 1).getDay();
  const hoy = startOfDay(new Date());

  // ── RENDER ──
  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* Barra de progreso (oculta en modo S2) */}
      {!configurandoS2 ? (
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
      ) : (
        /* Barra S2 */
        <div className="flex items-center justify-between mb-8">
          <button onClick={cancelarS2} className="text-sm text-[#6b6360] hover:text-[#C4728A] transition-colors">
            ← Cancelar
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#f7e8ed] text-[#C4728A] font-semibold px-3 py-1 rounded-full">
              2.° servicio
            </span>
            <span className="text-xs text-[#6b6360]">
              {paso === 0 || paso === 1 ? "Elegir servicio" : "Elegir profesional"}
            </span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">

      {/* ── PASO 0 — Servicio ── */}
      {paso === 0 && (
        <motion.div key="step-0" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-4">
            {configurandoS2 ? "Añade un segundo servicio" : "Elige tu servicio"}
          </h2>
          {configurandoS2 && slotSel && (
            <p className="text-sm text-[#6b6360] mb-4 bg-[#f7e8ed] rounded-xl px-3 py-2">
              Empezará a las <span className="font-semibold text-[#C4728A]">{slotSel.hora_fin}</span>, justo después del primer servicio.
            </p>
          )}
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

      {/* ── PASO 1 — Tamaño / Variante ── */}
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

      {/* ── PASO 2 — Profesional ── */}
      {paso === 2 && (
        <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-2">
            {configurandoS2 ? "Profesional para el 2.° servicio" : "Elige tu profesional"}
          </h2>
          {servicioSel && (
            <p className="text-xs text-[#6b6360] mb-4">
              Para <span className="font-medium text-[#C4728A]">{servicioSel.nombre}</span>
              {varianteSel && <span className="text-[#C4728A]"> — {varianteSel.nombre}</span>}
              {configurandoS2 && slotSel && (
                <span> · <span className="font-medium">a las {slotSel.hora_fin}</span></span>
              )}
              {!configurandoS2 && (
                <span>{" · "}{profesionalesDelServicio.length} disponible{profesionalesDelServicio.length !== 1 ? "s" : ""}</span>
              )}
            </p>
          )}

          {/* Error S2 */}
          {errorS2 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600">
              {errorS2}
            </div>
          )}

          {verificandoS2 && (
            <div className="flex items-center gap-2 mb-4 text-sm text-[#6b6360]">
              <div className="w-4 h-4 rounded-full border-2 border-[#C4728A] border-t-transparent animate-spin" />
              Verificando disponibilidad...
            </div>
          )}

          <div className={`space-y-3 ${verificandoS2 ? "opacity-40 pointer-events-none" : ""}`}>
            {profesionalesDelServicio.length > 1 && (
              <motion.button
                whileHover={cardHover}
                whileTap={cardTap}
                onClick={() => {
                  if (configurandoS2) {
                    seleccionarProfesionalS2(null, true);
                  } else {
                    setCualquiera(true); setProfesionalSel(null); setPaso(3);
                  }
                }}
                className="w-full bg-[#f7e8ed] border-2 border-[#C4728A]/30 rounded-2xl p-4 text-left hover:border-[#C4728A] transition-colors"
              >
                <p className="font-semibold text-[#1a1412]">🌸 Sin preferencia</p>
                <p className="text-xs text-[#6b6360] mt-0.5">Se asignará la primera disponible del servicio</p>
              </motion.button>
            )}

            <div className="grid grid-cols-2 gap-3">
              {profesionalesDelServicio.map((p) => (
                <motion.button
                  key={p.id}
                  whileHover={cardHover}
                  whileTap={cardTap}
                  onClick={() => {
                    if (configurandoS2) {
                      seleccionarProfesionalS2(p, false);
                    } else {
                      setProfesionalSel(p); setCualquiera(false); setPaso(3);
                    }
                  }}
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

          <button
            onClick={() => {
              if (!configurandoS2) {
                setSlotSel(null); setSlots([]); setFecha(""); setCualquieraProfMap({});
              }
              setPaso(tieneVariantes ? 1 : 0);
            }}
            className="mt-4 text-sm text-[#6b6360] hover:text-[#C4728A]"
          >
            ← Volver
          </button>
        </motion.div>
      )}

      {/* ── PASO 3 — Fecha y hora ── */}
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

          {/* Slots */}
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
                    onClick={() => {
                      if (slotSel?.hora_inicio !== slot.hora_inicio) quitarServicio2();
                      setSlotSel(slot);
                    }}
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

          {/* Añadir segundo servicio */}
          {slotSel && !servicio2 && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={iniciarS2}
              className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-[#C4728A] text-[#C4728A] rounded-xl py-2.5 text-sm hover:bg-[#f7e8ed] transition-colors"
            >
              <Plus size={15} /> Añadir otro servicio a las {slotSel.hora_fin}
            </motion.button>
          )}

          {/* Tag segundo servicio añadido */}
          {slotSel && servicio2 && (
            <div className="mt-4 bg-[#f7e8ed] rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium text-[#1a1412]">+ {servicio2.nombre}</span>
                {variante2 && <span className="text-[#6b6360]"> — {variante2.nombre}</span>}
                <span className="text-[#6b6360]"> · {slotSel.hora_fin}</span>
                {prof2Asignado && <span className="text-[#6b6360]"> con {prof2Asignado.nombre}</span>}
              </div>
              <button onClick={quitarServicio2} className="text-[#6b6360] hover:text-[#C4728A] ml-2 flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setPaso(2);
                setSlotSel(null);
                setSlots([]);
                setFecha("");
                quitarServicio2();
              }}
              className="flex-1 border border-[#e8c5ce] text-[#6b6360] py-2.5 rounded-xl text-sm hover:bg-[#f4f1ef] transition-colors"
            >
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

      {/* ── PASO 4 — Confirmar ── */}
      {paso === 4 && servicioSel && slotSel && (
        <motion.div key="step-4" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={stepTransition}>
          <h2 className="font-heading text-2xl text-[#1a1412] mb-4">Confirmar reserva</h2>

          {/* Resumen */}
          <div className="bg-[#1a1412] text-white rounded-2xl p-5 mb-6">
            <p className="text-[#C4728A] font-semibold mb-3">
              {servicio2 ? "Resumen de tus citas" : "Resumen de tu cita"}
            </p>
            <div className="space-y-2 text-sm">

              {/* Servicio 1 */}
              {servicio2 && (
                <p className="text-[#C4728A] text-xs font-semibold uppercase tracking-wide">1.er servicio</p>
              )}
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
                <span className="font-medium">{cualquiera ? "Sin preferencia" : profesionalSel?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Fecha</span>
                <span className="font-medium capitalize">
                  {format(parseISO(fecha), "EEEE d MMM", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Hora</span>
                <span className="font-medium">{slotSel.hora_inicio} – {slotSel.hora_fin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6360]">Duración</span>
                <span className="font-medium">{duracionDisplay} min</span>
              </div>
              <div className={`flex justify-between ${!servicio2 ? "border-t border-[#ffffff10] pt-2 mt-2" : ""}`}>
                <span className="text-[#6b6360]">Precio</span>
                <span className={`font-bold ${!servicio2 ? "text-[#C4728A] text-lg" : "text-white"}`}>{precioDisplay}</span>
              </div>

              {/* Servicio 2 */}
              {servicio2 && (
                <>
                  <div className="border-t border-[#ffffff15] my-2" />
                  <p className="text-[#C4728A] text-xs font-semibold uppercase tracking-wide">2.° servicio</p>
                  <div className="flex justify-between">
                    <span className="text-[#6b6360]">Servicio</span>
                    <span className="font-medium">{servicio2.nombre}</span>
                  </div>
                  {variante2 && (
                    <div className="flex justify-between">
                      <span className="text-[#6b6360]">Tamaño</span>
                      <span className="font-medium">{variante2.nombre}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#6b6360]">Profesional</span>
                    <span className="font-medium">
                      {prof2Asignado?.nombre ?? (cualquiera2 ? "Sin preferencia" : "—")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b6360]">Hora</span>
                    <span className="font-medium">
                      {slotSel.hora_fin} – {(() => {
                        const base = new Date();
                        const ini = parse(slotSel.hora_fin, "HH:mm", base);
                        return format(addMinutes(ini, dur2Display), "HH:mm");
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b6360]">Duración</span>
                    <span className="font-medium">{dur2Display} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b6360]">Precio</span>
                    <span className="font-medium">{precio2Display}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#ffffff10] pt-2 mt-2">
                    <span className="text-[#6b6360]">Total</span>
                    <span className="font-bold text-[#C4728A] text-lg">
                      {(Number(varianteSel?.precio ?? servicioSel.precio) + Number(variante2?.precio ?? servicio2.precio)).toFixed(2)} €
                    </span>
                  </div>
                </>
              )}
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
