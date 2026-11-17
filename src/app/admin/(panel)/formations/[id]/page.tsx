import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { formationOffers, formations } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import EntityManager, { fieldDefs, toValues } from "@/components/admin/EntityManager";
import EntityForm from "@/components/admin/EntityForm";
import { deleteEntityAction, saveEntityAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminFormationEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("formations");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [f] = await db.select().from(formations).where(eq(formations.id, id)).limit(1);
  if (!f) notFound();
  const offers = await db.select().from(formationOffers).where(eq(formationOffers.formationId, id)).orderBy(asc(formationOffers.sortOrder));
  return (
    <div className="space-y-8">
      <Link href="/admin/formations" className="text-sm text-brand">← Formations</Link>
      <h1 className="text-3xl font-semibold">{f.name}</h1>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold">Contenu de la formation</h2>
        <EntityForm fields={fieldDefs("formations")} values={toValues("formations", f)} action={saveEntityAction.bind(null, "formations", f.id)} idPrefix={f.id} />
        <form action={deleteEntityAction} className="mt-4 border-t border-ink/10 pt-4">
          <input type="hidden" name="entity" value="formations" /><input type="hidden" name="id" value={f.id} /><input type="hidden" name="back" value="/admin/formations" />
          <button className="text-sm font-semibold text-red-700 hover:underline">Supprimer cette formation</button>
          <span className="ml-2 text-xs text-anthracite/60">(impossible si elle a déjà des inscriptions — désactivez-la plutôt)</span>
        </form>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Durées et tarifs de cette formation</h2>
        <p className="mb-4 text-sm text-anthracite/70">Ne créez que les durées réellement proposées pour cette spécialité. Les tranches sont indiquées en FCFA séparées par des virgules.</p>
        <EntityManager entityKey="offres" back={`/admin/formations/${f.id}`} hidden={{ formationId: f.id }} rows={offers} />
      </section>
    </div>
  );
}
