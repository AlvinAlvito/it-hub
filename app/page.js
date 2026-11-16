import Link from "next/link";
import { getWebs, getProjects, getActivity, repoNameMap } from "@/lib/data";
import { todayWIB, rangeFor, addDays, nice, HARI, parse } from "@/lib/dates";
import { Stat, Badge, STATUS_WEB, STATUS_PROJ, Progress, CAT } from "@/components/ui";
import Chart from "@/components/Chart";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = todayWIB();
  const [ws, we] = rangeFor("week", today);
  const [webs, projects, week] = await Promise.all([getWebs(), getProjects(), getActivity(ws, we)]);
  const map = repoNameMap(webs);
  const focus = projects.filter((p) => p.start_date <= today && p.end_date >= today && p.status !== "selesai");
  const dueTasks = projects.flatMap((p) => p.tasks.map((t) => ({ ...t, project: p.name, slug: p.slug }))).filter((t) => t.status !== "selesai" && t.start_date <= we && t.end_date >= ws).slice(0, 8);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const perDay = days.map((d) => week.commits.filter((c) => c.committed_at.startsWith(d)).length + week.acts.filter((a) => a.date === d).length);
  const latest = [...week.commits.slice(0, 6)];

  return (
    <>
      <section className="bg-navy text-white">
        <div className="wrap grid gap-8 py-12 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="text-[11px] font-bold tracking-[0.25em] text-gold">DIVISI IT POSI</div>
            <h1 className="mt-2 font-serif text-4xl text-white md:text-5xl">Semua pekerjaan IT, terekam di satu tempat</h1>
            <p className="mt-4 max-w-xl text-[#C9D3E0]">Katalog web POSI, rencana kerja enam bulan, jejak pekerjaan harian dari GitHub, dan AI Asisten yang menjawab pertanyaan pimpinan.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/aktivitas" className="btn-gold">Lihat pekerjaan minggu ini</Link>
              <Link href="/asisten" className="btn border border-white/30 text-white hover:bg-white/10">Tanya AI Asisten</Link>
            </div>
          </div>
          <div className="rounded-2xl bg-navy-2 p-5">
            <div className="text-xs font-bold tracking-[0.18em] text-gold">FOKUS SAAT INI</div>
            <div className="mt-3 space-y-3">
              {focus.length ? focus.slice(0, 4).map((p) => (
                <Link key={p.id} href={`/rencana/${p.slug}`} className="block rounded-xl bg-white/5 p-3 hover:bg-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-gold-light">{p.progress}%</span>
                  </div>
                  <div className="mt-2"><Progress value={p.progress} color="#B08D57" /></div>
                  <div className="mt-1 text-[11px] text-[#9FB0C6]">{nice(p.start_date)} – {nice(p.end_date)}</div>
                </Link>
              )) : <p className="text-sm text-[#C9D3E0]">Tidak ada proyek aktif hari ini.</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="wrap mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat value={webs.length} label="web dan sistem dikelola" />
        <Stat value={week.commits.length} label="perubahan kode minggu ini" tone="gold" />
        <Stat value={week.acts.length} label="koordinasi dan aktivitas minggu ini" tone="teal" />
        <Stat value={`${projects.filter((p) => p.status === "berjalan").length}/${projects.length}`} label="proyek sedang berjalan" tone="slate" />
      </div>

      <div className="wrap mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Pekerjaan minggu ini</h2>
            <Link href="/aktivitas" className="text-sm font-semibold text-gold-dark">Detail →</Link>
          </div>
          <p className="text-xs text-muted">{nice(ws)} – {nice(we)}</p>
          <div className="mt-4"><Chart labels={days.map((d) => HARI[parse(d).getUTCDay()].slice(0, 3))} values={perDay} height={200} /></div>
          <div className="mt-2 divide-y divide-hair">
            {latest.length ? latest.map((c) => (
              <div key={c.sha} className="flex gap-3 py-2 text-sm">
                <span className="w-24 shrink-0 text-xs text-muted">{c.committed_at.slice(5, 16)}</span>
                <span className="w-28 shrink-0 truncate text-xs font-semibold text-navy">{map[c.repo] || c.repo}</span>
                <span className="truncate">{c.message.split("\n")[0]}</span>
              </div>
            )) : <p className="py-3 text-sm text-muted">Belum ada perubahan kode tercatat minggu ini.</p>}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Tugas minggu ini</h2>
            <Link href="/rencana" className="text-sm font-semibold text-gold-dark">Rencana →</Link>
          </div>
          <div className="mt-3 space-y-3">
            {dueTasks.length ? dueTasks.map((t) => (
              <Link key={t.id} href={`/rencana/${t.slug}`} className="block rounded-lg border border-hair p-3 hover:bg-navy-soft">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{t.title}</span>
                  <Badge map={STATUS_PROJ} value={t.status === "belum" ? "rencana" : t.status} />
                </div>
                <div className="mt-1 text-xs text-muted">{t.project} · {nice(t.start_date)} – {nice(t.end_date)}</div>
              </Link>
            )) : <p className="text-sm text-muted">Tidak ada tugas terjadwal minggu ini.</p>}
          </div>
        </div>
      </div>

      <div className="wrap mt-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="kicker">Katalog</div>
            <h2 className="text-2xl">Web dan sistem POSI</h2>
          </div>
          <Link href="/web" className="text-sm font-semibold text-gold-dark">Semua web →</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {webs.slice(0, 6).map((w) => (
            <Link key={w.id} href={`/web/${w.slug}`} className="card p-5 hover:border-gold">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg text-navy">{w.name}</span>
                <Badge map={STATUS_WEB} value={w.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{w.summary}</p>
              <div className="mt-3 text-xs text-muted">Update terakhir: {w.last_update ? nice(w.last_update) : "-"}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="wrap mt-10">
        <div className="kicker">Kategori proyek</div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
          {Object.values(CAT).map(([l, c]) => <span key={l} className="flex items-center gap-2"><span className="h-3 w-6 rounded-full" style={{ background: c }} />{l}</span>)}
        </div>
      </div>
    </>
  );
}
