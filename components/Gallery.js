"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";

const src = (m) => `/api/media/${m.path}`;

// Galeri gambar dengan lightbox; panah kiri/kanan untuk berpindah gambar
export default function Gallery({ media }) {
  const [open, setOpen] = useState(null);
  const n = media.length;
  useEffect(() => {
    if (open === null) return;
    const k = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((x) => (x + 1) % n);
      if (e.key === "ArrowLeft") setOpen((x) => (x - 1 + n) % n);
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, n]);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {media.map((m, k) => (
          <button key={m.id} onClick={() => setOpen(k)} className="group relative overflow-hidden rounded-2xl border border-line bg-subtle text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(m)} alt={m.caption || "gambar"} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105" />
            {m.caption && <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-xs font-semibold text-white">{m.caption}</span>}
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(media[open])} alt={media[open].caption || ""} className="max-h-[80vh] max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} />
          <p className="mt-3 text-center text-sm text-white/80">{media[open].caption} <span className="text-white/40">· {open + 1}/{n}</span></p>
          {n > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + n) % n); }} className="absolute left-4 top-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Sebelumnya"><Icon name="chevronLeft" /></button>
              <button onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % n); }} className="absolute right-4 top-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Berikutnya"><Icon name="chevronRight" /></button>
            </>
          )}
          <button onClick={() => setOpen(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Tutup"><Icon name="close" /></button>
        </div>
      )}
    </>
  );
}

export function VideoGallery({ media }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {media.map((m) => (
        <figure key={m.id} className="overflow-hidden rounded-2xl border border-line bg-card">
          {m.type === "youtube" ? (
            <iframe className="aspect-video w-full" src={`https://www.youtube-nocookie.com/embed/${m.path}`} title={m.caption || "video"} allow="encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <video src={src(m)} controls preload="metadata" className="aspect-video w-full bg-black" />
          )}
          {m.caption && <figcaption className="px-4 py-3 text-sm font-semibold text-heading">{m.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
