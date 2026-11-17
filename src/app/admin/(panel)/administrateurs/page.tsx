import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { ADMIN_ROLES, ROLES } from "@/lib/permissions";
import { ActionForm, Field, SubmitButton } from "@/components/forms";
import { setRoleAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const PERM_LABELS: Record<string, string> = {
  users: "Utilisateurs", registrations: "Inscriptions & messages", finance: "Finance & paiements", formations: "Formations & tarifs",
  content: "Contenus", ai: "Assistant IA", settings: "Paramètres", admins: "Administrateurs", audit: "Journal",
};

export default async function AdminAdmins() {
  await requireStaff("admins");
  const staff = await db.select().from(users).where(inArray(users.role, ADMIN_ROLES)).orderBy(desc(users.createdAt));
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Administrateurs et rôles</h1>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Attribuer ou retirer un rôle</h2>
        <p className="mt-1 text-sm text-anthracite/70">La personne doit d’abord avoir créé un compte sur le site. Choisissez « Apprenant » pour retirer l’accès à l’administration.</p>
        <ActionForm action={setRoleAction} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" resetOnSuccess>
          <Field name="email" label="E-mail du compte" type="email" required />
          <div><label className="label" htmlFor="role">Rôle</label><select id="role" name="role" className="input">{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
          <SubmitButton className="btn-primary btn-sm">Appliquer</SubmitButton>
        </ActionForm>
      </section>
      <section className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[600px]"><thead className="border-b border-ink/10"><tr><th className="th">Nom</th><th className="th">E-mail</th><th className="th">Rôle</th></tr></thead>
          <tbody className="divide-y divide-ink/5">{staff.map((u) => <tr key={u.id}><td className="td">{u.lastName} {u.firstName}</td><td className="td">{u.email}</td><td className="td">{ROLES[u.role]?.label}{!u.isActive && " (désactivé)"}</td></tr>)}</tbody></table>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Permissions par rôle</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {ADMIN_ROLES.map((r) => <li key={r}><strong>{ROLES[r].label}</strong> : {ROLES[r].permissions.map((p) => PERM_LABELS[p]).join(", ")}</li>)}
        </ul>
      </section>
    </div>
  );
}
