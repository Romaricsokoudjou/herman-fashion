"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { FacebookIcon, TikTokIcon } from "@/components/ui";

export default function MobileMenu({
  nav,
  logged,
  staff,
  facebook,
  tiktok,
  logout,
}: {
  nav: { href: string; label: string }[];
  logged: boolean;
  staff: boolean;
  facebook: string;
  tiktok: string;
  logout: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOpen(!open)}
        className="grid h-11 w-11 place-items-center rounded-full border border-ink/10"
      >
        <span className="relative block h-3.5 w-5">
          <span className={`absolute left-0 h-0.5 w-5 bg-ink transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
          <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-ink transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 h-0.5 w-5 bg-ink transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
        </span>
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-[calc(72px+34px)] z-50 max-h-[calc(100vh-106px)] overflow-y-auto border-t border-ink/5 bg-white px-5 pb-8 pt-4 shadow-2xl">
          <nav aria-label="Menu mobile" className="flex flex-col">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={close} className="border-b border-ink/5 py-3.5 text-base font-medium text-anthracite">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-3">
            {logged ? (
              <>
                <Link href="/espace" onClick={close} className="btn-outline">Mon espace personnel</Link>
                {staff && <Link href="/admin" onClick={close} className="btn-dark">Administration</Link>}
                {logout}
              </>
            ) : (
              <Link href="/connexion" onClick={close} className="btn-outline">Connexion</Link>
            )}
            <Link href="/inscription" onClick={close} className="btn-primary">S’inscrire maintenant</Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-5 text-anthracite">
            <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FacebookIcon className="h-6 w-6" /></a>
            <a href={tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><TikTokIcon className="h-6 w-6" /></a>
          </div>
        </div>
      )}
    </div>
  );
}
