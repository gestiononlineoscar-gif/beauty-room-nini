"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import type { Usuario } from "@/types";
import {
  CalendarDays, List, Scissors, Users, UserCircle,
  BarChart2, Clock, Settings, LogOut, User
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  soloAdmin?: boolean;
}

const navItems: NavItem[] = [
  { href: "/admin/agenda",        label: "Agenda",        icon: <CalendarDays size={18} /> },
  { href: "/admin/reservas",      label: "Reservas",      icon: <List size={18} /> },
  { href: "/admin/servicios",     label: "Servicios",     icon: <Scissors size={18} />,  soloAdmin: true },
  { href: "/admin/profesionales", label: "Profesionales", icon: <Users size={18} />,     soloAdmin: true },
  { href: "/admin/clientes",      label: "Clientes",      icon: <UserCircle size={18} /> },
  { href: "/admin/metricas",      label: "Métricas",      icon: <BarChart2 size={18} />,  soloAdmin: true },
  { href: "/admin/horarios",      label: "Horarios",      icon: <Clock size={18} />,     soloAdmin: true },
  { href: "/admin/configuracion", label: "Configuración", icon: <Settings size={18} />,  soloAdmin: true },
  { href: "/admin/mi-perfil",     label: "Mi Perfil",     icon: <User size={18} /> },
];

export function Sidebar({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();
  const router = useRouter();
  const esPropietaria = usuario.rol === "propietaria";

  const items = navItems.filter((item) => !item.soloAdmin || esPropietaria);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#1a1412] flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-[rgba(196,114,138,0.2)]">
          <Link href="/admin/agenda" className="flex items-center gap-2">
            <span className="text-xl">💅</span>
            <div>
              <p className="text-[#C4728A] font-heading text-base leading-tight">beauty room</p>
              <p className="text-[#C4728A] font-heading text-base leading-tight font-bold">nini</p>
            </div>
          </Link>
          <p className="text-[#6b6360] text-xs mt-2 capitalize">
            {usuario.nombre} · {usuario.rol}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const activo = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  activo
                    ? "bg-[rgba(196,114,138,0.2)] text-[#C4728A]"
                    : "text-[#f7e8ed] hover:bg-[rgba(196,114,138,0.1)] hover:text-[#C4728A] hover:translate-x-1"
                )}
              >
                {activo && (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(196,114,138,0.18) 50%, transparent 100%)",
                      backgroundSize: "200% 100%",
                      animation: "sidebar-shimmer 2.5s ease-in-out infinite",
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[rgba(196,114,138,0.2)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6b6360] hover:text-[#C4728A] hover:bg-[rgba(196,114,138,0.1)] transition-colors w-full"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Bottom nav móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1412] border-t border-[rgba(196,114,138,0.2)] flex justify-around items-center py-2 z-50">
        {items.slice(0, 5).map((item) => {
          const activo = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors",
                activo ? "text-[#C4728A]" : "text-[#6b6360]"
              )}
            >
              {item.icon}
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
