import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chariowEvents, payments, registrations, users } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { PAYMENT_STATUS, fcfa } from "@/lib/pricing";
import { Notice, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function AdminPayments() {
  await requireStaff("finance");
  const [rows, events] = await Promise.all([
    db.select({ p: payments, u: users, r: registrations }).from(payments).innerJoin(users, eq(users.id, payments.userId)).innerJoin(registrations, eq(registrations.id, payments.registrationId)).orderBy(desc(payments.createdAt)).limit(300),
    db.select().from(chariowEvents).orderBy(desc(chariowEvents.createdAt)).limit(30),
  ]);
  const total = rows.filter((x) => x.p.status === "confirmed").reduce((n, x) => n + (x.p.amount ?? 0), 0);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-semibold">Finance & paiements</h1><p className="text-sm text-anthracite/70">Total encaissé (confirmé) : <strong className="text-brand">{fcfa(total)}</strong></p></div>
        <a href="/api/admin/export?type=paiements" className="btn-dark btn-sm">Exporter en CSV (Excel)</a>
      </div>
      {!process.env.CHARIOW_PULSE_SECRET && (
        <Notice tone="warn">La vérification automatique Chariow (Pulse) n’est pas configurée : définissez CHARIOW_PULSE_SECRET et ajoutez l’URL <code>/api/payments/chariow/webhook</code> dans Chariow. En attendant, chaque paiement est vérifié manuellement.</Notice>
      )}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-ink/10"><tr><th className="th">Date</th><th className="th">Candidat</th><th className="th">Moyen</th><th className="th">Référence</th><th className="th">Montant</th><th className="th">Statut</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-ink/5">
            {rows.map(({ p, u, r }) => (
              <tr key={p.id}>
                <td className="td whitespace-nowrap">{formatDate(p.createdAt, true)}</td>
                <td className="td">{u.lastName} {u.firstName}</td>
                <td className="td">{p.provider}</td>
                <td className="td text-xs">{p.userReference || "—"}{p.providerVerified && <span className="ml-1 font-semibold text-green-700">✔ Chariow</span>}</td>
                <td className="td whitespace-nowrap">{p.amount ? fcfa(p.amount) : "—"}</td>
                <td className="td"><StatusBadge label={PAYMENT_STATUS[p.status].label} tone={PAYMENT_STATUS[p.status].tone} /></td>
                <td className="td"><Link href={`/admin/inscriptions/${r.id}`} className="font-semibold text-brand">{p.status === "confirmed" ? "Voir" : "Vérifier"}</Link></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className="td text-center text-anthracite/60" colSpan={7}>Aucune transaction.</td></tr>}
          </tbody>
        </table>
      </div>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Notifications Chariow reçues (signées)</h2>
        {events.length === 0 ? <p className="mt-3 text-sm text-anthracite/60">Aucune notification reçue.</p> : (
          <ul className="mt-4 divide-y divide-ink/10 text-sm">
            {events.map((e) => <li key={e.id} className="py-2">{formatDate(e.createdAt, true)} · {e.eventType} · vente {e.saleId || "—"} · {e.customerEmail || "—"} · {e.matchedPaymentId ? "rapprochée d’un paiement" : "non rapprochée"}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
