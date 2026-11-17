"use client";

import { useContext, useState } from "react";
import { FormCtx } from "@/components/forms";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "bool" | "select" | "image" | "url" | "datetime";
  required?: boolean;
  help?: string;
  rows?: number;
  upload?: "image" | "document";
  options?: { value: string; label: string }[];
};

export default function AdminField({ f, value, idPrefix }: { f: FieldDef; value: string | boolean | number | undefined; idPrefix: string }) {
  const st = useContext(FormCtx);
  const err = st.fieldErrors?.[f.name];
  const id = `${idPrefix}-${f.name}`;
  const [url, setUrl] = useState(typeof value === "string" ? value : "");
  const [busy, setBusy] = useState(false);
  const [upErr, setUpErr] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setUpErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !d.url) setUpErr(d.error ?? "Échec du téléversement.");
      else setUrl(d.url);
    } catch {
      setUpErr("Échec du téléversement.");
    }
    setBusy(false);
  }

  if (f.type === "bool") {
    return (
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" name={f.name} defaultChecked={value === true || value === "true"} className="h-4 w-4 accent-[#f26a1b]" /> {f.label}
        {f.help && <span className="text-xs font-normal text-anthracite/60">{f.help}</span>}
      </label>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="label">{f.label} {f.required && <span className="text-brand">*</span>}</label>
      {f.type === "textarea" ? (
        <textarea id={id} name={f.name} rows={f.rows ?? 4} defaultValue={String(value ?? "")} className="input" />
      ) : f.type === "select" ? (
        <select id={id} name={f.name} defaultValue={String(value ?? "")} className="input">
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : f.type === "image" || f.type === "url" ? (
        <div>
          <div className="flex gap-2">
            <input id={id} name={f.name} value={url} onChange={(e) => setUrl(e.target.value)} className="input" placeholder="https://… ou /chemin/image.jpg" />
            {f.upload && (
              <label className="btn-outline btn-sm cursor-pointer whitespace-nowrap">
                {busy ? "Envoi…" : "Téléverser"}
                <input type="file" className="hidden" accept={f.upload === "document" ? "image/jpeg,image/png,image/webp,application/pdf" : "image/jpeg,image/png,image/webp,image/gif"} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            )}
          </div>
          {f.type === "image" && url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Aperçu" className="mt-2 h-20 w-auto rounded-lg border border-ink/10 bg-beige object-cover" />
          )}
          {upErr && <p className="mt-1 text-xs text-red-700">{upErr}</p>}
        </div>
      ) : (
        <input id={id} name={f.name} type={f.type === "number" ? "number" : f.type === "datetime" ? "datetime-local" : "text"} min={f.type === "number" ? 0 : undefined} defaultValue={String(value ?? "")} className="input" />
      )}
      {f.help && <p className="mt-1 text-xs text-anthracite/60">{f.help}</p>}
      {err && <p className="mt-1 text-xs font-medium text-red-700">{err}</p>}
    </div>
  );
}
