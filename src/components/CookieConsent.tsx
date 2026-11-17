"use client";

import { useEffect, useState } from "react";

const KEY = "hf_cookie_consent";

// Bouton du pied de page pour rouvrir les préférences.
export default function CookieSettingsButton() {
  return (
    <button type="button" className="underline hover:text-brand" onClick={() => window.dispatchEvent(new Event("hf-open-consent"))}>
      Gérer les cookies
    </button>
  );
}

// Bandeau de consentement + chargement de Google Analytics uniquement après acceptation.
export function CookieBanner({ gaId }: { gaId: string }) {
  const [choice, setChoice] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const t = setTimeout(() => setChoice(localStorage.getItem(KEY)), 0);
    const reopen = () => setChoice(null);
    window.addEventListener("hf-open-consent", reopen);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hf-open-consent", reopen);
    };
  }, []);

  useEffect(() => {
    if (choice !== "all" || !gaId || !/^G-[A-Z0-9]+$/.test(gaId)) return;
    if (document.getElementById("ga-script")) return;
    const s = document.createElement("script");
    s.id = "ga-script";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(s);
    const w = window as unknown as { dataLayer: unknown[] };
    w.dataLayer = w.dataLayer || [];
    function gtag(...args: unknown[]) {
      w.dataLayer.push(args);
    }
    gtag("js", new Date());
    gtag("config", gaId, { anonymize_ip: true });
  }, [choice, gaId]);

  function save(v: string) {
    localStorage.setItem(KEY, v);
    setChoice(v);
  }

  if (choice !== null) return null;
  return (
    <div role="dialog" aria-label="Consentement aux cookies" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-2xl border border-ink/10 bg-white p-5 shadow-2xl sm:bottom-6">
      <p className="text-sm text-anthracite">
        Nous utilisons des cookies strictement nécessaires au fonctionnement du site (connexion, sécurité). Avec votre accord, nous utiliserions aussi des cookies de mesure d’audience anonymisée.
        {" "}<a href="/informations-legales#cookies" className="font-semibold text-brand underline">En savoir plus</a>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-primary btn-sm" onClick={() => save("all")}>Tout accepter</button>
        <button className="btn-outline btn-sm" onClick={() => save("necessary")}>Nécessaires uniquement</button>
      </div>
    </div>
  );
}
