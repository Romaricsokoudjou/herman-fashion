"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/espace", label: "Tableau de bord" },
  { href: "/espace/inscriptions", label: "Mes inscriptions" },
  { href: "/espace/paiements", label: "Paiements et reçus" },
  { href: "/espace/profil", label: "Mon profil" },
];

export default function EspaceNav() {
  const path = usePathname();
  return (
    <nav aria-label="Espace personnel" className="flex gap-2 overflow-x-auto lg:flex-col">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}
          className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition ${path === l.href ? "bg-ink text-white" : "bg-white text-anthracite hover:bg-sand"}`}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
