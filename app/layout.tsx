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

const schemaOrg = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": "Beauty Room Nini",
  "description": "Salón de belleza en Alcobendas, Madrid. Especialistas en manicura, pedicura, peluquería, depilación, pestañas y estética.",
  "url": "https://beautyroomnini.es",
  "telephone": "+34604850249",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "C. de la Constitución, 53",
    "addressLocality": "Alcobendas",
    "addressRegion": "Madrid",
    "postalCode": "28100",
    "addressCountry": "ES"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.5447,
    "longitude": -3.6394
  },
  "image": "https://beautyroomnini.es/logo-square.png",
  "priceRange": "€€",
  "currenciesAccepted": "EUR",
  "paymentAccepted": "Cash, Credit Card",
  "hasMap": "https://maps.google.com/?q=Beauty+Room+Nini+Alcobendas",
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday"], "opens": "10:00", "closes": "20:00" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Wednesday","Thursday","Friday"], "opens": "10:00", "closes": "21:00" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "10:00", "closes": "17:00" }
  ],
  "makesOffer": [
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Manicura" } },
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Pedicura" } },
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Peluquería" } },
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Depilación" } },
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Extensiones de pestañas" } },
    { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Estética facial" } }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
