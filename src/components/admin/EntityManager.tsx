import { db } from "@/db";
import { ENTITIES } from "@/lib/admin-entities";
import { deleteEntityAction, saveEntityAction } from "@/app/actions/admin";
import EntityForm from "@/components/admin/EntityForm";
import type { FieldDef } from "@/components/admin/AdminField";
import type { SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

type Row = Record<string, unknown>;

export function fieldDefs(key: string): FieldDef[] {
  return ENTITIES[key].fields.map((f) => ({
    name: f.name, label: f.label, type: f.type, required: f.required, help: f.help, rows: f.rows, upload: f.upload,
    options: f.options?.map((o) => ({ value: o, label: o === "draft" ? "Brouillon" : o === "published" ? "Publié" : o })),
  }));
}

export function toValues(key: string, row: Row | null): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const f of ENTITIES[key].fields) {
    const v = row?.[f.name];
    if (f.type === "datetime") {
      const d = v instanceof Date ? v : new Date();
      out[f.name] = new Date(d.getTime() + 3600_000).toISOString().slice(0, 16); // heure de Douala
    } else if (f.type === "bool") out[f.name] = row ? Boolean(v) : f.name === "isActive" || f.name === "isPublished";
    else out[f.name] = (v as string | number | undefined) ?? (f.type === "number" ? 0 : "");
  }
  return out;
}

export default async function EntityManager({
  entityKey, back, hidden, rows: given,
}: { entityKey: string; back: string; hidden?: Record<string, string>; rows?: Row[] }) {
  const ent = ENTITIES[entityKey];
  const rows: Row[] = given ?? ((await db.select().from(ent.table as PgTable).orderBy(...(ent.order as SQL[]))) as Row[]);
  const defs = fieldDefs(entityKey);
  return (
    <div className="space-y-6">
      {ent.intro && <p className="rounded-xl bg-brand-soft p-4 text-sm text-anthracite">{ent.intro}</p>}
      <details className="card p-6">
        <summary className="cursor-pointer font-semibold text-brand">+ Ajouter {ent.singular}</summary>
        <div className="mt-5">
          <EntityForm fields={defs} values={toValues(entityKey, null)} action={saveEntityAction.bind(null, entityKey, null)} hidden={hidden} idPrefix={`new-${entityKey}`} submitLabel="Ajouter" resetOnSuccess />
        </div>
      </details>
      {rows.length === 0 && <p className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-sm text-anthracite/70">Aucun élément pour le moment.</p>}
      {rows.map((r) => (
        <details key={String(r.id)} className="card p-6">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{ent.label(r)}</span>
            <span className="text-xs text-anthracite/60">{ent.sub?.(r)}</span>
          </summary>
          <div className="mt-5">
            <EntityForm fields={defs} values={toValues(entityKey, r)} action={saveEntityAction.bind(null, entityKey, String(r.id))} hidden={hidden} idPrefix={String(r.id)} />
            <form action={deleteEntityAction} className="mt-4 border-t border-ink/10 pt-4">
              <input type="hidden" name="entity" value={entityKey} />
              <input type="hidden" name="id" value={String(r.id)} />
              <input type="hidden" name="back" value={back} />
              <button className="text-sm font-semibold text-red-700 hover:underline" type="submit">Supprimer définitivement</button>
              <span className="ml-2 text-xs text-anthracite/60">(pour masquer sans supprimer, décochez « publié / actif »)</span>
            </form>
          </div>
        </details>
      ))}
    </div>
  );
}
