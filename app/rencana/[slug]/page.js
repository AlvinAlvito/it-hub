import Link from "next/link";
import { notFound } from "next/navigation";
import { one, q } from "@/lib/db";
import { repoList } from "@/lib/data";
import { nice } from "@/lib/dates";
import { Badge, STATUS_PROJ, STATUS_TASK, Progress, CAT } from "@/components/ui";

export const dynamic = "force-dynamic";

const BOX = [
  ["masalah", "Masalah", "#9B3B3B"],
  ["solusi", "Solusi", "#3E5C7E"],
  ["tujuan", "Tujuan", "#8C6D31"],
  ["manfaat", "Manfaat", "#2F6B5E"],
];

export default async function ProjectDetail({ params }) {
  const p = await one("SELECT * FROM projects WHERE slug = ?", [params.slug]);
  if (!p) notFound();
  const tasks = await q("SELECT * FROM project_tasks WHERE project_id = ? ORDER BY start_date, sort, id", [p.id]);
  const repos = repoList(p.repos);
  const commits = repos.length ? await q(`SELECT * FROM commits WHERE repo IN (${repos.map(() => "?").join(",")}) AND committed_at >= ? ORDER BY committed_at DESC LIMIT 30`, [...repos, p.start_date + " 00:00:00"]) : [];
  const acts = await q("SELECT * FROM activities WHERE project_id = ? ORDER BY date DESC LIMIT 30", [p.id]);
  const color = (CAT[p.category] || CAT.internal)[1];
  return (
    <>
      <div className="wrap pt-8">
        <Link href="/rencana" className="text-sm font-semibold text-gold-dark">← Rencana kerja</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl md:text-4xl">{p.name}</h1>
          <Badge map={STATUS_PROJ} value={p.status} />
        </div>
        <div className="mt-2 text-sm text-muted">{nice(p.start_date)} – {nice(p.end_date)} · {(CAT[p.category] || CAT.internal)[0]}</div>
        <div className="mt-4 max-w-xl"><div className="mb-1 flex justify-between text-xs text-muted"><span>Progres</span><span>{p.progress}%</span></div><Progress value={p.progress} color={color} /></div>
      </div>
      <div className="wrap mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {BOX.map(([k, l, c]) => (
          <div key={k} className="card p-5">
            <div className="text-xs font-bold tracking-[0.15em]" style={{ color: c }}>{l.toUpperCase()}</div>
            <p className="mt-2 text-sm leading-relaxed">{p[k] || "-"}</p>
          </div>
        ))}
      </div>
      {p.output && (
        <div className="wrap mt-4"><div className="card bg-navy-soft p-5 text-sm"><span className="font-bold text-navy">Output: </span>{p.output}</div></div>
      )}
      <div className="wrap mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl">Tugas</h2>
          <div className="mt-3 divide-y divide-hair">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <div className={`text-sm font-semibold ${t.status === "selesai" ? "text-muted line-through" : "text-ink"}`}>{t.title}</div>
                  <div className="text-xs text-muted">{t.start_date ? nice(t.start_date) : "?"} – {t.end_date ? nice(t.end_date) : "?"}</div>
                </div>
                <Badge map={STATUS_TASK} value={t.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-xl">Jejak pekerjaan</h2>
          <p className="text-xs text-muted">Perubahan kode di repo {repos.join(", ") || "-"} dan aktivitas yang dicatat untuk proyek ini.</p>
          <div className="mt-3 divide-y divide-hair">
            {[...acts.map((a) => ({ d: a.date, t: a.title, k: a.category })), ...commits.map((c) => ({ d: c.committed_at.slice(0, 10), t: c.message.split("\n")[0], k: "kode" }))]
              .sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 30).map((x, i) => (
                <div key={i} className="flex gap-3 py-2 text-sm"><span className="w-20 shrink-0 text-xs text-muted">{nice(x.d)}</span><span className="w-20 shrink-0 text-xs font-semibold capitalize text-gold-dark">{x.k}</span><span>{x.t}</span></div>
              ))}
            {!acts.length && !commits.length && <p className="py-2 text-sm text-muted">Belum ada jejak pekerjaan.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
