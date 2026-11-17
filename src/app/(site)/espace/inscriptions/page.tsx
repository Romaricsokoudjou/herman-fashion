import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserRegistrations } from "@/lib/queries";
import { REGISTRATION_STATUS, fcfa } from "@/lib/pricing";
import { EmptyState, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/util";

export const metadata: Metadata = { title: "Mes inscriptions", robots: { index: false } };

export default async function MyRegistrations() {
  const user = await requireUser("/espace/inscriptions");
  const regs = await getUserRegistrations(user.id);
  if (!regs.length) return <EmptyState title="Aucune inscription pour le moment."><Link href="/inscription" className="btn-primary mt-4">Commencer mon inscription</Link></EmptyState>;
  return (
    <div className="space-y-6">
      {regs.map((r) => (
        <article key={r.id} className="card p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{r.registrationNumber ? `Inscription ${r.registrationNumber}` : "Inscription en cours de traitement"}</h2>
              <p className="text-sm text-anthracite/70">{r.centerName} · {formatDate(r.createdAt)}</p>
            </div>
            <StatusBadge label={REGISTRATION_STATUS[r.status].label} tone={REGISTRATION_STATUS[r.status].tone} />
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            {r.items.map((i) => (
              <li key={i.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-beige px-4 py-3">
                <span><strong>{i.formationName}</strong> — {i.durationLabel}{i.diploma && ` (${i.diploma})`}</span>
                <span>{fcfa(i.trainingFee)} + {fcfa(i.registrationFee)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">Montant total : <strong>{r.pricingMode === "definitive" ? fcfa(r.totalAmount) : "à valider par l’administration"}</strong></p>
          {r.adminNote && (
            <div className="mt-4 rounded-xl border border-brand/30 bg-brand-soft p-4 text-sm">
              <p className="font-semibold">Informations de votre établissement</p>
              <p className="mt-1 whitespace-pre-line">{r.adminNote}</p>
            </div>
          )}
          <Link href={`/inscription/paiement/${r.id}`} className="btn-outline btn-sm mt-5">Détails et paiement</Link>
        </article>
      ))}
    </div>
  );
}
