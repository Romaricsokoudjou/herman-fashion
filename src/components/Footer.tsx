import Link from "next/link";
import { FacebookIcon, TikTokIcon } from "@/components/ui";
import { AGREMENT_REF } from "@/lib/settings-fields";
import type { Settings } from "@/lib/data";
import { NAV } from "@/components/Header";
import CookieSettingsButton from "@/components/CookieConsent";

export default function Footer({ s, centers }: { s: Settings; centers: { id: string; name: string; address: string }[] }) {
  return (
    <footer className="bg-ink text-white/80">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="inline-block rounded-xl bg-white px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.logoUrl} alt="Logo Herman FASHION" className="h-10 w-auto" />
          </div>
          <p className="mt-5 text-sm leading-relaxed">
            Révélez votre talent, construisez votre avenir dans les métiers de la beauté et du bien-être.
          </p>
          <div className="mt-5 flex gap-3">
            <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook Herman FASHION" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-brand"><FacebookIcon /></a>
            <a href={s.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok Herman FASHION" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-brand"><TikTokIcon /></a>
          </div>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-white">Navigation</h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            {NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="hover:text-brand">{n.label}</Link></li>
            ))}
            <li><Link href="/informations-legales" className="hover:text-brand">Informations légales</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-white">Nos centres</h3>
          <ul className="mt-5 space-y-4 text-sm">
            {centers.map((c) => (
              <li key={c.id}><span className="font-semibold text-white">{c.name}</span><br />{c.address}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-white">Contact</h3>
          <ul className="mt-5 space-y-2.5 text-sm">
            {[s.phone1, s.phone2].filter(Boolean).map((p) => (
              <li key={p}><a href={`tel:${p.replace(/\s/g, "")}`} className="hover:text-brand">{p}</a></li>
            ))}
            <li><a href={`${s.whatsappUrl}?text=${encodeURIComponent(s.whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand">WhatsApp</a></li>
            {s.email && <li><a href={`mailto:${s.email}`} className="hover:text-brand">{s.email}</a></li>}
            {s.hours && <li className="whitespace-pre-line">{s.hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            <span className="font-semibold text-brand">Agrément :</span> {AGREMENT_REF}
            {s.rccm && <> · RCCM : {s.rccm}</>}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} CFP Herman FASHION — Douala, Cameroun</span>
            <CookieSettingsButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
