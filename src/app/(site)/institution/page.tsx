import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/data";
import { AgrementBox, PageHero } from "@/components/sections";
import VideoSpace from "@/components/VideoSpace";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Notre institution — école de beauté agréée à Douala",
  description: "Découvrez la vision, la mission et l’agrément ministériel de CFP Herman FASHION, école de beauté et de bien-être à Douala.",
};

const BLOCKS = [
  { key: "vision", title: "Notre vision" },
  { key: "mission", title: "Notre mission" },
  { key: "quality", title: "Notre engagement envers la qualité" },
  { key: "approach", title: "Notre approche pédagogique" },
  { key: "support", title: "Notre accompagnement des apprenants" },
  { key: "ambition", title: "Notre ambition dans les métiers de la beauté et du bien-être" },
];

export default async function InstitutionPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="Notre institution" title="Bien plus qu’un centre de formation, une institution qui révèle les talents.">
        CFP Herman FASHION accompagne les futurs professionnels de la beauté, de l’esthétique, de la coiffure et du bien-être.
      </PageHero>
      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-10">
            {BLOCKS.map((b) => (
              <div key={b.key}>
                <h2 className="text-2xl font-semibold">{b.title}</h2>
                <p className="mt-3 leading-relaxed text-anthracite">{s[b.key]}</p>
              </div>
            ))}
            <Link href="/formations" className="btn-primary">Découvrir nos formations</Link>
          </div>
          <div className="space-y-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.institutionImageUrl} alt="Herman FASHION — apprenants et formateurs" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl" />
            <AgrementBox s={s} />
          </div>
        </div>
      </section>
      <section className="bg-beige py-16 sm:py-24">
        <div className="container-x max-w-5xl">
          <VideoSpace label="Vidéo 1" title={s.video1Title} url={s.video1Url} thumb={s.video1Thumb} />
        </div>
      </section>
    </>
  );
}
