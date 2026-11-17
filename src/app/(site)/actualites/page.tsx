import type { Metadata } from "next";
import { getPublishedNews, getSettings } from "@/lib/data";
import { NewsCard, PageHero, SocialLinks } from "@/components/sections";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Actualités", description: "Nouvelles, événements et réalisations de Herman FASHION, école de beauté à Douala." };

export default async function NewsPage() {
  const [items, s] = await Promise.all([getPublishedNews(), getSettings()]);
  return (
    <>
      <PageHero eyebrow="Actualités et communauté" title="Suivez la vie de Herman FASHION." />
      <section className="section">
        <div className="container-x">
          <SocialLinks s={s} className="mb-10" />
          {items.length === 0 ? (
            <EmptyState title="Aucune actualité publiée pour le moment.">Retrouvez-nous sur Facebook et TikTok en attendant les prochaines publications.</EmptyState>
          ) : (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">{items.map((n) => <NewsCard key={n.id} n={n} />)}</div>
          )}
        </div>
      </section>
    </>
  );
}
