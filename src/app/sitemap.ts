import type { MetadataRoute } from "next";
import { getFormations, getPublishedNews, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [s, formations, news] = await Promise.all([getSettings(), getFormations(), getPublishedNews()]);
  const base = (s.siteUrl || "http://localhost:3000").replace(/\/$/, "");
  const fixed = ["", "/institution", "/formations", "/enseignants", "/galerie", "/temoignages", "/actualites", "/contact", "/informations-legales"];
  return [
    ...fixed.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...formations.map((f) => ({ url: `${base}/formations/${f.slug}`, lastModified: f.updatedAt, priority: 0.8 })),
    ...news.map((n) => ({ url: `${base}/actualites/${n.slug}`, lastModified: n.publishAt, priority: 0.5 })),
  ];
}
