import type { MetadataRoute } from "next";
import { getLager } from "@/lib/data";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const lager = await getLager();
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/lager`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/lagerhaus`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/kontakt`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/sponsoren`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/impressum`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/datenschutz`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
  for (const l of lager) {
    // created/updated existieren nicht bei allen Collections — Fallback auf datum_von.
    const raw = l.updated || l.created || l.datum_von || "";
    const d = new Date(raw.replace(" ", "T"));
    entries.push({
      url: `${base}/lager/${l.jahr}`,
      lastModified: isNaN(d.getTime()) ? new Date() : d,
      changeFrequency: "yearly",
      priority: 0.7,
    });
  }
  return entries;
}
