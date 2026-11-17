import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { news } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { SocialLinks } from "@/components/sections";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const [n] = await db.select().from(news).where(and(eq(news.slug, slug), eq(news.status, "published"), lte(news.publishAt, new Date()))).limit(1);
  return n ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await load((await params).slug);
  return n ? { title: n.title, description: n.excerpt || undefined, openGraph: { images: n.imageUrl ? [n.imageUrl] : undefined } } : { title: "Actualité introuvable" };
}

export default async function NewsArticle({ params }: Props) {
  const n = await load((await params).slug);
  if (!n) notFound();
  const s = await getSettings();
  return (
    <article className="section">
      <div className="container-x max-w-3xl">
        <Link href="/actualites" className="text-sm text-brand">← Toutes les actualités</Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand">{n.category} · {formatDate(n.publishAt)}</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{n.title}</h1>
        {n.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.imageUrl} alt={n.title} className="mt-8 w-full rounded-3xl object-cover" />
        )}
        <div className="mt-8 space-y-4 whitespace-pre-line text-lg leading-relaxed text-anthracite">{n.content}</div>
        <div className="mt-12 border-t border-ink/10 pt-6"><p className="mb-3 text-sm font-semibold">Suivez-nous</p><SocialLinks s={s} /></div>
      </div>
    </article>
  );
}
