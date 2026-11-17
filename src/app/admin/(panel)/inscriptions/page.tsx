import Link from "next/link";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { registrationItems, registrations, users } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { getCenters, getFormations } from "@/lib/data";
import { REGISTRATION_STATUS, fcfa } from "@/lib/pricing";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/util";

export const dynamic = "force-dynamic";

export default async function AdminRegistrations({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("registrations");
  const sp = await searchParams;
  const q = sp.q?.trim();
  const [centers, formations] = await Promise.all([getCenters(true), getFormations({ includeInactive: true })]);
  const rows = await db
    .select({ r: registrations, u: users })
    .from(registrations)
    .innerJoin(users, eq(users.id, registrations.userId))
    .where(and(
      sp.centre ? eq(registrations.centerId, sp.centre) : undefined,
      sp.statut ? eq(registrations.status, sp.statut) : undefined,
      q ? or(ilike(users.lastName, `%${q}%`), ilike(users.firstName, `%${q}%`), ilike(users.email, `%${q}%`), ilike(users.phone, `%${q}%`), ilike(registrations.registrationNumber, `%${q}%`)) : undefined,
    ))
    .orderBy(desc(registrations.createdAt))
    .limit(300);
  const ids = rows.map((x) => x.r.id);
  const items = ids.length ? await db.select().from(registrationItems).where(inArray(registrationItems.registrationId, ids)) : [];
  const list = rows.filter((x) => !sp.formation || items.some((i) => i.registrationId === x.r.id && i.formationId === sp.formation));
  const exportQs = new URLSearchParams({ type: "inscriptions", ...(sp.centre ? { centre: sp.centre } : {}), ...(sp.statut ? { statut: sp.statut } : {}), ...(sp.formation ? { formation: sp.formation } : {}) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Inscriptions</h1>
        <a href={`/api/admin/export?${exportQs}`} className="btn-dark btn-sm">Exporter en CSV (Excel)</a>
      </div>
      <form className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <input name="q" defaultValue={q} placeholder="Rechercher (nom, e-mail, tél., n°)" className="input lg:col-span-2" />
        <select name="formation" defaultValue={sp.formation ?? ""} className="input"><option value="">Toutes les formations</option>{formations.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select name="centre" defaultValue={sp.centre ?? ""} className="input"><option value="">Tous les centres</option>{centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="statut" defaultValue={sp.statut ?? ""} className="input"><option value="">Tous les statuts</option>{Object.entries(REGISTRATION_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <button className="btn-primary btn-sm sm:col-span-2 lg:col-span-5">Filtrer</button>
      </form>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-ink/10"><tr><th className="th">Date</th><th className="th">Candidat</th><th className="th">Formations</th><th className="th">Centre</th><th className="th">Total</th><th className="th">Statut</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-ink/5">
            {list.map(({ r, u }) => (
              <tr key={r.id}>
                <td className="td whitespace-nowrap">{formatDate(r.createdAt)}</td>
                <td className="td"><strong>{u.lastName} {u.firstName}</strong><br /><span className="text-xs text-anthracite/60">{u.phone}</span></td>
                <td className="td">{items.filter((i) => i.registrationId === r.id).map((i) => `${i.formationName} (${i.durationLabel})`).join(", ")}</td>
                <td className="td">{r.centerName}</td>
                <td className="td whitespace-nowrap">{r.pricingMode === "definitive" ? fcfa(r.totalAmount) : <em className="text-amber-700">à valider</em>}</td>
                <td className="td"><StatusBadge label={REGISTRATION_STATUS[r.status].label} tone={REGISTRATION_STATUS[r.status].tone} /></td>
                <td className="td"><Link href={`/admin/inscriptions/${r.id}`} className="font-semibold text-brand">Ouvrir</Link></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="td text-center text-anthracite/60" colSpan={7}>Aucune inscription.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
