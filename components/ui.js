// Komponen tampilan kecil yang dipakai di banyak halaman
export const STATUS_WEB = {
  aktif: ["Aktif", "bg-emerald-50 text-emerald-700"],
  pengembangan: ["Pengembangan", "bg-amber-50 text-amber-700"],
  rencana: ["Rencana", "bg-slate-100 text-slate-600"],
  nonaktif: ["Nonaktif", "bg-slate-100 text-slate-500"],
};
export const STATUS_PROJ = {
  rencana: ["Rencana", "bg-slate-100 text-slate-600"],
  berjalan: ["Berjalan", "bg-blue-50 text-blue-700"],
  selesai: ["Selesai", "bg-emerald-50 text-emerald-700"],
  tertunda: ["Tertunda", "bg-amber-50 text-amber-700"],
};
export const STATUS_TASK = {
  belum: ["Belum", "bg-slate-100 text-slate-600"],
  berjalan: ["Berjalan", "bg-blue-50 text-blue-700"],
  selesai: ["Selesai", "bg-emerald-50 text-emerald-700"],
  tertunda: ["Tertunda", "bg-amber-50 text-amber-700"],
};
export const CAT = {
  internal: ["Sistem internal", "#0F2A4A"],
  posi: ["posi.id dan penjualan", "#8C6D31"],
  produk: ["Produk dan bisnis baru", "#2F6B5E"],
};

export function Badge({ map, value }) {
  const [label, cls] = map[value] || [value, "bg-slate-100 text-slate-600"];
  return <span className={`chip ${cls}`}>{label}</span>;
}

export function PageHead({ kicker, title, children }) {
  return (
    <div className="wrap pb-6 pt-10">
      {kicker && <div className="kicker">{kicker}</div>}
      <h1 className="mt-1 text-3xl md:text-4xl">{title}</h1>
      {children && <div className="mt-2 max-w-3xl text-muted">{children}</div>}
    </div>
  );
}

export function Stat({ value, label, tone = "navy" }) {
  const color = { navy: "text-navy", gold: "text-gold-dark", teal: "text-teal", slate: "text-slatex" }[tone];
  return (
    <div className="card p-5">
      <div className={`font-serif text-3xl ${color}`}>{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

export function Lines({ text }) {
  if (!text) return <p className="text-sm text-muted">Belum diisi.</p>;
  const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
  if (items.length === 1) return <p className="text-sm leading-relaxed">{items[0]}</p>;
  return (
    <ul className="space-y-1.5 text-sm leading-relaxed">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t}</li>
      ))}
    </ul>
  );
}

export function Progress({ value, color = "#0F2A4A" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-hair">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}
