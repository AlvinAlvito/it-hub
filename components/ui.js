// Komponen tampilan kecil yang dipakai di banyak halaman
const G = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
const A = "bg-amber-500/10 text-amber-700 dark:text-amber-400";
const B = "bg-sky-500/10 text-sky-700 dark:text-sky-400";
const N = "bg-slate-500/10 text-slate-600 dark:text-slate-400";

export const STATUS_WEB = { aktif: ["Aktif", G], pengembangan: ["Pengembangan", A], rencana: ["Rencana", N], nonaktif: ["Nonaktif", N] };
export const STATUS_PROJ = { rencana: ["Rencana", N], berjalan: ["Berjalan", B], selesai: ["Selesai", G], tertunda: ["Tertunda", A] };
export const STATUS_TASK = { belum: ["Belum", N], berjalan: ["Berjalan", B], selesai: ["Selesai", G], tertunda: ["Tertunda", A] };
export const CAT = {
  internal: ["Sistem internal", "#3F6FAE"],
  posi: ["posi.id dan penjualan", "#B08D57"],
  produk: ["Produk dan bisnis baru", "#2F8A74"],
};

export function Badge({ map, value }) {
  const [label, cls] = map[value] || [value, N];
  return <span className={`chip ${cls}`}>{label}</span>;
}

export function PageHead({ kicker, title, children }) {
  return (
    <div className="wrap pb-6 pt-8 lg:pt-10">
      {kicker && <div className="kicker">{kicker}</div>}
      <h1 className="mt-1.5 text-3xl md:text-[34px]">{title}</h1>
      {children && <div className="mt-2 max-w-3xl text-[15px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function Stat({ value, label, tone = "navy" }) {
  const color = { navy: "text-heading", gold: "text-accent", teal: "text-teal", slate: "text-slatex" }[tone];
  const dot = { navy: "bg-brand", gold: "bg-gold", teal: "bg-teal", slate: "bg-slatex" }[tone];
  return (
    <div className="card relative overflow-hidden p-5">
      <span className={`absolute right-4 top-4 h-2 w-2 rounded-full ${dot}`} />
      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

export function Lines({ text }) {
  if (!text) return <p className="text-sm text-muted">Belum diisi.</p>;
  const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
  if (items.length === 1) return <p className="text-sm leading-relaxed">{items[0]}</p>;
  return (
    <ul className="space-y-2 text-sm leading-relaxed">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t}</li>
      ))}
    </ul>
  );
}

export function Progress({ value, color = "rgb(var(--brand))" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}
