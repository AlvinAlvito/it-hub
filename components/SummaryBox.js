"use client";
import { useEffect, useState } from "react";
import Markdown from "./Markdown";

// Ringkasan AI untuk periode yang sedang dilihat
export default function SummaryBox({ view, date }) {
  const [text, setText] = useState("");
  const [state, setState] = useState("idle");
  async function load(force) {
    setState("loading");
    const r = await fetch("/api/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ view, date, force }) });
    const d = await r.json();
    setText(r.ok ? d.content : d.error || "Gagal memuat ringkasan");
    setState(r.ok ? "done" : "error");
  }
  useEffect(() => { setText(""); setState("idle"); }, [view, date]);
  return (
    <div className="card border-gold/40 bg-accent-tint p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="kicker">Ringkasan AI</div>
          <div className="font-bold text-lg text-heading">Laporan singkat untuk pimpinan</div>
        </div>
        <button onClick={() => load(false)} disabled={state === "loading"} className="btn-gold">{state === "loading" ? "Menyusun..." : text ? "Muat ulang" : "Buat ringkasan"}</button>
      </div>
      {text && <div className="mt-4"><Markdown text={text} /></div>}
    </div>
  );
}
