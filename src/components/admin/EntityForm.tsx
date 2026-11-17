"use client";

import { ActionForm, SubmitButton } from "@/components/forms";
import AdminField, { type FieldDef } from "@/components/admin/AdminField";
import type { FormState } from "@/lib/form-state";

export default function EntityForm({
  fields, values, action, hidden, idPrefix, submitLabel = "Enregistrer", resetOnSuccess = false,
}: {
  fields: FieldDef[];
  values: Record<string, string | number | boolean>;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  hidden?: Record<string, string>;
  idPrefix: string;
  submitLabel?: string;
  resetOnSuccess?: boolean;
}) {
  return (
    <ActionForm action={action} className="space-y-4" resetOnSuccess={resetOnSuccess}>
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.type === "textarea" || f.type === "image" || f.type === "url" ? "md:col-span-2" : ""}>
            <AdminField f={f} value={values[f.name]} idPrefix={idPrefix} />
          </div>
        ))}
      </div>
      <SubmitButton className="btn-primary btn-sm">{submitLabel}</SubmitButton>
    </ActionForm>
  );
}
