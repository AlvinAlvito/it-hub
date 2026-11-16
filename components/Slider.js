"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";

// Carousel gambar di atas halaman web; berganti otomatis tiap 5 detik
export default function Slider({ images }) {
  const [i, setI] = useState(0);
  const [pause, setPause] = useState(false);
  const n = images.length;
  useEffect(() => {
    if (n < 2 || pause) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n, pause]);
  if (!n) return null;
  const go = (d) => setI((x) => (x + d + n) % n);
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-line bg-subtle shadow-soft" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
      <div className="relative aspect-[16/7] w-full">
        {images.map((m, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={m.id} src={`/api/media/${m.path}`} alt={m.caption || "slide"} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${k === i ? "opacity-100" : "opacity-0"}`} />
        ))}
        {images[i].caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 pb-5 pt-16">
            <p className="text-sm font-semibold text-white md:text-base">{images[i].caption}</p>
          </div>
        )}
      </div>
      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Sebelumnya" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 transition hover:bg-black/60 group-hover:opacity-100"><Icon name="chevronLeft" /></button>
          <button onClick={() => go(1)} aria-label="Berikutnya" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white opacity-0 transition hover:bg-black/60 group-hover:opacity-100"><Icon name="chevronRight" /></button>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {images.map((m, k) => <button key={m.id} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-gold" : "w-1.5 bg-white/60"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}
