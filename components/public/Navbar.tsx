"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/equipo", label: "Equipo" },
  { href: "/#contacto", label: "Contacto" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1412]/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span
            className="font-heading italic text-xl leading-none"
            style={{
              color: "#ff6fa8",
              textShadow: "0 0 8px #ff6fa8, 0 0 20px #ff6fa8, 0 0 40px #C4728A",
            }}
          >
            beauty room nini
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                pathname === l.href
                  ? "text-[#C4728A]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/reservar"
          className="bg-[#C4728A] hover:bg-[#a85a72] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Reservar cita
        </Link>
      </div>
    </header>
  );
}
