import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormationBySlug, getSettings } from "@/lib/data";
import { CheckIcon } from "@/components/ui";
import VideoSpace from "@/components/VideoSpace";
import { fcfa, parseInstallments } from "@/lib/pricing";
import { lines } from "@/lib/util";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await getFormationBySlug((await params).slug);
  if (!f) return { title: "Formation introuvable" };
  return {
    title: `Formation ${f.name} à Douala`,
    description: f.summary,
    openGraph: { images: f.imageUrl ? [f.imageUrl] : undefined },
  };
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex gap-3"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-brand" />{i}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function FormationPage({ params }: Props) {
  const { slug } = await params;
  const [f, s] = await Promise.all([getFormationBySlug(slug), getSettings()]);
  if (!f) notFound();
  const extra = lines(f.extraImages);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Course", name: f.name, description: f.summary,
    provider: { "@type": "EducationalOrganization", name: "CFP Herman FASHION" },
    offers: f.offers.map((o) => ({ "@type": "Offer", price: o.trainingFee + o.registrationFee, priceCurrency: "XAF", name: o.durationLabel })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative isolate overflow-hidden bg-ink py-24 text-white">
        {f.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.imageUrl} alt={`Formation ${f.name}`} className="absolute inset-0 -z-20 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 to-ink/50" />
        <div className="container-x">
          <Link href="/formations" className="text-sm text-white/70 hover:text-brand">← Toutes les formations</Link>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-6xl">{f.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">{f.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/inscription?formation=${f.slug}`} className="btn-primary">Choisir cette formation</Link>
            {f.offers.map((o) => <span key={o.id} className="rounded-full border border-white/30 px-4 py-2 text-sm">{o.durationLabel}</span>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_380px]">
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-semibold">Description</h2>
              <div className="mt-4 space-y-4 whitespace-pre-line leading-relaxed text-anthracite">{f.description}</div>
            </div>
            <List title="Objectifs pédagogiques" items={lines(f.objectives)} />
            <List title="Compétences acquises" items={lines(f.skills)} />
            {f.program && <List title="Programme pédagogique" items={lines(f.program)} />}
            {f.practicalWork && (
              <div><h2 className="text-2xl font-semibold">Travaux pratiques</h2><p className="mt-4 whitespace-pre-line text-anthracite">{f.practicalWork}</p></div>
            )}
            {f.careers && (
              <div><h2 className="text-2xl font-semibold">Débouchés professionnels possibles</h2><p className="mt-4 whitespace-pre-line text-anthracite">{f.careers}</p></div>
            )}
            <div>
              <h2 className="text-2xl font-semibold">Conditions d’inscription</h2>
              <p className="mt-4 whitespace-pre-line text-anthracite">
                {f.conditions || s.registrationConditions || "Les conditions d’inscription détaillées seront précisées par l’administration. Contactez-nous pour toute question."}
              </p>
            </div>
            {extra.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {extra.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={u} alt={`${f.name} — photographie`} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                ))}
              </div>
            )}
            {f.videoUrl && <VideoSpace label="Démonstration" title={`Démonstration — ${f.name}`} url={f.videoUrl} thumb="" />}
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="card p-7">
              <h2 className="text-2xl font-semibold">Durées et tarifs</h2>
              {f.offers.length === 0 && <p className="mt-4 text-sm text-anthracite/70">Aucune durée n’est disponible actuellement. Contactez-nous.</p>}
              <div className="mt-5 space-y-5">
                {f.offers.map((o) => (
                  <div key={o.id} className="rounded-xl bg-beige p-4 text-sm">
                    <p className="font-semibold">{o.durationLabel}{o.diploma && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white">{o.diploma}</span>}</p>
                    <p className="mt-2 flex justify-between"><span>Frais de formation</span><strong>{fcfa(o.trainingFee)}</strong></p>
                    <p className="flex justify-between"><span>Inscription et polo</span><strong>{fcfa(o.registrationFee)}</strong></p>
                    {parseInstallments(o.installments).length > 0 && (
                      <p className="mt-2 text-xs text-anthracite/70">Tranches : {parseInstallments(o.installments).map((x) => fcfa(x)).join(" · ")}</p>
                    )}
                  </div>
                ))}
              </div>
              <Link href={`/inscription?formation=${f.slug}`} className="btn-primary mt-6 w-full">S’inscrire à cette formation</Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
