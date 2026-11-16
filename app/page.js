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
      <div className="wrap pt-6 lg:pt-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2A4A] via-[#163A64] to-[#1F4C80] text-white shadow-soft">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="relative grid gap-8 p-7 md:grid-cols-[1.35fr_1fr] md:items-center md:p-10">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-gold-light">DIVISI IT POSI</span>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] text-white md:text-5xl">Semua pekerjaan IT, terekam di satu tempat</h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">Katalog web POSI, rencana kerja enam bulan, jejak pekerjaan harian dari GitHub, dan AI Asisten yang menjawab pertanyaan pimpinan.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/aktivitas" className="btn-gold">Lihat pekerjaan minggu ini</Link>
                <Link href="/asisten" className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10">Tanya AI Asisten</Link>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <div className="text-[11px] font-bold tracking-[0.18em] text-gold-light">FOKUS SAAT INI</div>
              <div className="mt-3 space-y-2.5">
                {focus.length ? focus.slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/rencana/${p.slug}`} className="block rounded-xl bg-white/[0.06] p-3 transition hover:bg-white/[0.12]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{p.name}</span>
                      <span className="text-xs font-bold text-gold-light">{p.progress}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${p.progress}%` }} /></div>
                    <div className="mt-1.5 text-[11px] text-white/50">{nice(p.start_date)} – {nice(p.end_date)}</div>
                  </Link>
                )) : <p className="text-sm text-white/70">Tidak ada proyek aktif hari ini.</p>}
              </div>
            </div>
          </div>
        </section>
      </div>

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
            <Link href="/aktivitas" className="text-sm font-semibold text-accent">Detail →</Link>
          </div>
          <p className="text-xs text-muted">{nice(ws)} – {nice(we)}</p>
          <div className="mt-4"><Chart labels={days.map((d) => HARI[parse(d).getUTCDay()].slice(0, 3))} values={perDay} height={200} /></div>
          <div className="mt-2 divide-y divide-line">
            {latest.length ? latest.map((c) => (
              <div key={c.sha} className="flex gap-3 py-2 text-sm">
                <span className="w-24 shrink-0 text-xs text-muted">{c.committed_at.slice(5, 16)}</span>
                <span className="w-28 shrink-0 truncate text-xs font-semibold text-heading">{map[c.repo] || c.repo}</span>
                <span className="truncate">{c.message.split("\n")[0]}</span>
              </div>
            )) : <p className="py-3 text-sm text-muted">Belum ada perubahan kode tercatat minggu ini.</p>}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Tugas minggu ini</h2>
            <Link href="/rencana" className="text-sm font-semibold text-accent">Rencana →</Link>
          </div>
          <div className="mt-3 space-y-3">
            {dueTasks.length ? dueTasks.map((t) => (
              <Link key={t.id} href={`/rencana/${t.slug}`} className="block rounded-lg border border-line p-3 hover:bg-subtle">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-fg">{t.title}</span>
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
          <Link href="/web" className="text-sm font-semibold text-accent">Semua web →</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {webs.slice(0, 6).map((w) => (
            <Link key={w.id} href={`/web/${w.slug}`} className="card p-5 hover:border-gold">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-heading">{w.name}</span>
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
