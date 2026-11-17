import type { ReactNode } from "react";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { can, ROLES, type Permission } from "@/lib/permissions";
import { logoutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

const LINKS: { href: string; label: string; perm?: Permission; group?: string }[] = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/inscriptions", label: "Inscriptions", perm: "registrations" },
  { href: "/admin/paiements", label: "Finance & paiements", perm: "finance" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", perm: "users" },
  { href: "/admin/messages", label: "Messages de contact", perm: "registrations" },
  { href: "/admin/formations", label: "Formations & tarifs", perm: "formations" },
  { href: "/admin/contenus/enseignants", label: "Enseignants", perm: "content" },
  { href: "/admin/contenus/temoignages", label: "Témoignages", perm: "content" },
  { href: "/admin/contenus/actualites", label: "Actualités", perm: "content" },
  { href: "/admin/contenus/galerie", label: "Galerie", perm: "content" },
  { href: "/admin/contenus/centres", label: "Centres", perm: "content" },
  { href: "/admin/parametres", label: "Paramètres du site", perm: "settings" },
  { href: "/admin/ia", label: "HERMAN AI", perm: "ai" },
  { href: "/admin/administrateurs", label: "Administrateurs", perm: "admins" },
  { href: "/admin/journal", label: "Journal & e-mails", perm: "audit" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireStaff();
  const links = LINKS.filter((l) => !l.perm || can(user.role, l.perm));
  return (
    <div className="min-h-screen bg-[#f4f1ec] lg:grid lg:grid-cols-[270px_1fr]">
      <aside className="bg-ink text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between p-5 lg:block">
          <div>
            <p className="font-serif text-xl font-semibold">HERMAN <span className="text-brand">FASHION</span></p>
            <p className="text-xs text-white/50">Administration</p>
          </div>
        </div>
        <nav aria-label="Administration" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">{l.label}</Link>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-5 text-xs text-white/60 lg:block">
          <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
          <p>{ROLES[user.role]?.label}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/" className="hover:text-brand">Voir le site</Link>
            <form action={logoutAction}><button className="hover:text-brand">Déconnexion</button></form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 p-5 sm:p-8">{children}</div>
    </div>
  );
}
