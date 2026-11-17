"use client";

import { useEffect, useState } from "react";

type Item = { id: string; category: string; imageUrl: string; caption: string; altText: string };

const SPANS = ["row-span-2", "", "", "row-span-2", "", "col-span-2", "", "row-span-2"];

export default function GalleryGrid({ items, categories }: { items: Item[]; categories: string[] }) {
  const [cat, setCat] = useState("Tout");
  const [open, setOpen] = useState<number | null>(null);
  const shown = cat === "Tout" ? items : items.filter((i) => i.category === cat);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % shown.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + shown.length) % shown.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shown.length]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Catégories de la galerie">
        {["Tout", ...categories].map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${cat === c ? "bg-brand text-white" : "bg-beige text-anthracite hover:bg-sand"}`}>
            {c}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/20 bg-beige/60 p-10 text-center text-sm text-anthracite/70">
          Aucune photographie n’est publiée dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-3 lg:grid-cols-4">
          {shown.map((it, i) => (
            <button key={it.id} onClick={() => setOpen(i)} className={`group relative overflow-hidden rounded-2xl bg-beige ${SPANS[i % SPANS.length]}`} aria-label={`Agrandir : ${it.caption || it.altText || it.category}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.imageUrl} alt={it.altText || it.caption || it.category} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-3 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">{it.caption || it.category}</span>
            </button>
          ))}
        </div>
      )}
      {open !== null && shown[open] && (
        <div role="dialog" aria-modal="true" aria-label="Image agrandie" className="fixed inset-0 z-[70] grid place-items-center bg-ink/95 p-4" onClick={() => setOpen(null)}>
          <button className="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-white" onClick={() => setOpen(null)}>Fermer ✕</button>
          <button className="absolute left-3 top-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white" aria-label="Précédente" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + shown.length) % shown.length); }}>‹</button>
          <button className="absolute right-3 top-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white" aria-label="Suivante" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % shown.length); }}>›</button>
          <figure onClick={(e) => e.stopPropagation()} className="max-h-full max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown[open].imageUrl} alt={shown[open].altText || shown[open].caption} className="max-h-[80vh] w-auto rounded-xl object-contain" />
            <figcaption className="mt-3 text-center text-sm text-white/80">{shown[open].caption}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
