"use client";
import { useState } from "react";

// Galeri screenshot dan video; klik untuk memperbesar
export default function Gallery({ media }) {
  const [open, setOpen] = useState(null);
  const src = (m) => `/api/media/${m.path}`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {media.map((m) => (
          <figure key={m.id} className="card overflow-hidden">
            {m.type === "image" && (
              <button onClick={() => setOpen(m)} className="block aspect-[16/10] w-full bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(m)} alt={m.caption || "screenshot"} className="h-full w-full object-cover" loading="lazy" />
              </button>
            )}
            {m.type === "video" && <video src={src(m)} controls preload="metadata" className="aspect-[16/10] w-full bg-black" />}
            {m.type === "youtube" && (
              <iframe className="aspect-[16/10] w-full" src={`https://www.youtube-nocookie.com/embed/${m.path}`} title={m.caption || "video"} allow="encrypted-media; picture-in-picture" allowFullScreen />
            )}
            {m.caption && <figcaption className="p-3 text-sm text-muted">{m.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(open)} alt={open.caption || ""} className="max-h-[85vh] max-w-full rounded-lg" />
          {open.caption && <p className="mt-3 text-center text-sm text-white">{open.caption}</p>}
        </div>
      )}
    </>
  );
}
