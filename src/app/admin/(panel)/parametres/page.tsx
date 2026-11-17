import { requireStaff } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { SETTING_GROUPS } from "@/lib/settings-fields";
import EntityForm from "@/components/admin/EntityForm";
import type { FieldDef } from "@/components/admin/AdminField";
import { saveSettingsAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  await requireStaff("settings");
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Paramètres du site</h1>
      <p className="text-sm text-anthracite/70">Logo, bannière, vidéos, coordonnées, réseaux sociaux, documents officiels, tarification et mentions légales. Chaque enregistrement est appliqué immédiatement.</p>
      {SETTING_GROUPS.map((g) => {
        const defs: FieldDef[] = g.fields.map((f) => ({ name: f.key, label: f.label, type: f.type, help: f.help, upload: f.upload, options: f.options, rows: 3 }));
        const values = Object.fromEntries(g.fields.map((f) => [f.key, s[f.key]]));
        return (
          <details key={g.id} className="card p-6" open={g.id === "contact"}>
            <summary className="cursor-pointer text-lg font-semibold">{g.title}</summary>
            {g.description && <p className="mt-2 text-sm text-anthracite/70">{g.description}</p>}
            <div className="mt-5"><EntityForm fields={defs} values={values} action={saveSettingsAction.bind(null, g.id)} idPrefix={`s-${g.id}`} /></div>
          </details>
        );
      })}
    </div>
  );
}
