import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getSettings } from "@/lib/data";

export const viewport: Viewport = { themeColor: "#f26a1b", width: "device-width", initialScale: 1 };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: s.siteUrl ? new URL(s.siteUrl) : undefined,
    title: {
      default: "Herman FASHION — École de beauté, coiffure et esthétique à Douala",
      template: "%s | Herman FASHION Douala",
    },
    description:
      "CFP Herman FASHION : formation professionnelle en coiffure, onglerie, esthétique, make-up, massage, extension de cils, microblading et microshading à Douala, Cameroun.",
    keywords: [
      "école de beauté à Douala",
      "formation esthétique à Douala",
      "formation coiffure au Cameroun",
      "école de coiffure à Douala",
      "formation onglerie Cameroun",
      "formation maquillage professionnel",
      "formation massage et bien-être",
      "Herman FASHION Douala",
    ],
    verification: s.gscVerification ? { google: s.gscVerification } : undefined,
    openGraph: { type: "website", locale: "fr_CM", siteName: "Herman FASHION", images: ["/banners/banniere-principale.jpg"] },
    icons: { icon: "/icons/favicon.svg" },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
