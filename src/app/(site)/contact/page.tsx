import type { Metadata } from "next";
import { getCenters, getSettings } from "@/lib/data";
import { CentersSection, PageHero, SocialLinks } from "@/components/sections";
import { ActionForm, Field, SubmitButton, TextArea } from "@/components/forms";
import { contactAction } from "@/app/actions/contact";
import { Notice, PhoneIcon, WhatsAppIcon } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact — Herman FASHION Douala", description: "Contactez Herman FASHION à Douala : téléphone, WhatsApp, formulaire de contact et itinéraires vers nos deux centres." };

export default async function ContactPage() {
  const [s, centers] = await Promise.all([getSettings(), getCenters()]);
  const wa = `${s.whatsappUrl}?text=${encodeURIComponent(s.whatsappMessage)}`;
  return (
    <>
      <PageHero eyebrow="Contact" title="Parlons de votre projet de formation." />
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Nos coordonnées</h2>
            {s.contactsVerified !== "true" && (
              <div className="mt-5"><Notice tone="warn">Ces coordonnées sont en cours de vérification par l’administration.</Notice></div>
            )}
            <ul className="mt-6 space-y-4">
              {[s.phone1, s.phone2].filter(Boolean).map((p) => (
                <li key={p}>
                  <a href={`tel:${p.replace(/\s/g, "")}`} className="flex items-center gap-4 rounded-2xl bg-beige p-5 font-semibold hover:bg-sand">
                    <PhoneIcon className="h-6 w-6 text-brand" /> {p}
                  </a>
                </li>
              ))}
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl bg-[#25D366] p-5 font-semibold text-white">
                  <WhatsAppIcon /> Discuter sur WhatsApp
                </a>
              </li>
            </ul>
            <dl className="mt-8 space-y-4 text-sm">
              <div><dt className="font-semibold">Adresse e-mail</dt><dd className="text-anthracite/80">{s.email || "À renseigner par l’administration."}</dd></div>
              <div><dt className="font-semibold">Horaires</dt><dd className="whitespace-pre-line text-anthracite/80">{s.hours || "À renseigner une fois confirmés."}</dd></div>
            </dl>
            <SocialLinks s={s} className="mt-8" />
          </div>
          <div className="card p-8">
            <h2 className="text-2xl font-semibold">Envoyez-nous un message</h2>
            <ActionForm action={contactAction} className="mt-6 space-y-5" resetOnSuccess>
              <Field name="name" label="Nom complet" required autoComplete="name" />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field name="email" label="Adresse e-mail" type="email" autoComplete="email" />
                <Field name="phone" label="Téléphone" type="tel" autoComplete="tel" inputMode="tel" />
              </div>
              <Field name="subject" label="Objet" />
              <TextArea name="message" label="Votre message" required />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <SubmitButton>Envoyer le message</SubmitButton>
            </ActionForm>
          </div>
        </div>
      </section>
      <CentersSection centers={centers} light />
    </>
  );
}
