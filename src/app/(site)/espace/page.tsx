import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserRegistrations } from "@/lib/queries";
import { REGISTRATION_STATUS } from "@/lib/pricing";
import { Notice, StatusBadge } from "@/components/ui";
import { resendVerificationAction } from "@/app/actions/auth";
import { formatDate } from "@/lib/util";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };

export default async function EspaceHome({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const user = await requireUser("/espace");
  const sp = await searchParams;
  const regs = await getUserRegistrations(user.id);
  return (
    <div className="space-y-6">
      {sp.bienvenue && <Notice tone="success"><strong>Votre compte a été créé avec succès.</strong> Bienvenue chez Herman FASHION ! Vous pouvez maintenant poursuivre votre inscription.</Notice>}
      {!user.emailVerifiedAt && (
        <Notice tone="warn">
          Votre adresse e-mail n’est pas encore vérifiée.
          <form action={resendVerificationAction} className="mt-2"><button className="font-semibold underline">Renvoyer l’e-mail de vérification</button></form>
        </Notice>
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="card p-6"><p className="text-sm text-anthracite/70">Inscriptions</p><p className="mt-1 font-serif text-4xl font-semibold">{regs.length}</p></div>
        <div className="card p-6"><p className="text-sm text-anthracite/70">Formations choisies</p><p className="mt-1 font-serif text-4xl font-semibold">{regs.reduce((n, r) => n + r.items.length, 0)}</p></div>
        <div className="card p-6"><p className="text-sm text-anthracite/70">Paiements confirmés</p><p className="mt-1 font-serif text-4xl font-semibold">{regs.reduce((n, r) => n + r.payments.filter((p) => p.status === "confirmed").length, 0)}</p></div>
      </div>

      <div className="card p-7">
        <h2 className="text-xl font-semibold">Mes informations</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-anthracite/60">Nom et prénom</dt><dd className="font-medium">{user.lastName} {user.firstName}</dd></div>
          <div><dt className="text-anthracite/60">E-mail</dt><dd className="font-medium">{user.email}</dd></div>
          <div><dt className="text-anthracite/60">Téléphone</dt><dd className="font-medium">{user.phone}</dd></div>
          <div><dt className="text-anthracite/60">Localisation</dt><dd className="font-medium">{user.city}, {user.country}</dd></div>
        </dl>
        <Link href="/espace/profil" className="btn-outline btn-sm mt-5">Modifier mon profil</Link>
      </div>

      <div className="card p-7">
        <h2 className="text-xl font-semibold">Dernières inscriptions</h2>
        {regs.length === 0 ? (
          <p className="mt-4 text-sm text-anthracite/70">Vous n’avez pas encore d’inscription. <Link href="/inscription" className="font-semibold text-brand">Commencer mon inscription</Link></p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10">
            {regs.slice(0, 3).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                <div>
                  <p className="font-semibold">{r.items.map((i) => i.formationName).join(", ")}</p>
                  <p className="text-anthracite/70">{r.centerName} · {formatDate(r.createdAt)}{r.registrationNumber && ` · N° ${r.registrationNumber}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge label={REGISTRATION_STATUS[r.status].label} tone={REGISTRATION_STATUS[r.status].tone} />
                  <Link href={`/inscription/paiement/${r.id}`} className="font-semibold text-brand">Détails</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
