"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Profesional } from "@/types";
import { Plus, UserCheck, UserX, Key, ShieldCheck, Shield } from "lucide-react";

interface UsuarioConEmail {
  id: string;
  nombre: string;
  rol: string;
  profesional_id: string | null;
  activo: boolean;
  email: string;
  profesionales?: { id: string; nombre: string; color: string; especialidad: string | null } | null;
}

interface Props {
  profesionales: Profesional[];
}

const FORM_VACIO = { email: "", password: "", nombre: "", rol: "empleada", profesional_id: "" };

const ACCESOS_ROL: Record<string, string[]> = {
  propietaria: ["Agenda", "Reservas", "Servicios", "Profesionales", "Clientes", "Métricas", "Horarios", "Configuración"],
  empleada:    ["Agenda", "Reservas", "Clientes", "Mi Perfil"],
};

export function GestionAccesos({ profesionales }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioConEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCrear, setModalCrear] = useState<{ open: boolean; profesional?: Profesional }>({ open: false });
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [modalPassword, setModalPassword] = useState<{ open: boolean; usuarioId: string; nombre: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { cargarUsuarios(); }, []);

  async function cargarUsuarios() {
    setLoading(true);
    const res = await fetch("/api/admin/usuarios");
    if (res.ok) setUsuarios(await res.json());
    setLoading(false);
  }

  function abrirModalCrear(prof: Profesional) {
    setForm({ ...FORM_VACIO, nombre: prof.nombre, profesional_id: prof.id });
    setModalCrear({ open: true, profesional: prof });
    setShowPassword(false);
  }

  async function crearAcceso() {
    if (!form.email || !form.password) {
      toast.error("El email y la contraseña son obligatorios");
      return;
    }
    setGuardando(true);
    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error al crear acceso");
    } else {
      toast.success(`Acceso creado para ${form.nombre}`);
      setUsuarios((prev) => [...prev, data]);
      setModalCrear({ open: false });
    }
    setGuardando(false);
  }

  async function cambiarRol(id: string, rol: string) {
    const res = await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rol }),
    });
    if (res.ok) {
      setUsuarios((prev) => prev.map((u) => u.id === id ? { ...u, rol } : u));
      toast.success("Rol actualizado");
    } else {
      toast.error("Error al actualizar rol");
    }
  }

  async function toggleActivo(u: UsuarioConEmail) {
    const res = await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, activo: !u.activo }),
    });
    if (res.ok) {
      setUsuarios((prev) => prev.map((x) => x.id === u.id ? { ...x, activo: !x.activo } : x));
      toast.success(u.activo ? "Acceso desactivado" : "Acceso activado");
    } else {
      toast.error("Error al actualizar acceso");
    }
  }

  async function resetPassword() {
    if (!modalPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setGuardando(true);
    const res = await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: modalPassword.usuarioId, password: newPassword }),
    });
    if (res.ok) {
      toast.success("Contraseña actualizada");
      setModalPassword(null);
      setNewPassword("");
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Error al cambiar contraseña");
    }
    setGuardando(false);
  }

  const usuarioPorProfId: Record<string, UsuarioConEmail> = {};
  for (const u of usuarios) {
    if (u.profesional_id) usuarioPorProfId[u.profesional_id] = u;
  }
  const sinProf = usuarios.filter((u) => !u.profesional_id);

  return (
    <div className="space-y-6">
      {/* Info de roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(["propietaria", "empleada"] as const).map((rol) => (
          <div key={rol} className="flex gap-3 bg-[#fdf6f0] border border-[#e8c5ce] rounded-xl p-4">
            {rol === "propietaria"
              ? <ShieldCheck size={18} className="text-[#C4728A] flex-shrink-0 mt-0.5" />
              : <Shield size={18} className="text-[#6b6360] flex-shrink-0 mt-0.5" />}
            <div>
              <p className="text-sm font-semibold text-[#1a1412] capitalize mb-1">{rol}</p>
              <p className="text-xs text-[#6b6360]">{ACCESOS_ROL[rol].join(" · ")}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6b6360] text-sm">Cargando usuarios...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profesionales.map((prof) => {
            const u = usuarioPorProfId[prof.id];
            return (
              <div key={prof.id} className="bg-white rounded-2xl border border-[#e8c5ce] p-4">
                {/* Cabecera */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: prof.color }}
                  >
                    {prof.nombre[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1a1412] text-sm truncate">{prof.nombre}</p>
                    <p className="text-xs text-[#6b6360] truncate">{prof.especialidad}</p>
                  </div>
                  {u ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {u.activo ? "Activa" : "Inactiva"}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#f4f1ef] text-[#6b6360] flex-shrink-0">
                      Sin acceso
                    </span>
                  )}
                </div>

                {u ? (
                  <div className="space-y-2.5">
                    {/* Email */}
                    <div className="text-xs bg-[#fdf6f0] rounded-lg px-3 py-2 text-[#6b6360] flex items-center gap-1.5">
                      <UserCheck size={12} className="text-[#4a9b6f] flex-shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>

                    {/* Rol */}
                    <div className="flex gap-2 items-center">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="flex-1 text-xs border border-[#e8c5ce] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#C4728A] text-[#1a1412]"
                      >
                        <option value="empleada">Empleada</option>
                        <option value="propietaria">Propietaria</option>
                      </select>
                      <button
                        onClick={() => setModalPassword({ open: true, usuarioId: u.id, nombre: u.nombre })}
                        title="Cambiar contraseña"
                        className="p-1.5 border border-[#e8c5ce] rounded-lg text-[#6b6360] hover:text-[#C4728A] hover:border-[#C4728A] transition-colors"
                      >
                        <Key size={13} />
                      </button>
                      <button
                        onClick={() => toggleActivo(u)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${u.activo ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
                      >
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => abrirModalCrear(prof)}
                    className="w-full flex items-center justify-center gap-1.5 text-sm border border-dashed border-[#e8c5ce] rounded-xl py-2.5 text-[#C4728A] hover:bg-[#fdf6f0] hover:border-[#C4728A] transition-colors font-medium"
                  >
                    <Plus size={14} /> Dar acceso al panel
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Usuarios sin profesional */}
      {sinProf.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#6b6360] uppercase tracking-wider mb-3">Sin profesional vinculado</p>
          <div className="space-y-2">
            {sinProf.map((u) => (
              <div key={u.id} className="flex items-center gap-3 bg-white rounded-xl border border-[#e8c5ce] p-3">
                <div className="w-8 h-8 rounded-full bg-[#f4f1ef] flex items-center justify-center text-[#6b6360] font-bold text-sm flex-shrink-0">
                  {u.nombre[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1412]">{u.nombre}</p>
                  <p className="text-xs text-[#6b6360] truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${u.rol === "propietaria" ? "bg-[#f7e8ed] text-[#C4728A]" : "bg-[#f4f1ef] text-[#6b6360]"}`}>
                  {u.rol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal: Crear acceso ── */}
      {modalCrear.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalCrear({ open: false })}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-heading text-lg text-[#1a1412] mb-1">Crear acceso al panel</h3>
            {modalCrear.profesional && (
              <div className="flex items-center gap-2 mb-5 bg-[#fdf6f0] rounded-xl px-3 py-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: modalCrear.profesional.color }}
                >
                  {modalCrear.profesional.nombre[0]}
                </div>
                <span className="text-sm font-medium text-[#1a1412]">{modalCrear.profesional.nombre}</span>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#6b6360] block mb-1">Nombre en el sistema</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b6360] block mb-1">Email de acceso</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b6360] block mb-1">Contraseña temporal</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6360] hover:text-[#C4728A]"
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
                <p className="text-xs text-[#6b6360] mt-1">Comparte esta contraseña con la empleada. Podrá cambiarla desde Mi Perfil.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b6360] block mb-1">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value })}
                  className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] bg-white"
                >
                  <option value="empleada">Empleada — acceso limitado</option>
                  <option value="propietaria">Propietaria — acceso completo</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={crearAcceso}
                  disabled={guardando}
                  className="flex-1 bg-[#C4728A] hover:bg-[#a85a72] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {guardando ? "Creando..." : "Crear acceso"}
                </button>
                <button
                  onClick={() => setModalCrear({ open: false })}
                  className="px-4 border border-[#e8c5ce] rounded-xl text-sm text-[#6b6360] hover:bg-[#f4f1ef] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Cambiar contraseña ── */}
      {modalPassword?.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setModalPassword(null)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-heading text-lg text-[#1a1412] mb-1">Cambiar contraseña</h3>
            <p className="text-sm text-[#6b6360] mb-4">{modalPassword.nombre}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#6b6360] block mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetPassword}
                  disabled={guardando}
                  className="flex-1 bg-[#C4728A] hover:bg-[#a85a72] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Actualizar"}
                </button>
                <button
                  onClick={() => { setModalPassword(null); setNewPassword(""); }}
                  className="px-4 border border-[#e8c5ce] rounded-xl text-sm text-[#6b6360] hover:bg-[#f4f1ef] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
