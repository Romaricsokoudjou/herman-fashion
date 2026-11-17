import Link from "next/link";
import { ArrowIcon, CheckIcon, PinIcon, SectionTitle, FacebookIcon, TikTokIcon } from "@/components/ui";
import { AGREMENT_REF } from "@/lib/settings-fields";
import { fcfa, parseInstallments } from "@/lib/pricing";
import { formatDate, lines } from "@/lib/util";
import type { FormationFull, Settings } from "@/lib/data";
import type { centers, news, teachers, testimonials } from "@/db/schema";

export function FormationCard({ f }: { f: FormationFull }) {
  return (
    <article className="card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-beige">
        {f.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.imageUrl} alt={`Formation ${f.name} — Herman FASHION Douala`} loading="lazy" width={1100} height={700} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold">{f.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-anthracite/80">{f.summary}</p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {lines(f.skills).slice(0, 4).map((s) => (
            <li key={s} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{s}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {f.offers.length ? f.offers.map((o) => (
            <span key={o.id} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">{o.durationLabel}</span>
          )) : <span className="text-xs text-anthracite/60">Durées à confirmer</span>}
        </div>
        <div className="mt-6 flex flex-col gap-2 pt-2 sm:flex-row">
          <Link href={`/formations/${f.slug}`} className="btn-outline btn-sm flex-1">Découvrir cette formation</Link>
          <Link href={`/inscription?formation=${f.slug}`} className="btn-primary btn-sm flex-1">Choisir cette formation</Link>
        </div>
      </div>
    </article>
  );
}

export function PricingSection({ formations }: { formations: FormationFull[] }) {
  const plans = new Map<string, { label: string; months: number; o: FormationFull["offers"][number]; names: string[] }>();
  for (const f of formations) for (const o of f.offers) {
    const key = `${o.durationLabel}|${o.trainingFee}|${o.registrationFee}|${o.diploma}|${o.installments}`;
    const p = plans.get(key) ?? { label: o.durationLabel, months: o.durationMonths, o, names: [] };
    p.names.push(f.name);
    plans.set(key, p);
  }
  const list = [...plans.values()].sort((a, b) => a.months - b.months);
  return (
    <div id="tarifs">
      <div className="grid gap-6 lg:grid-cols-3">
        {list.map((p) => {
          const inst = parseInstallments(p.o.installments);
          const all = p.names.length === formations.length;
          return (
            <article key={p.label + p.o.id} className="card flex flex-col p-8">
              <p className="eyebrow">Formation de</p>
              <h3 className="mt-1 text-3xl font-semibold">{p.label}</h3>
              {p.o.diploma && <p className="mt-1 text-sm text-anthracite/70">Diplôme indiqué : <strong className="text-ink">{p.o.diploma}</strong></p>}
              <dl className="mt-6 space-y-3 border-t border-ink/10 pt-6 text-sm">
                <div className="flex justify-between gap-4"><dt>Frais de formation</dt><dd className="font-semibold">{fcfa(p.o.trainingFee)}</dd></div>
                <div className="flex justify-between gap-4"><dt>Inscription et polo</dt><dd className="font-semibold">{fcfa(p.o.registrationFee)}</dd></div>
              </dl>
              {inst.length > 0 && (
                <div className="mt-6 rounded-xl bg-beige p-4 text-sm">
                  <p className="mb-2 font-semibold">Tranches des frais de formation</p>
                  <ul className="space-y-1.5">
                    {inst.map((x, i) => (
                      <li key={i} className="flex justify-between"><span>{i === 0 ? "1re" : `${i + 1}e`} tranche</span><span className="font-semibold">{fcfa(x)}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-5 text-xs text-anthracite/60">
                {all ? "Disponible pour toutes les spécialités." : `Disponible pour : ${p.names.join(", ")}.`}
              </p>
              <Link href="/inscription" className="btn-primary mt-6">S’inscrire</Link>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-anthracite/70">
        Les frais d’inscription et les frais de formation sont indiqués séparément. Tarifs officiels enregistrés par l’administration ; aucun frais supplémentaire n’est ajouté par le site.
      </p>
    </div>
  );
}

type Center = typeof centers.$inferSelect;
export function CentersSection({ centers, light = false }: { centers: Center[]; light?: boolean }) {
  return (
    <section id="centres" className={`section ${light ? "bg-beige" : ""}`}>
      <div className="container-x">
        <SectionTitle eyebrow="Nos centres" title="Retrouvez Herman FASHION près de chez vous." center />
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {centers.map((c) => (
            <article key={c.id} className="card p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><PinIcon className="h-6 w-6" /></span>
              <h3 className="mt-5 text-2xl font-semibold">{c.name}</h3>
              <p className="mt-2 text-anthracite/80">{c.address}</p>
              {c.hours && <p className="mt-2 whitespace-pre-line text-sm text-anthracite/70">Horaires : {c.hours}</p>}
              {c.mapsUrl && (
                <a href={c.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6">
                  OBTENIR L’ITINÉRAIRE <ArrowIcon />
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AgrementBox({ s, dark = false }: { s: Settings; dark?: boolean }) {
  return (
    <div id="agrement" className={`rounded-3xl p-8 sm:p-10 ${dark ? "bg-ink text-white" : "border border-brand/30 bg-brand-soft"}`}>
      <p className="eyebrow">Agrément ministériel</p>
      <p className="mt-3 break-words font-serif text-xl font-semibold leading-snug sm:text-2xl">{AGREMENT_REF}</p>
      <p className={`mt-3 text-sm ${dark ? "text-white/70" : "text-anthracite/80"}`}>
        Herman FASHION exerce sous agrément du Ministère de l’Emploi et de la Formation Professionnelle (MINEFOP).
      </p>
      {s.agrementDocUrl ? (
        <a href={s.agrementDocUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6">CONSULTER NOTRE AGRÉMENT OFFICIEL</a>
      ) : (
        <div className="mt-6">
          <span className="btn-primary cursor-not-allowed opacity-60" aria-disabled="true">CONSULTER NOTRE AGRÉMENT OFFICIEL</span>
          <p className="mt-3 text-xs opacity-70">Le document officiel (PDF ou image) sera mis en ligne par l’administration.</p>
        </div>
      )}
    </div>
  );
}

type Teacher = typeof teachers.$inferSelect;
export function TeacherCard({ t }: { t: Teacher }) {
  return (
    <article className="card overflow-hidden">
      <div className="aspect-[4/5] bg-beige">
        {t.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.photoUrl} alt={`${t.firstName} ${t.lastName}, ${t.specialty}`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center font-serif text-6xl text-brand/40">{t.firstName[0]}{t.lastName[0]}</div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold">{t.firstName} {t.lastName}</h3>
        {t.specialty && <p className="mt-1 text-sm font-semibold text-brand">{t.specialty}</p>}
        {t.experience && <p className="mt-1 text-xs text-anthracite/60">{t.experience}</p>}
        {t.bio && <p className="mt-3 text-sm text-anthracite/80">{t.bio}</p>}
        {t.expertise && <p className="mt-3 text-xs"><strong>Expertise :</strong> {t.expertise}</p>}
      </div>
    </article>
  );
}

type Testimonial = typeof testimonials.$inferSelect;
export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <figure className="card flex flex-col p-8">
      <blockquote className="flex-1 text-base leading-relaxed text-anthracite">“{t.content}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-4">
        {t.portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.portraitUrl} alt={`Portrait de ${t.name}`} loading="lazy" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft font-serif text-lg font-semibold text-brand">{t.name[0]}</span>
        )}
        <span className="text-sm">
          <strong className="block">{t.name}</strong>
          <span className="text-anthracite/70">{[t.location, t.formationName].filter(Boolean).join(" · ")}</span>
          {t.videoUrl && <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className="block font-semibold text-brand">Voir la vidéo</a>}
        </span>
      </figcaption>
    </figure>
  );
}

type News = typeof news.$inferSelect;
export function NewsCard({ n }: { n: News }) {
  return (
    <article className="card group overflow-hidden">
      <Link href={`/actualites/${n.slug}`} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-beige">
          {n.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.imageUrl} alt={n.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          )}
        </div>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">{n.category} · {formatDate(n.publishAt)}</p>
          <h3 className="mt-2 text-xl font-semibold group-hover:text-brand">{n.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-anthracite/80">{n.excerpt}</p>
        </div>
      </Link>
    </article>
  );
}

export function SocialLinks({ s, className = "" }: { s: Settings; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm"><FacebookIcon className="h-4 w-4" /> Facebook</a>
      <a href={s.tiktokUrl} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm"><TikTokIcon className="h-4 w-4" /> TikTok</a>
    </div>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="bg-ink py-20 text-white sm:py-24">
      <div className="container-x">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-white/75">{children}</div>}
      </div>
    </section>
  );
}
