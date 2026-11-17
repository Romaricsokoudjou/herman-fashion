import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { getFormations } from "@/lib/data";
import { fieldDefs, toValues } from "@/components/admin/EntityManager";
import EntityForm from "@/components/admin/EntityForm";
import { saveEntityAction } from "@/app/actions/admin";
import { StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminFormations() {
  await requireStaff("formations");
  const formations = await getFormations({ includeInactive: true });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Formations & tarifs</h1>
      <p className="rounded-xl bg-brand-soft p-4 text-sm">Chaque modification est immédiatement répercutée sur le site, le récapitulatif d’inscription et la base de connaissances de HERMAN AI. La coiffure homme n’est pas créée : ajoutez-la ici uniquement après validation administrative.</p>
      <details className="card p-6">
        <summary className="cursor-pointer font-semibold text-brand">+ Ajouter une formation</summary>
        <div className="mt-5"><EntityForm fields={fieldDefs("formations")} values={toValues("formations", null)} action={saveEntityAction.bind(null, "formations", null)} idPrefix="new-f" submitLabel="Créer la formation" resetOnSuccess /></div>
      </details>
      <div className="grid gap-4 md:grid-cols-2">
        {formations.map((f) => (
          <Link key={f.id} href={`/admin/formations/${f.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-xl">
            {f.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.imageUrl} alt="" className="h-16 w-24 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg font-semibold">{f.name}</p>
              <p className="text-xs text-anthracite/60">{f.offers.length} durée(s) : {f.offers.map((o) => o.durationLabel).join(", ") || "aucune"}</p>
            </div>
            <StatusBadge label={f.isActive ? "Active" : "Désactivée"} tone={f.isActive ? "green" : "slate"} />
          </Link>
        ))}
      </div>
    </div>
  );
}
