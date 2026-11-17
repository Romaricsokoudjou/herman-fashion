import type { Metadata } from "next";
import { getSettings, getTestimonials } from "@/lib/data";
import { PageHero, TestimonialCard } from "@/components/sections";
import { EmptyState } from "@/components/ui";
import VideoSpace from "@/components/VideoSpace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Témoignages des apprenants", description: "Avis et expériences d’apprenants de Herman FASHION à Douala." };

export default async function TestimonialsPage() {
  const [items, s] = await Promise.all([getTestimonials(), getSettings()]);
  return (
    <>
      <PageHero eyebrow="Témoignages" title="Ils ont choisi Herman FASHION. Découvrez leur expérience." />
      <section className="section">
        <div className="container-x">
          {items.length === 0 ? (
            <EmptyState title="Les témoignages seront publiés prochainement.">
              Seuls des témoignages authentiques, publiés avec l’autorisation de leurs auteurs, sont affichés sur ce site.
            </EmptyState>
          ) : (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">{items.map((t) => <TestimonialCard key={t.id} t={t} />)}</div>
          )}
          <div className="mx-auto mt-20 max-w-5xl">
            <VideoSpace label="Vidéo 3" title={s.video3Title} url={s.video3Url} thumb={s.video3Thumb} />
          </div>
        </div>
      </section>
    </>
  );
}
