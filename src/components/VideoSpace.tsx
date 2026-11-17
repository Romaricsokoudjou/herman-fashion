"use client";

import { useState } from "react";
import { PlayIcon } from "@/components/ui";

function ytId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,15})/);
  return m?.[1] ?? null;
}

export default function VideoSpace({ title, url, thumb, label }: { title: string; url: string; thumb: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  const id = url ? ytId(url) : null;
  const isFile = !!url && !id && /\.(mp4|webm|mov)(\?|$)/i.test(url) || (!!url && url.startsWith("/api/media/"));
  const poster = thumb || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "");

  if (!url || (!id && !isFile)) {
    return (
      <figure>
        <div className="grid aspect-video place-items-center rounded-3xl border border-dashed border-ink/25 bg-beige text-center">
          <div className="px-6">
            <p className="eyebrow">{label}</p>
            <p className="mt-2 font-serif text-xl font-semibold">{title}</p>
            <p className="mt-2 text-sm text-anthracite/70">La vidéo officielle sera publiée prochainement.</p>
          </div>
        </div>
      </figure>
    );
  }

  return (
    <figure>
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-ink shadow-2xl">
        {playing ? (
          id ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <video className="absolute inset-0 h-full w-full" src={url} poster={poster || undefined} controls autoPlay playsInline />
          )
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full text-left" aria-label={`Lire la vidéo : ${title}`}>
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt={`Miniature : ${title}`} loading="lazy" className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105" />
            ) : (
              <span className="block h-full w-full bg-gradient-to-br from-anthracite to-ink" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-white shadow-xl transition group-hover:scale-110">
              <PlayIcon />
            </span>
            <span className="absolute bottom-5 left-6 right-6 text-white">
              <span className="eyebrow block !text-brand">{label}</span>
              <span className="font-serif text-xl font-semibold">{title}</span>
            </span>
          </button>
        )}
      </div>
    </figure>
  );
}
