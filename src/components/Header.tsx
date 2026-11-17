import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { FacebookIcon, TikTokIcon } from "@/components/ui";
import MobileMenu from "@/components/MobileMenu";
import { AGREMENT_REF } from "@/lib/settings-fields";
import type { Settings } from "@/lib/data";
import type { SessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";

export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/institution", label: "Notre institution" },
  { href: "/formations", label: "Nos formations" },
  { href: "/enseignants", label: "Nos enseignants" },
  { href: "/galerie", label: "Galerie" },
  { href: "/temoignages", label: "Témoignages" },
  { href: "/actualites", label: "Actualités" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ user, s }: { user: SessionUser | null; s: Settings }) {
  const staff = user ? isStaff(user.role) : false;
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-ink text-white/90">
        <div className="container-x flex items-center justify-between gap-4 py-2 text-[11px] sm:text-xs">
          <p className="truncate">
            <span className="font-semibold text-brand">Agréé&nbsp;:</span> {AGREMENT_REF}
          </p>
          <div className="hidden items-center gap-3 sm:flex">
            <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook Herman FASHION" className="hover:text-brand"><FacebookIcon className="h-4 w-4" /></a>
            <a href={s.tiktokUrl} target="_blank" rel="noopener noreferrer" aria-label="TikTok Herman FASHION" className="hover:text-brand"><TikTokIcon className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-b border-ink/5 bg-white/90 backdrop-blur-md">
        <div className="container-x flex h-[72px] items-center justify-between gap-4">
          <Link href="/" className="shrink-0" aria-label="Herman FASHION — accueil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.logoUrl} alt="Logo Herman FASHION" className="h-11 w-auto" />
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-5 xl:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-sm font-medium text-anthracite transition hover:text-brand">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 xl:flex">
            {user ? (
              <>
                <Link href={staff ? "/admin" : "/espace"} className="text-sm font-semibold text-anthracite hover:text-brand">
                  {staff ? "Administration" : "Mon espace"}
                </Link>
                {staff && <Link href="/espace" className="text-sm text-anthracite/70 hover:text-brand">Espace apprenant</Link>}
                <form action={logoutAction}>
                  <button className="text-sm text-anthracite/70 hover:text-brand" type="submit">Déconnexion</button>
                </form>
              </>
            ) : (
              <Link href="/connexion" className="text-sm font-semibold text-anthracite hover:text-brand">Connexion</Link>
            )}
            <Link href="/inscription" className="btn-primary">S’inscrire maintenant</Link>
          </div>
          <MobileMenu
            nav={NAV}
            logged={!!user}
            staff={staff}
            facebook={s.facebookUrl}
            tiktok={s.tiktokUrl}
            logout={
              <form action={logoutAction}>
                <button className="btn-outline w-full" type="submit">Déconnexion</button>
              </form>
            }
          />
        </div>
      </div>
    </header>
  );
}
