import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { cumulRule, getCenters, getFormations, getSettings } from "@/lib/data";
import RegistrationWizard from "@/components/RegistrationWizard";
import { PageHero } from "@/components/sections";
import { Notice } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inscription", robots: { index: false } };

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ formation?: string; bienvenue?: string }> }) {
  const { formation, bienvenue } = await searchParams;
  const user = await requireUser(`/inscription${formation ? `?formation=${encodeURIComponent(formation)}` : ""}`);
  const [formations, centers, s] = await Promise.all([getFormations(), getCenters(), getSettings()]);
  return (
    <>
      <PageHero eyebrow="Inscription" title="Composez votre parcours de formation">
        Sélectionnez une ou plusieurs spécialités, choisissez les durées et votre centre, puis vérifiez votre récapitulatif.
      </PageHero>
      <section className="section">
        <div className="container-x">
          {bienvenue && (
            <div className="mb-8"><Notice tone="success"><strong>Votre compte a été créé avec succès.</strong> Bienvenue chez Herman FASHION ! Poursuivez votre inscription ci-dessous.</Notice></div>
          )}
          <RegistrationWizard
            formations={formations.map((f) => ({
              id: f.id, slug: f.slug, name: f.name, summary: f.summary, imageUrl: f.imageUrl,
              offers: f.offers.map((o) => ({ id: o.id, durationLabel: o.durationLabel, trainingFee: o.trainingFee, registrationFee: o.registrationFee, diploma: o.diploma, installments: o.installments })),
            }))}
            centers={centers.map((c) => ({ id: c.id, name: c.name, address: c.address }))}
            rule={cumulRule(s)}
            candidate={`${user.firstName} ${user.lastName}`}
            preselect={formation ?? ""}
          />
        </div>
      </section>
    </>
  );
}
