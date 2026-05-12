import Link from "next/link";
import { WhatsAppWidget } from "./WhatsAppWidget";

const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=C.+de+la+Constitución,+53,+28100+Alcobendas,+Madrid";
const TEL = "+34 604 85 02 49";
const TEL_HREF = "tel:+34604850249";
const WA_HREF = "https://wa.me/34604850249";

export function Footer() {
  return (
    <>
      <WhatsAppWidget />

      <footer className="bg-[#110e0d] text-white/60 pt-14 pb-28 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            {/* Marca */}
            <div>
              <p
                className="font-heading italic text-2xl mb-3"
                style={{
                  color: "#ff6fa8",
                  textShadow: "0 0 8px #ff6fa8, 0 0 20px #ff6fa8",
                }}
              >
                beauty room nini
              </p>
              <p className="text-sm leading-relaxed">
                Tu espacio de belleza y bienestar en el corazón de Alcobendas.
                Profesionales apasionadas, resultados que enamoran.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navegación</p>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: "/", label: "Inicio" },
                  { href: "/servicios", label: "Servicios" },
                  { href: "/equipo", label: "Equipo" },
                  { href: "/#contacto", label: "Contacto" },
                  { href: "/reservar", label: "Reservar cita" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-[#C4728A] transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <p className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">📍</span>
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#C4728A] transition-colors">
                    C. de la Constitución, 53, 28100 Alcobendas, Madrid
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span>📞</span>
                  <a href={TEL_HREF} className="hover:text-[#C4728A] transition-colors">{TEL}</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>💬</span>
                  <a href={WA_HREF} target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">WhatsApp</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>📷</span>
                  <a href="https://instagram.com/beautyroom.nini" className="hover:text-[#C4728A] transition-colors">@beautyroomnini</a>
                </li>
              </ul>
              <div className="mt-5">
                <p className="text-xs font-semibold text-white/80 mb-2">Horario</p>
                <p className="text-xs">Lun – Mar: 10:00 – 20:00</p>
                <p className="text-xs">Mié – Vie: 10:00 – 21:00</p>
                <p className="text-xs">Sáb: 10:00 – 17:00</p>
                <p className="text-xs">Dom: Cerrado</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} Beauty Room Nini · Todos los derechos reservados</p>
            <Link
              href="/admin/login"
              className="text-sm font-medium text-white/50 hover:text-white border border-white/15 hover:border-white/40 px-4 py-2 rounded-xl transition-all"
            >
              Acceso profesionales
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
