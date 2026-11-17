import { and, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { contactMessages, conversations, payments, registrationItems, registrations, users } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { fcfa, PAYMENT_STATUS } from "@/lib/pricing";
import { Notice } from "@/components/ui";
import { getSettings } from "@/lib/data";
import { AGREMENT_REF } from "@/lib/settings-fields";

export const dynamic = "force-dynamic";

function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-anthracite/60">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireStaff();
  const sp = await searchParams;
  const s = await getSettings();
  const showFin = can(user.role, "finance");
  const showReg = can(user.role, "registrations") || showFin;

  const [[usersN], [regN], payAgg, byFormation, byCenter, [pendingN], [msgN], [handoffN]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "learner")),
    db.select({ n: sql<number>`count(*)::int` }).from(registrations),
    db.select({ status: payments.status, n: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${payments.amount}),0)::int` }).from(payments).groupBy(payments.status),
    db.select({ name: registrationItems.formationName, n: sql<number>`count(*)::int` }).from(registrationItems).groupBy(registrationItems.formationName).orderBy(desc(sql`count(*)`)),
    db.select({ name: registrations.centerName, n: sql<number>`count(*)::int` }).from(registrations).groupBy(registrations.centerName),
    db.select({ n: sql<number>`count(*)::int` }).from(payments).where(eq(payments.status, "pending_verification")),
    db.select({ n: sql<number>`count(*)::int` }).from(contactMessages).where(eq(contactMessages.isHandled, false)),
    db.select({ n: sql<number>`count(*)::int` }).from(conversations).where(and(eq(conversations.status, "handoff"))),
  ]);
  const by = (st: string) => payAgg.find((p) => p.status === st);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Tableau de bord</h1>
        <p className="text-sm text-anthracite/70">Statistiques calculées en temps réel à partir de la base de données.</p>
      </div>
      {sp.denied && <Notice tone="error">Vous n’avez pas la permission d’accéder à cette section.</Notice>}
      {s.contactsVerified !== "true" && can(user.role, "settings") && (
        <Notice tone="warn">
          <strong>À faire :</strong> les coordonnées (téléphones, WhatsApp) doivent être vérifiées avant publication définitive. Note : le lien WhatsApp communiqué (…674407046) diffère du premier téléphone (…674 497 946) — vérifiez-le.{" "}
          <Link href="/admin/parametres" className="font-semibold underline">Paramètres</Link>
        </Notice>
      )}
      {(!s.email || !s.rccm) && can(user.role, "settings") && (
        <Notice tone="info">Éléments à renseigner : {[!s.email && "adresse e-mail officielle", !s.rccm && "numéro RCCM", !s.hours && "horaires", !s.agrementDocUrl && "document d’agrément (PDF/image)"].filter(Boolean).join(", ")}.</Notice>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {showReg && <Stat label="Inscriptions" value={regN.n} href="/admin/inscriptions" />}
        {can(user.role, "users") && <Stat label="Apprenants (comptes)" value={usersN.n} href="/admin/utilisateurs" />}
        {showFin && <Stat label="Total encaissé" value={fcfa(by("confirmed")?.total ?? 0)} href="/admin/paiements" />}
        {showFin && <Stat label="Paiements confirmés" value={by("confirmed")?.n ?? 0} />}
        {showFin && <Stat label="Paiements en attente de vérification" value={pendingN.n} href="/admin/paiements" />}
        {showFin && <Stat label="Paiements échoués" value={by("failed")?.n ?? 0} />}
        {can(user.role, "registrations") && <Stat label="Messages non traités" value={msgN.n} href="/admin/messages" />}
        {can(user.role, "ai") && <Stat label="Demandes de conseiller (IA)" value={handoffN.n} href="/admin/ia" />}
      </div>

      {showReg && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Répartition par formation</h2>
            {byFormation.length === 0 ? <p className="mt-3 text-sm text-anthracite/60">Aucune inscription pour le moment.</p> : (
              <ul className="mt-4 space-y-2 text-sm">{byFormation.map((f) => <li key={f.name} className="flex justify-between"><span>{f.name}</span><strong>{f.n}</strong></li>)}</ul>
            )}
          </section>
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Répartition par centre</h2>
            {byCenter.length === 0 ? <p className="mt-3 text-sm text-anthracite/60">Aucune inscription pour le moment.</p> : (
              <ul className="mt-4 space-y-2 text-sm">{byCenter.map((f) => <li key={f.name} className="flex justify-between"><span>{f.name}</span><strong>{f.n}</strong></li>)}</ul>
            )}
            {showFin && (
              <div className="mt-6 border-t border-ink/10 pt-4 text-sm">
                <p className="font-semibold">Paiements par statut</p>
                <ul className="mt-2 space-y-1">{payAgg.map((p) => <li key={p.status} className="flex justify-between"><span>{PAYMENT_STATUS[p.status]?.label}</span><span>{p.n} · {fcfa(p.total)}</span></li>)}</ul>
              </div>
            )}
          </section>
        </div>
      )}
      <p className="text-xs text-anthracite/50">Agrément affiché sur le site : {AGREMENT_REF}</p>
    </div>
  );
}
