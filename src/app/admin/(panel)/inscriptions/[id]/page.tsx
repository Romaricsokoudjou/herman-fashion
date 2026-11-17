import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, registrationItems, registrations, users } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { PAYMENT_STATUS, REGISTRATION_STATUS, fcfa, parseInstallments } from "@/lib/pricing";
import { StatusBadge } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { addManualPaymentAction, confirmPaymentAction, failPaymentAction, updateRegistrationAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff("registrations");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [reg] = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  if (!reg) notFound();
  const [[u], items, pays] = await Promise.all([
    db.select().from(users).where(eq(users.id, reg.userId)).limit(1),
    db.select().from(registrationItems).where(eq(registrationItems.registrationId, id)),
    db.select().from(payments).where(eq(payments.registrationId, id)).orderBy(asc(payments.createdAt)),
  ]);
  const canFin = can(staff.role, "finance");
  return (
    <div className="space-y-6">
      <Link href="/admin/inscriptions" className="text-sm text-brand">← Inscriptions</Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">{reg.registrationNumber ?? "Inscription non confirmée"}</h1>
        <StatusBadge label={REGISTRATION_STATUS[reg.status].label} tone={REGISTRATION_STATUS[reg.status].tone} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Candidat</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div><dt className="inline text-anthracite/60">Nom : </dt><dd className="inline font-medium">{u.lastName} {u.firstName}</dd></div>
            <div><dt className="inline text-anthracite/60">E-mail : </dt><dd className="inline">{u.email}</dd></div>
            <div><dt className="inline text-anthracite/60">Téléphone : </dt><dd className="inline">{u.phone}</dd></div>
            <div><dt className="inline text-anthracite/60">Lieu : </dt><dd className="inline">{u.city}, {u.country}</dd></div>
            <div><dt className="inline text-anthracite/60">Centre : </dt><dd className="inline">{reg.centerName}</dd></div>
            <div><dt className="inline text-anthracite/60">Créée le : </dt><dd className="inline">{formatDate(reg.createdAt, true)}</dd></div>
          </dl>
          <h3 className="mt-6 font-semibold">Formations</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="rounded-xl bg-beige p-3">
                <strong>{i.formationName}</strong> — {i.durationLabel}{i.diploma && ` (${i.diploma})`}<br />
                Formation {fcfa(i.trainingFee)} · Inscription {fcfa(i.registrationFee)}
                {parseInstallments(i.installments).length > 0 && <><br /><span className="text-xs text-anthracite/70">Tranches : {parseInstallments(i.installments).map((x) => fcfa(x)).join(" · ")}</span></>}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">Total formation : <strong>{fcfa(reg.trainingTotal)}</strong> · Total inscription : <strong>{fcfa(reg.registrationTotal)}</strong><br />Montant total : <strong>{reg.pricingMode === "definitive" ? fcfa(reg.totalAmount) : "à valider (règle de cumul non définie)"}</strong></p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Traitement</h2>
          <ActionForm action={updateRegistrationAction} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={reg.id} />
            <div><label className="label" htmlFor="status">Statut</label>
              <select id="status" name="status" defaultValue={reg.status} className="input">{Object.entries(REGISTRATION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
            {reg.pricingMode !== "definitive" && (
              <div><label className="label" htmlFor="totalAmount">Fixer le montant total définitif (FCFA)</label>
                <input id="totalAmount" name="totalAmount" type="number" min={0} className="input" placeholder={`Somme brute indicative : ${reg.trainingTotal + reg.registrationTotal}`} />
                <p className="mt-1 text-xs text-anthracite/60">À définir selon la règle de cumul validée par la direction. Le candidat pourra alors payer.</p></div>
            )}
            <div><label className="label" htmlFor="adminNote">Informations visibles par l’apprenant (accès aux cours, consignes…)</label>
              <textarea id="adminNote" name="adminNote" rows={4} defaultValue={reg.adminNote} className="input" /></div>
            <SubmitButton className="btn-primary btn-sm">Enregistrer</SubmitButton>
          </ActionForm>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Paiements</h2>
        {pays.length === 0 && <p className="mt-3 text-sm text-anthracite/60">Aucun paiement enregistré.</p>}
        <div className="mt-4 space-y-4">
          {pays.map((p) => (
            <div key={p.id} className="rounded-xl border border-ink/10 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{formatDate(p.createdAt, true)} · {p.provider}{p.userReference && ` · réf. déclarée : ${p.userReference}`}{p.providerReference && ` · vente Chariow : ${p.providerReference}`}</span>
                <StatusBadge label={PAYMENT_STATUS[p.status].label} tone={PAYMENT_STATUS[p.status].tone} />
              </div>
              {p.providerVerified && <p className="mt-2 text-xs font-semibold text-green-700">✔ Notification Chariow signée reçue — confirmez après contrôle du montant et du candidat.</p>}
              {p.note && <p className="mt-1 text-xs text-anthracite/60">{p.note}</p>}
              {p.status === "confirmed" && <p className="mt-2">Montant : <strong>{fcfa(p.amount)}</strong> · Reçu {p.receiptNumber} · <a className="font-semibold text-brand" href={`/api/receipts/${p.id}`} target="_blank">Ouvrir</a></p>}
              {canFin && p.status !== "confirmed" && (
                <div className="mt-3 grid gap-4 border-t border-ink/10 pt-3 md:grid-cols-[1fr_auto]">
                  <ActionForm action={confirmPaymentAction} className="space-y-3">
                    <input type="hidden" name="paymentId" value={p.id} />
                    <input name="amount" type="number" min={1} placeholder="Montant réellement reçu (FCFA)" className="input" />
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="verified" className="accent-[#f26a1b]" /> J’atteste avoir vérifié cette transaction (compte Chariow / relevé).</label>
                    <SubmitButton className="btn-primary btn-sm">Confirmer le paiement</SubmitButton>
                  </ActionForm>
                  {p.status !== "failed" && (
                    <form action={failPaymentAction}><input type="hidden" name="paymentId" value={p.id} /><button className="btn-outline btn-sm text-red-700">Marquer comme échoué</button></form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {canFin && (
          <details className="mt-6 rounded-xl bg-beige p-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand">+ Enregistrer un paiement reçu hors ligne (espèces, virement, Mobile Money…)</summary>
            <ActionForm action={addManualPaymentAction} className="mt-4 grid gap-3 md:grid-cols-4" resetOnSuccess>
              <input type="hidden" name="registrationId" value={reg.id} />
              <select name="method" className="input"><option value="especes">Espèces</option><option value="virement">Virement</option><option value="mobile_money">Mobile Money</option></select>
              <input name="amount" type="number" min={1} placeholder="Montant (FCFA)" className="input" />
              <input name="reference" placeholder="Référence / n° de reçu" className="input" />
              <SubmitButton className="btn-primary btn-sm">Enregistrer et confirmer</SubmitButton>
            </ActionForm>
          </details>
        )}
      </section>
    </div>
  );
}
