import { desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { registrationItems, registrations, users } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { toggleUserActiveAction } from "@/app/actions/admin";
import { REGISTRATION_STATUS } from "@/lib/pricing";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/util";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; id?: string }> }) {
  const staff = await requireStaff("users");
  const { q, id } = await searchParams;
  const list = await db.select().from(users).where(q ? or(ilike(users.lastName, `%${q}%`), ilike(users.firstName, `%${q}%`), ilike(users.email, `%${q}%`), ilike(users.phone, `%${q}%`)) : undefined).orderBy(desc(users.createdAt)).limit(200);
  const selected = id ? list.find((u) => u.id === id) : null;
  const regs = selected ? await db.select().from(registrations).where(eq(registrations.userId, selected.id)).orderBy(desc(registrations.createdAt)) : [];
  const items = selected ? await db.select().from(registrationItems) : [];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Utilisateurs</h1>
        <a href="/api/admin/export?type=utilisateurs" className="btn-dark btn-sm">Exporter en CSV</a>
      </div>
      <form className="flex gap-3"><input name="q" defaultValue={q} placeholder="Rechercher (nom, e-mail, téléphone)" className="input max-w-md" /><button className="btn-primary btn-sm">Rechercher</button></form>
      {selected && (
        <section className="rounded-2xl border-2 border-brand bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{selected.lastName} {selected.firstName}</h2>
          <p className="mt-1 text-sm text-anthracite/70">{selected.email} · {selected.phone} · {selected.city}, {selected.country} · inscrit le {formatDate(selected.createdAt)}</p>
          <h3 className="mt-4 font-semibold">Inscriptions et formations</h3>
          {regs.length === 0 ? <p className="mt-2 text-sm text-anthracite/60">Aucune inscription.</p> : (
            <ul className="mt-2 space-y-2 text-sm">
              {regs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-beige p-3">
                  <span>{items.filter((i) => i.registrationId === r.id).map((i) => `${i.formationName} (${i.durationLabel})`).join(", ")} — {r.centerName}</span>
                  <span className="flex items-center gap-3"><StatusBadge label={REGISTRATION_STATUS[r.status].label} tone={REGISTRATION_STATUS[r.status].tone} /><Link href={`/admin/inscriptions/${r.id}`} className="font-semibold text-brand">Ouvrir</Link></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-ink/10"><tr><th className="th">Inscrit le</th><th className="th">Nom</th><th className="th">Contact</th><th className="th">Rôle</th><th className="th">E-mail vérifié</th><th className="th">Accès</th></tr></thead>
          <tbody className="divide-y divide-ink/5">
            {list.map((u) => (
              <tr key={u.id}>
                <td className="td whitespace-nowrap">{formatDate(u.createdAt)}</td>
                <td className="td"><Link className="font-semibold text-brand" href={`/admin/utilisateurs?${new URLSearchParams({ ...(q ? { q } : {}), id: u.id })}`}>{u.lastName} {u.firstName}</Link></td>
                <td className="td text-xs">{u.email}<br />{u.phone}</td>
                <td className="td">{ROLES[u.role]?.label}</td>
                <td className="td">{u.emailVerifiedAt ? "Oui" : "Non"}</td>
                <td className="td">
                  {u.id !== staff.id && (
                    <form action={toggleUserActiveAction}><input type="hidden" name="id" value={u.id} />
                      <button className={`btn-sm btn ${u.isActive ? "border border-red-300 text-red-700" : "bg-green-600 text-white"}`}>{u.isActive ? "Désactiver" : "Réactiver"}</button></form>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td className="td text-center text-anthracite/60" colSpan={6}>Aucun utilisateur.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
