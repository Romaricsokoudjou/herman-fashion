import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, registrationItems, registrations } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { PAYMENT_STATUS, REGISTRATION_STATUS, fcfa, parseInstallments } from "@/lib/pricing";
import { PageHero } from "@/components/sections";
import { Notice, StatusBadge } from "@/components/ui";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { declarePaymentAction, startPaymentAction } from "@/app/actions/registration";
import { SUCCESS_MESSAGE } from "@/lib/payments";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Paiement de l’inscription", robots: { index: false } };

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/inscription/paiement/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [reg] = await db.select().from(registrations).where(and(eq(registrations.id, id), eq(registrations.userId, user.id))).limit(1);
  if (!reg) notFound();
  const [items, pays, s] = await Promise.all([
    db.select().from(registrationItems).where(eq(registrationItems.registrationId, id)),
    db.select().from(payments).where(eq(payments.registrationId, id)).orderBy(asc(payments.createdAt)),
    getSettings(),
  ]);
  const st = REGISTRATION_STATUS[reg.status];
  const confirmed = pays.filter((p) => p.status === "confirmed");
  const definitive = reg.pricingMode === "definitive" && reg.totalAmount !== null;

  return (
    <>
      <PageHero eyebrow="Étape finale" title="Récapitulatif et paiement" />
      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            {confirmed.length > 0 && <Notice tone="success"><strong>{SUCCESS_MESSAGE}</strong><br />N° d’inscription : <strong>{reg.registrationNumber}</strong></Notice>}
            <div className="card p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Votre inscription</h2>
                <StatusBadge label={st.label} tone={st.tone} />
              </div>
              <p className="mt-2 text-sm text-anthracite/70">Centre : <strong className="text-ink">{reg.centerName}</strong> · Créée le {formatDate(reg.createdAt)}</p>
              <ul className="mt-6 space-y-4">
                {items.map((it) => (
                  <li key={it.id} className="rounded-xl bg-beige p-4 text-sm">
                    <p className="font-semibold">{it.formationName} — {it.durationLabel}{it.diploma && ` (${it.diploma})`}</p>
                    <p className="mt-2 flex justify-between"><span>Frais de formation</span><span>{fcfa(it.trainingFee)}</span></p>
                    <p className="flex justify-between"><span>Inscription et polo</span><span>{fcfa(it.registrationFee)}</span></p>
                    {parseInstallments(it.installments).length > 0 && (
                      <p className="mt-1 text-xs text-anthracite/70">Tranches : {parseInstallments(it.installments).map((x, i) => `${i === 0 ? "1re" : `${i + 1}e`} : ${fcfa(x)}`).join(" · ")}</p>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-ink/10 pt-4 text-sm">
                <p className="flex justify-between"><span>Total frais de formation</span><strong>{fcfa(reg.trainingTotal)}</strong></p>
                <p className="flex justify-between"><span>Total inscription et polo</span><strong>{fcfa(reg.registrationTotal)}</strong></p>
                <p className="mt-2 flex justify-between text-lg"><span className="font-semibold">Montant total</span><strong className="text-brand">{definitive ? fcfa(reg.totalAmount) : "À valider par l’administration"}</strong></p>
              </div>
            </div>

            {pays.length > 0 && (
              <div className="card p-7">
                <h2 className="text-xl font-semibold">Suivi de vos paiements</h2>
                <ul className="mt-4 divide-y divide-ink/10 text-sm">
                  {pays.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <span>{formatDate(p.createdAt, true)} · Chariow{p.userReference && <> · réf. {p.userReference}</>}{p.amount ? ` · ${fcfa(p.amount)}` : ""}</span>
                      <span className="flex items-center gap-3">
                        <StatusBadge label={PAYMENT_STATUS[p.status].label} tone={PAYMENT_STATUS[p.status].tone} />
                        {p.status === "confirmed" && <a className="font-semibold text-brand" href={`/api/receipts/${p.id}`} target="_blank">Reçu</a>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="card p-7">
              <h2 className="text-xl font-semibold">Paiement</h2>
              {!definitive ? (
                <div className="mt-4"><Notice tone="warn">Votre inscription comporte plusieurs formations : le montant total définitif doit d’abord être <strong>validé par l’administration</strong>. Notre équipe vous contactera ; le paiement sera ouvert après validation.</Notice></div>
              ) : (
                <>
                  <p className="mt-3 text-sm text-anthracite/80">
                    Vous allez être redirigé vers la page de paiement sécurisée Chariow. Cette redirection <strong>ne constitue pas une preuve de paiement</strong> : votre paiement sera vérifié par l’établissement avant confirmation.
                  </p>
                  <form action={startPaymentAction} className="mt-5">
                    <input type="hidden" name="registrationId" value={reg.id} />
                    <button type="submit" className="btn-primary w-full">PROCÉDER AU PAIEMENT</button>
                  </form>
                  <p className="mt-3 text-xs text-anthracite/60">Lien officiel : {new URL(s.chariowUrl).host}</p>
                </>
              )}
              <div className="mt-6 border-t border-ink/10 pt-5">
                <p className="text-sm font-semibold">Autres moyens de paiement</p>
                <ul className="mt-2 space-y-1 text-sm text-anthracite/60">
                  {["MTN Mobile Money", "Orange Money", "Visa", "Mastercard"].map((m) => <li key={m}>{m} — <em>pas encore disponible</em></li>)}
                </ul>
              </div>
            </div>

            {definitive && reg.status !== "payment_confirmed" && reg.status !== "validated" && (
              <div className="card p-7">
                <h2 className="text-xl font-semibold">J’ai effectué mon paiement</h2>
                <p className="mt-2 text-sm text-anthracite/75">Saisissez la référence reçue de Chariow : elle accélère la vérification par l’équipe.</p>
                <ActionForm action={declarePaymentAction} className="mt-4 space-y-4">
                  <input type="hidden" name="registrationId" value={reg.id} />
                  <Field name="reference" label="Référence / numéro de transaction" required />
                  <SubmitButton className="btn-dark w-full">Déclarer mon paiement</SubmitButton>
                </ActionForm>
              </div>
            )}
            <Link href="/espace/inscriptions" className="btn-outline w-full">Voir mes inscriptions</Link>
          </aside>
        </div>
      </section>
    </>
  );
}
