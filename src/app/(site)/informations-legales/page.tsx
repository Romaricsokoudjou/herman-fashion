import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { PageHero } from "@/components/sections";
import { AGREMENT_REF } from "@/lib/settings-fields";
import CookieSettingsButton from "@/components/CookieConsent";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Informations légales et administratives", description: "Mentions légales, confidentialité, conditions d’utilisation, politique de paiement et cookies de Herman FASHION." };

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-b border-ink/10 py-10">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-3 whitespace-pre-line leading-relaxed text-anthracite">{children}</div>
    </section>
  );
}

export default async function LegalPage() {
  const s = await getSettings();
  const todo = "Information à renseigner par l’administration.";
  return (
    <>
      <PageHero eyebrow="Informations" title="Informations légales et administratives" />
      <div className="container-x max-w-3xl pb-20">
        <Block id="mentions" title="Mentions légales">
          <p><strong>Établissement :</strong> CFP Herman FASHION, Douala, Cameroun.</p>
          <p><strong>Agrément :</strong> {AGREMENT_REF}</p>
          <p><strong>RCCM :</strong> {s.rccm || "Numéro RCCM à renseigner par l’administration."}</p>
          <p>{s.legalNotice}</p>
        </Block>
        <Block id="confidentialite" title="Politique de confidentialité">
          <p>Les données collectées lors de la création de compte et de l’inscription (nom, prénom, téléphone, e-mail, pays, ville, formations choisies) servent exclusivement à gérer votre candidature, vos paiements et votre suivi. Les mots de passe sont stockés sous forme chiffrée (hachage) et ne sont jamais lisibles par l’administration. Vous ne pouvez consulter que vos propres données ; l’accès du personnel est limité par rôle et journalisé.</p>
          <p>{s.privacyText}</p>
        </Block>
        <Block id="cgu" title="Conditions générales d’utilisation">
          <p>L’utilisation du site implique l’acceptation de ces conditions. Les informations de formation, durées et tarifs sont publiées par l’établissement et peuvent être mises à jour. L’inscription n’est confirmée qu’après vérification réelle du paiement par l’établissement.</p>
          <p>{s.termsText}</p>
        </Block>
        <Block id="conditions-inscription" title="Conditions d’inscription">
          <p>{s.registrationConditions || todo}</p>
        </Block>
        <Block id="paiement" title="Politique de paiement et de remboursement">
          <p>Le paiement s’effectue via la page de paiement Chariow. Une simple redirection vers cette page ne constitue pas une preuve de paiement : le paiement est enregistré « En attente de vérification » jusqu’à validation par l’établissement. Les frais d’inscription et de formation sont facturés séparément ; les frais de formation sont réglables par tranches.</p>
          <p>{s.paymentPolicy || "Les conditions de remboursement sont à renseigner par l’administration."}</p>
        </Block>
        <Block id="cookies" title="Gestion du consentement aux cookies">
          <p>Le site utilise des cookies strictement nécessaires (session de connexion, sécurité). Les cookies de mesure d’audience (Google Analytics) ne sont chargés qu’avec votre consentement explicite.</p>
          <p><CookieSettingsButton /></p>
        </Block>
        <Block id="administratif" title="Informations administratives">
          <p>{s.adminInfo || todo}</p>
        </Block>
      </div>
    </>
  );
}
