"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, STATUS_PROJ, STATUS_TASK, CAT, Progress } from "./ui";
import { parse, fmt, nice, BULAN, BLN, daysBetween, addDays } from "@/lib/dates";

const TABS = [["timeline", "Timeline"], ["kalender", "Kalender"], ["daftar", "Daftar proyek"]];

export default function PlanViews({ projects, today, initial }) {
  const [tab, setTab] = useState(TABS.some((t) => t[0] === initial) ? initial : "timeline");
  return (
    <>
      <div className="mb-5 inline-flex rounded-xl border border-hair bg-white p-1">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === k ? "bg-navy text-white" : "text-muted hover:text-navy"}`}>{l}</button>
        ))}
      </div>
      {tab === "timeline" && <Timeline projects={projects} today={today} />}
      {tab === "kalender" && <Calendar projects={projects} today={today} />}
      {tab === "daftar" && <List projects={projects} />}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
        {Object.values(CAT).map(([l, c]) => <span key={l} className="flex items-center gap-2"><span className="h-3 w-6 rounded-full" style={{ background: c }} />{l}</span>)}
      </div>
    </>
  );
}

function Timeline({ projects, today }) {
  const start = projects.reduce((m, p) => (p.start_date < m ? p.start_date : m), projects[0]?.start_date || today).slice(0, 7) + "-01";
  const endP = projects.reduce((m, p) => (p.end_date > m ? p.end_date : m), today);
  const months = [];
  let d = parse(start);
  while (fmt(d) <= endP) { months.push(fmt(d)); d.setUTCMonth(d.getUTCMonth() + 1); }
  const last = parse(months[months.length - 1]); last.setUTCMonth(last.getUTCMonth() + 1); last.setUTCDate(0);
  const span = daysBetween(start, fmt(last)) + 1;
  const pos = (ymd) => (Math.max(0, Math.min(span, daysBetween(start, ymd))) / span) * 100;
  const todayPos = pos(today);
  return (
    <div className="card overflow-x-auto p-4">
      <div className="min-w-[860px]">
        <div className="grid grid-cols-[260px_1fr] border-b border-hair pb-2 text-xs font-semibold text-muted">
          <div>Proyek</div>
          <div className="relative flex">{months.map((m) => <div key={m} className="flex-1 text-center">{BLN[parse(m).getUTCMonth()]} {m.slice(2, 4)}</div>)}</div>
        </div>
        {projects.map((p) => {
          const color = (CAT[p.category] || CAT.internal)[1];
          const l = pos(p.start_date), r = pos(addDays(p.end_date, 1));
          return (
            <div key={p.id} className="grid grid-cols-[260px_1fr] items-center border-b border-hair/60 py-2">
              <Link href={`/rencana/${p.slug}`} className="pr-3 text-sm font-semibold text-ink hover:text-navy">{p.name}</Link>
              <div className="relative h-8">
                {months.map((m, i) => <div key={m} className="absolute top-0 h-full border-l border-hair/70" style={{ left: `${(i / months.length) * 100}%` }} />)}
                <Link href={`/rencana/${p.slug}`} title={`${nice(p.start_date)} – ${nice(p.end_date)}`} className="absolute top-1 flex h-6 items-center overflow-hidden rounded-full px-2 text-[11px] font-semibold text-white" style={{ left: `${l}%`, width: `${Math.max(2, r - l)}%`, background: color }}>
                  <span className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${p.progress}%` }} />
                  <span className="relative truncate">{p.progress}%</span>
                </Link>
                <div className="absolute top-0 h-full w-0.5 bg-red-500/70" style={{ left: `${todayPos}%` }} />
              </div>
            </div>
          );
        })}
        <div className="mt-2 text-right text-xs text-muted"><span className="mr-1 inline-block h-3 w-0.5 bg-red-500/70 align-middle" /> hari ini</div>
      </div>
    </div>
  );
}

function Calendar({ projects, today }) {
  const [month, setMonth] = useState(today.slice(0, 7) + "-01");
  const tasks = useMemo(() => projects.flatMap((p) => p.tasks.map((t) => ({ ...t, project: p }))), [projects]);
  const first = parse(month);
  const lead = (first.getUTCDay() + 6) % 7;
  const gridStart = addDays(month, -lead);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const shift = (n) => { const d = parse(month); d.setUTCMonth(d.getUTCMonth() + n); setMonth(fmt(d)); };
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="btn-ghost">←</button>
        <div className="font-serif text-xl text-navy">{BULAN[first.getUTCMonth()]} {first.getUTCFullYear()}</div>
        <button onClick={() => shift(1)} className="btn-ghost">→</button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-hair bg-hair text-xs">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((h) => <div key={h} className="bg-navy-soft py-2 text-center font-semibold text-navy">{h}</div>)}
        {cells.map((c) => {
          const inMonth = c.slice(0, 7) === month.slice(0, 7);
          const dayTasks = tasks.filter((t) => t.start_date && t.end_date && t.start_date <= c && t.end_date >= c);
          return (
            <div key={c} className={`min-h-[96px] bg-white p-1.5 ${inMonth ? "" : "opacity-40"}`}>
              <div className={`mb-1 text-right text-[11px] font-semibold ${c === today ? "text-white" : "text-muted"}`}>
                <span className={c === today ? "rounded-full bg-gold px-1.5 py-0.5" : ""}>{parse(c).getUTCDate()}</span>
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <Link key={t.id} href={`/rencana/${t.project.slug}`} title={`${t.project.name}: ${t.title}`} className="block truncate rounded px-1 py-0.5 text-[10px] font-semibold text-white" style={{ background: (CAT[t.project.category] || CAT.internal)[1], opacity: t.status === "selesai" ? 0.5 : 1 }}>{t.title}</Link>
                ))}
                {dayTasks.length > 3 && <div className="text-[10px] text-muted">+{dayTasks.length - 3} lagi</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function List({ projects }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((p) => {
        const done = p.tasks.filter((t) => t.status === "selesai").length;
        return (
          <Link key={p.id} href={`/rencana/${p.slug}`} className="card p-5 hover:border-gold">
            <div className="flex items-start justify-between gap-3">
              <div className="font-serif text-lg text-navy">{p.name}</div>
              <Badge map={STATUS_PROJ} value={p.status} />
            </div>
            <div className="mt-1 text-xs text-muted">{nice(p.start_date)} – {nice(p.end_date)} · {done}/{p.tasks.length} tugas selesai</div>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{p.tujuan}</p>
            <div className="mt-3"><Progress value={p.progress} color={(CAT[p.category] || CAT.internal)[1]} /></div>
            <div className="mt-3 flex flex-wrap gap-1">
              {p.tasks.slice(0, 4).map((t) => <Badge key={t.id} map={STATUS_TASK} value={t.status} />)}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
