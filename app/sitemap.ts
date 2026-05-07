import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://beautyroomnini.es";

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/servicios`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/equipo`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/reservar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  ];
}
