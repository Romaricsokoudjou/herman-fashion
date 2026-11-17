import Link from "next/link";
import {
  getCenters, getFormations, getPublishedNews, getSettings, getTeachers, getTestimonials,
} from "@/lib/data";
import { SectionTitle, ArrowIcon } from "@/components/ui";
import VideoSpace from "@/components/VideoSpace";
import {
  AgrementBox, CentersSection, FormationCard, NewsCard, PricingSection, SocialLinks, TeacherCard, TestimonialCard,
} from "@/components/sections";

export const dynamic = "force-dynamic";

const PILLARS: { key: string; title: string }[] = [
  { key: "vision", title: "Notre vision" },
  { key: "mission", title: "Notre mission" },
  { key: "quality", title: "Notre engagement envers la qualité" },
  { key: "approach", title: "Notre approche pédagogique" },
  { key: "support", title: "Notre accompagnement des apprenants" },
  { key: "ambition", title: "Notre ambition" },
];

export default async function HomePage() {
  const [s, formations, centers, teachers, testimonials, news] = await Promise.all([
    getSettings(), getFormations(), getCenters(), getTeachers(), getTestimonials(), getPublishedNews(3),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        {s.heroVideoUrl ? (
          <video className="absolute inset-0 -z-20 h-full w-full object-cover" src={s.heroVideoUrl} poster={s.heroImageUrl} autoPlay muted loop playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.heroImageUrl} alt="Formation professionnelle aux métiers de la beauté chez Herman FASHION" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/20" />
        <div className="container-x flex min-h-[640px] flex-col justify-center py-24 sm:min-h-[720px]">
          <p className="eyebrow fade-up">CFP Herman FASHION · Douala</p>
          <h1 className="fade-up mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-6xl">
            L’excellence dans les métiers de la beauté et du bien-être commence ici.
          </h1>
          <p className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/80" style={{ animationDelay: "0.1s" }}>
            Herman FASHION forme les talents de demain grâce à un enseignement professionnel, pratique et adapté aux exigences du secteur de la beauté.
          </p>
          <div className="fade-up mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.2s" }}>
            <Link href="/formations" className="btn-primary">Découvrir nos formations</Link>
            <Link href="/inscription" className="btn-light">Commencer mon inscription</Link>
          </div>
          <p className="fade-up mt-8 border-l-2 border-brand pl-4 font-serif text-lg italic text-white/90" style={{ animationDelay: "0.3s" }}>
            Votre talent mérite une formation d’excellence.
          </p>
        </div>
      </section>

      {/* INSTITUTION */}
      <section className="section">
        <div className="container-x">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <SectionTitle eyebrow="Notre institution" title="Bien plus qu’un centre de formation, une institution qui révèle les talents." />
              <div className="-mt-6 grid gap-5 sm:grid-cols-2">
                {PILLARS.map((p) => (
                  <div key={p.key} className="rounded-2xl bg-beige p-5">
                    <h3 className="font-sans text-sm font-semibold uppercase tracking-wider text-brand">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-anthracite">{s[p.key]}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.institutionImageUrl} alt="Apprenants et formateurs de Herman FASHION" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </div>
              <AgrementBox s={s} />
            </div>
          </div>
        </div>
      </section>

      {/* VIDÉO 1 */}
      <section className="bg-beige py-16 sm:py-24">
        <div className="container-x max-w-5xl">
          <VideoSpace label="Vidéo 1" title={s.video1Title} url={s.video1Url} thumb={s.video1Thumb} />
        </div>
      </section>

      {/* FORMATIONS + VIDÉO 2 */}
      <section id="formations" className="section">
        <div className="container-x">
          <SectionTitle eyebrow="Nos formations" title="Neuf spécialités pour construire votre avenir professionnel." center>
            Choisissez une ou plusieurs formations lors de votre inscription, avec la durée qui vous convient.
          </SectionTitle>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {formations.map((f) => <FormationCard key={f.id} f={f} />)}
          </div>
          <div className="mx-auto mt-20 max-w-5xl">
            <VideoSpace label="Vidéo 2" title={s.video2Title} url={s.video2Url} thumb={s.video2Thumb} />
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="section bg-beige">
        <div className="container-x">
          <SectionTitle eyebrow="Durées et tarifs" title="Des formules claires, des tranches adaptées." center>
            Comparez les durées, les frais de formation, les frais d’inscription et les tranches de paiement.
          </SectionTitle>
          <PricingSection formations={formations} />
        </div>
      </section>

      {/* ENSEIGNANTS */}
      {teachers.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionTitle eyebrow="Notre équipe" title="Apprenez auprès de professionnels passionnés." center />
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {teachers.slice(0, 4).map((t) => <TeacherCard key={t.id} t={t} />)}
            </div>
            <div className="mt-10 text-center"><Link href="/enseignants" className="btn-outline">Voir toute l’équipe</Link></div>
          </div>
        </section>
      )}

      {/* TÉMOIGNAGES */}
      {testimonials.length > 0 && (
        <section className="section bg-beige">
          <div className="container-x">
            <SectionTitle eyebrow="Témoignages" title="Ils ont choisi Herman FASHION. Découvrez leur expérience." center />
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => <TestimonialCard key={t.id} t={t} />)}
            </div>
          </div>
        </section>
      )}

      {/* VIDÉO 3 */}
      <section className="py-16 sm:py-24">
        <div className="container-x max-w-5xl">
          <VideoSpace label="Vidéo 3" title={s.video3Title} url={s.video3Url} thumb={s.video3Thumb} />
        </div>
      </section>

      {/* INSCRIPTION */}
      <section id="inscription" className="bg-ink py-20 text-white sm:py-28">
        <div className="container-x">
          <SectionTitle eyebrow="Inscription" title="Votre inscription en quelques étapes." light center>
            Un parcours simple et sécurisé, de la création de votre compte jusqu’à la confirmation de votre inscription.
          </SectionTitle>
          <ol className="mx-auto grid max-w-5xl gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {["Créez votre compte", "Sélectionnez vos formations", "Choisissez durées et centre", "Vérifiez le récapitulatif", "Procédez au paiement", "Vérification de la transaction", "Confirmation de l’inscription", "Retrouvez tout dans votre espace"].map((t, i) => (
              <li key={t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <span className="font-serif text-3xl text-brand">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-2 font-medium">{t}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center">
            <Link href="/inscription" className="btn-primary">Commencer mon inscription <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      {/* ACTUALITÉS */}
      {news.length > 0 && (
        <section className="section">
          <div className="container-x">
            <SectionTitle eyebrow="Actualités" title="La vie de Herman FASHION." />
            <div className="grid gap-7 md:grid-cols-3">{news.map((n) => <NewsCard key={n.id} n={n} />)}</div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <Link href="/actualites" className="btn-outline">Toutes les actualités</Link>
              <SocialLinks s={s} />
            </div>
          </div>
        </section>
      )}

      <CentersSection centers={centers} light />
    </>
  );
}
