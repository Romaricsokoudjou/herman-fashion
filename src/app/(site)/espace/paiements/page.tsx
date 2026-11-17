import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getUserRegistrations } from "@/lib/queries";
import { PAYMENT_STATUS, fcfa } from "@/lib/pricing";
import { EmptyState, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/util";

export const metadata: Metadata = { title: "Mes paiements et reçus", robots: { index: false } };

export default async function MyPayments() {
  const user = await requireUser("/espace/paiements");
  const regs = await getUserRegistrations(user.id);
  const pays = regs.flatMap((r) => r.payments.map((p) => ({ ...p, reg: r })));
  if (!pays.length) return <EmptyState title="Aucun paiement enregistré.">Vos paiements apparaîtront ici après votre passage par la page de paiement.</EmptyState>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-ink/10"><tr><th className="th">Date</th><th className="th">Formation(s)</th><th className="th">Montant</th><th className="th">Statut</th><th className="th">Reçu</th></tr></thead>
        <tbody className="divide-y divide-ink/5">
          {pays.map((p) => (
            <tr key={p.id}>
              <td className="td">{formatDate(p.createdAt, true)}</td>
              <td className="td">{p.reg.items.map((i) => i.formationName).join(", ")}</td>
              <td className="td">{p.amount ? fcfa(p.amount) : "—"}</td>
              <td className="td"><StatusBadge label={PAYMENT_STATUS[p.status].label} tone={PAYMENT_STATUS[p.status].tone} /></td>
              <td className="td">
                {p.status === "confirmed" ? (
                  <span className="flex gap-3"><a className="font-semibold text-brand" href={`/api/receipts/${p.id}`} target="_blank">Ouvrir</a><a className="font-semibold text-brand" href={`/api/receipts/${p.id}?download=1`}>Télécharger</a></span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
