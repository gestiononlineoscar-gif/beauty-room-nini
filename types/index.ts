export type Rol = "propietaria" | "empleada";

export interface Profesional {
  id: string;
  nombre: string;
  especialidad: string | null;
  color: string;
  activo: boolean;
  foto_url: string | null;
  created_at: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  categoria: string;
  duracion_min: number;
  precio: number;
  precio_desde: boolean;
  activo: boolean;
  created_at: string;
}

export interface ProfesionalServicio {
  profesional_id: string;
  servicio_id: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  created_at: string;
}

export interface HorarioLocal {
  dia_semana: number;
  abierto: boolean;
  hora_apertura: string | null;
  hora_cierre: string | null;
}

export interface HorarioProfesional {
  id: string;
  profesional_id: string;
  dia_semana: number;
  trabaja: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
}

export interface DiaLibre {
  id: string;
  profesional_id: string;
  fecha: string;
  motivo: string | null;
}

export type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

export interface Reserva {
  id: string;
  cliente_id: string | null;
  profesional_id: string | null;
  servicio_id: string | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoReserva;
  notas: string | null;
  pagado: boolean;
  metodo_pago: string | null;
  created_at: string;
  /* joins opcionales */
  clientes?: Cliente;
  profesionales?: Profesional;
  servicios?: Servicio;
}

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  profesional_id: string | null;
  activo: boolean;
}

export interface BloqueoHorario {
  id: string;
  profesional_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string | null;
  created_at: string;
}

export interface SlotDisponible {
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

export const CATEGORIAS_SERVICIOS = [
  "Manicura",
  "Pedicura",
  "Depilación Hilo",
  "Depilación Pinza",
  "Depilación Cera",
  "Peluquería",
  "Estética",
  "Pestañas",
  "Bienestar y Salud",
] as const;

export type CategoriaServicio = (typeof CATEGORIAS_SERVICIOS)[number];

export const DIAS_SEMANA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const ICONOS_CATEGORIA: Record<string, string> = {
  Manicura: "💅",
  Pedicura: "🦶",
  "Depilación Hilo": "🧵",
  "Depilación Pinza": "🪮",
  "Depilación Cera": "🕯️",
  Peluquería: "✂️",
  Estética: "✨",
  Pestañas: "👁️",
  "Bienestar y Salud": "🧘",
};
