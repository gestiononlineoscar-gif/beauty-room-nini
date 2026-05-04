"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Key } from "lucide-react";

export function CambiarPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    if (password !== confirm) { toast.error("Las contraseñas no coinciden"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Contraseña actualizada correctamente");
      setPassword("");
      setConfirm("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e8c5ce] p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Key size={16} className="text-[#C4728A]" />
        <h2 className="font-semibold text-[#1a1412]">Cambiar contraseña</h2>
      </div>
      <div>
        <label className="text-xs text-[#6b6360] block mb-1">Nueva contraseña</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A] pr-14"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6b6360] hover:text-[#C4728A]"
          >
            {show ? "Ocultar" : "Ver"}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs text-[#6b6360] block mb-1">Confirmar contraseña</label>
        <input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repite la contraseña"
          className="w-full border border-[#e8c5ce] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4728A]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C4728A] hover:bg-[#a85a72] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
