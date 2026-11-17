import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { CookieBanner } from "@/components/CookieConsent";
import { WhatsAppIcon } from "@/components/ui";
import { getCenters, getSettings } from "@/lib/data";
import { getUser } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [s, user, centers] = await Promise.all([getSettings(), getUser(), getCenters()]);
  const wa = `${s.whatsappUrl}?text=${encodeURIComponent(s.whatsappMessage)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "CFP Herman FASHION",
    description: "Centre de formation professionnelle aux métiers de la beauté, de la coiffure, de l’esthétique et du bien-être à Douala, Cameroun.",
    url: s.siteUrl || undefined,
    logo: s.logoUrl,
    telephone: [s.phone1, s.phone2].filter(Boolean),
    email: s.email || undefined,
    sameAs: [s.facebookUrl, s.tiktokUrl].filter(Boolean),
    address: centers.map((c) => ({ "@type": "PostalAddress", streetAddress: c.address, addressLocality: "Douala", addressCountry: "CM" })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header user={user} s={s} />
      <main id="contenu">{children}</main>
      <Footer s={s} centers={centers} />
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter sur WhatsApp"
        className="fixed bottom-24 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl transition hover:-translate-y-0.5"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
      <ChatWidget whatsapp={wa} />
      <CookieBanner gaId={s.gaId} />
    </>
  );
}
