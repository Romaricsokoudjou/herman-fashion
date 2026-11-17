import type { Metadata } from "next";
import { getFormations, getSettings } from "@/lib/data";
import { FormationCard, PageHero, PricingSection } from "@/components/sections";
import { SectionTitle } from "@/components/ui";
import VideoSpace from "@/components/VideoSpace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Nos formations en beauté, coiffure et esthétique à Douala",
  description: "Coiffure femme, onglerie, esthétique bio, make-up, massage, pédicure-manucure, extension de cils, microblading, microshading : durées, tarifs et diplômes à Douala.",
};

export default async function FormationsPage() {
  const [formations, s] = await Promise.all([getFormations(), getSettings()]);
  return (
    <>
      <PageHero eyebrow="Catalogue" title="Nos formations professionnelles">
        Neuf spécialités dispensées dans nos centres de Douala. Choisissez une ou plusieurs formations dans une même inscription.
      </PageHero>
      <section className="section">
        <div className="container-x">
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {formations.map((f) => <FormationCard key={f.id} f={f} />)}
          </div>
          <div className="mx-auto mt-20 max-w-5xl">
            <VideoSpace label="Vidéo 2" title={s.video2Title} url={s.video2Url} thumb={s.video2Thumb} />
          </div>
        </div>
      </section>
      <section className="section bg-beige">
        <div className="container-x">
          <SectionTitle eyebrow="Durées et tarifs" title="Les formules officielles" center />
          <PricingSection formations={formations} />
        </div>
      </section>
    </>
  );
}
