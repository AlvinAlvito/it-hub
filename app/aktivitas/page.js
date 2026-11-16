import Link from "next/link";
import { getActivity, getWebs, repoNameMap } from "@/lib/data";
import { todayWIB, rangeFor, shiftFor, labelRange, addDays, daysBetween, niceLong, parse, HARI } from "@/lib/dates";
import { getSetting } from "@/lib/db";
import { Stat } from "@/components/ui";
import Chart from "@/components/Chart";
import SummaryBox from "@/components/SummaryBox";

export const dynamic = "force-dynamic";

const VIEWS = [["day", "Harian"], ["week", "Mingguan"], ["month", "Bulanan"]];

export default async function Aktivitas({ searchParams }) {
  const view = VIEWS.some((v) => v[0] === searchParams.view) ? searchParams.view : "week";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date || "") ? searchParams.date : todayWIB();
  const [a, b] = rangeFor(view, date);
  const [{ commits, acts }, webs, lastSync] = await Promise.all([getActivity(a, b), getWebs(), getSetting("github_last_sync")]);
  const map = repoNameMap(webs);
  const days = Array.from({ length: daysBetween(a, b) + 1 }, (_, i) => addDays(a, i));
  const perDay = days.map((d) => commits.filter((c) => c.committed_at.startsWith(d)).length + acts.filter((x) => x.date === d).length);
  const byRepo = {};
  for (const c of commits) { const k = map[c.repo] || c.repo; byRepo[k] = (byRepo[k] || 0) + 1; }
  const repoEntries = Object.entries(byRepo).sort((x, y) => y[1] - x[1]);
  const minutes = acts.reduce((s, x) => s + (x.duration_min || 0), 0);
  const link = (v, d) => `/aktivitas?view=${v}&date=${d}`;
  const groups = days.slice().reverse().map((d) => ({ d, cs: commits.filter((c) => c.committed_at.startsWith(d)), as: acts.filter((x) => x.date === d) })).filter((g) => g.cs.length || g.as.length);

  return (
    <>
      <div className="wrap pb-4 pt-10">
        <div className="kicker">Jejak pekerjaan</div>
        <h1 className="mt-1 text-3xl md:text-4xl">Apa yang dikerjakan IT</h1>
        <p className="mt-2 max-w-3xl text-muted">Perubahan kode diambil otomatis dari GitHub; koordinasi, rapat, dan strategi dicatat manual. Sinkron terakhir: {lastSync ? lastSync.replace("T", " ").slice(0, 16) + " UTC" : "belum pernah"}.</p>
      </div>
      <div className="wrap flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-hair bg-white p-1">
          {VIEWS.map(([v, l]) => <Link key={v} href={link(v, date)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === v ? "bg-navy text-white" : "text-muted hover:text-navy"}`}>{l}</Link>)}
        </div>
        <div className="flex items-center gap-2">
          <Link href={link(view, shiftFor(view, date, -1))} className="btn-ghost">←</Link>
          <div className="min-w-[200px] text-center font-serif text-lg text-navy">{labelRange(view, a, b)}</div>
          <Link href={link(view, shiftFor(view, date, 1))} className="btn-ghost">→</Link>
          <Link href={link(view, todayWIB())} className="text-sm font-semibold text-gold-dark">Hari ini</Link>
        </div>
      </div>

      <div className="wrap mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat value={commits.length} label="perubahan kode" />
        <Stat value={repoEntries.length} label="web atau repo yang dikerjakan" tone="gold" />
        <Stat value={acts.length} label="koordinasi dan aktivitas" tone="teal" />
        <Stat value={minutes ? `${Math.round(minutes / 6) / 10} jam` : "-"} label="waktu aktivitas tercatat" tone="slate" />
      </div>

      <div className="wrap mt-6"><SummaryBox view={view} date={date} /></div>

      {view !== "day" && (
        <div className="wrap mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5"><Chart title="Jumlah pekerjaan per hari" labels={days.map((d) => (view === "week" ? HARI[parse(d).getUTCDay()].slice(0, 3) : String(parse(d).getUTCDate())))} values={perDay} /></div>
          <div className="card p-5">{repoEntries.length ? <Chart title="Perubahan kode per web" labels={repoEntries.slice(0, 8).map((e) => e[0])} values={repoEntries.slice(0, 8).map((e) => e[1])} /> : <p className="text-sm text-muted">Belum ada perubahan kode pada periode ini.</p>}</div>
        </div>
      )}

      <div className="wrap mt-6 space-y-4">
        {groups.length ? groups.map((g) => (
          <div key={g.d} className="card p-5">
            <div className="font-serif text-lg text-navy">{niceLong(g.d)}</div>
            <div className="mt-2 divide-y divide-hair">
              {g.as.map((x) => (
                <div key={"a" + x.id} className="flex flex-wrap gap-x-3 py-2 text-sm">
                  <span className="chip bg-teal/10 capitalize text-teal">{x.category}</span>
                  <span className="font-semibold">{x.title}</span>
                  {x.duration_min ? <span className="text-xs text-muted">{x.duration_min} menit</span> : null}
                  {x.project_name && <span className="text-xs text-gold-dark">{x.project_name}</span>}
                  {x.detail && <p className="w-full text-muted">{x.detail}</p>}
                </div>
              ))}
              {g.cs.map((c) => (
                <div key={c.sha} className="flex gap-3 py-2 text-sm">
                  <span className="w-12 shrink-0 text-xs text-muted">{c.committed_at.slice(11, 16)}</span>
                  <span className="w-32 shrink-0 truncate text-xs font-semibold text-navy">{map[c.repo] || c.repo}</span>
                  <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">{c.message.split("\n")[0]}</a>
                </div>
              ))}
            </div>
          </div>
        )) : <div className="card p-6 text-sm text-muted">Belum ada pekerjaan tercatat pada periode ini.</div>}
      </div>
    </>
  );
}
