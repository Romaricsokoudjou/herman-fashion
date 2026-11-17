import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { centers, formationOffers, formations, galleryItems, news, settings, teachers, testimonials } from "@/db/schema";
import { SETTING_DEFAULTS } from "@/lib/settings-fields";
import { ensureSeeded } from "@/lib/seed";
import type { CumulRule } from "@/lib/pricing";

export type Settings = Record<string, string>;

export const getSettings = cache(async (): Promise<Settings> => {
  await ensureSeeded();
  const rows = await db.select().from(settings);
  const out: Settings = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in SETTING_DEFAULTS) out[r.key] = r.value;
  return out;
});

export function cumulRule(s: Settings): CumulRule {
  const v = s.cumulRule;
  return v === "registration_once" || v === "registration_each" ? v : "undefined";
}

export type FormationFull = typeof formations.$inferSelect & { offers: (typeof formationOffers.$inferSelect)[] };

export const getFormations = cache(async (opts: { includeInactive?: boolean } = {}): Promise<FormationFull[]> => {
  await ensureSeeded();
  const [fs, offers] = await Promise.all([
    db.select().from(formations).where(opts.includeInactive ? undefined : eq(formations.isActive, true)).orderBy(asc(formations.sortOrder), asc(formations.name)),
    db.select().from(formationOffers).orderBy(asc(formationOffers.sortOrder), asc(formationOffers.durationMonths)),
  ]);
  return fs.map((f) => ({
    ...f,
    offers: offers.filter((o) => o.formationId === f.id && (opts.includeInactive || o.isActive)),
  }));
});

export async function getFormationBySlug(slug: string) {
  const all = await getFormations();
  return all.find((f) => f.slug === slug) ?? null;
}

export const getCenters = cache(async (includeInactive = false) => {
  await ensureSeeded();
  return db.select().from(centers).where(includeInactive ? undefined : eq(centers.isActive, true)).orderBy(asc(centers.sortOrder));
});

export async function getTeachers() {
  return db.select().from(teachers).where(eq(teachers.isPublished, true)).orderBy(asc(teachers.sortOrder), asc(teachers.lastName));
}

export async function getTestimonials() {
  return db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.isPublished, true), eq(testimonials.consentConfirmed, true)))
    .orderBy(asc(testimonials.sortOrder));
}

export async function getGallery() {
  return db.select().from(galleryItems).where(eq(galleryItems.isPublished, true)).orderBy(asc(galleryItems.sortOrder), desc(galleryItems.id));
}

export async function getPublishedNews(limit?: number) {
  const q = db
    .select()
    .from(news)
    .where(and(eq(news.status, "published"), lte(news.publishAt, new Date())))
    .orderBy(desc(news.publishAt));
  return limit ? q.limit(limit) : q;
}
