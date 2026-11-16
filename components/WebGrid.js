"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, STATUS_WEB } from "./ui";

// Katalog web dalam satu grid, dengan pencarian dan filter kategori
export default function WebGrid({ webs }) {
  const [term, setTerm] = useState("");
  const [cat, setCat] = useState("");
  const cats = useMemo(() => [...new Set(webs.map((w) => w.category || "Lainnya"))].sort(), [webs]);
  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return webs.filter((w) => {
      if (cat && (w.category || "Lainnya") !== cat) return false;
      if (!t) return true;
      return [w.name, w.url, w.summary, w.category, w.tech].some((v) => (v || "").toLowerCase().includes(t));
    });
  }, [webs, term, cat]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Cari nama web, link, atau fungsinya..." className="input !pl-9" aria-label="Cari web" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input sm:w-56" aria-label="Filter kategori">
          <option value="">Semua kategori</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="mb-3 text-sm text-muted">{list.length} dari {webs.length} web</div>

      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((w) => (
            <Link key={w.id} href={`/web/${w.slug}`} className="card overflow-hidden hover:border-gold">
              <div className="relative aspect-[16/9] bg-subtle">
                {w.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/${w.thumb}`} alt={w.name} className="h-full w-full object-cover object-top" loading="lazy" />
                ) : (
                  <div className="grid h-full place-items-center px-4 text-center text-3xl font-bold text-heading/30">{w.name}</div>
                )}
                <span className="absolute right-3 top-3"><Badge map={STATUS_WEB} value={w.status} /></span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-lg font-bold text-heading">{w.name}</div>
                  {w.category && <span className="chip mt-1 shrink-0 bg-subtle text-muted">{w.category}</span>}
                </div>
                <div className="text-xs text-accent">{w.url?.replace(/^https?:\/\//, "")}</div>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{w.summary}</p>
                <div className="mt-3 flex justify-between text-xs text-muted">
                  <span>Update: {w.update_label}</span>
                  <span>{w.commit_count} perubahan kode</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-muted">Tidak ada web yang cocok dengan pencarian ini.</div>
      )}
    </>
  );
}
