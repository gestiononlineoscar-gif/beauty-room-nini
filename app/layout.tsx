import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { CustomCursor } from "@/components/public/CustomCursor";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://beautyroomnini.es"),
  title: "Beauty Room Nini — Alcobendas",
  description: "Tu espacio de belleza en Alcobendas, Madrid. Manicura, pedicura, peluquería, depilación y más. Reserva tu cita online.",
  icons: {
    icon: "/logo-square.png",
    apple: "/logo-square.png",
  },
  openGraph: {
    title: "Beauty Room Nini",
    description: "Tu espacio de belleza en Alcobendas, Madrid. Reserva tu cita online.",
    url: "https://beautyroomnini.es",
    siteName: "Beauty Room Nini",
    images: [{ url: "/logo-square.png", width: 400, height: 400, alt: "Beauty Room Nini" }],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Beauty Room Nini",
    description: "Tu espacio de belleza en Alcobendas, Madrid.",
    images: ["/logo-square.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
