"use client";
import { useEffect, useRef, useState } from "react";
import Markdown from "./Markdown";

const SUGGEST = [
  "Minggu ini IT mengerjakan apa saja? Buatkan grafiknya.",
  "Proyek apa yang sedang berjalan dan berapa progresnya?",
  "Apa rencana IT bulan Desember?",
  "Web mana yang paling sering diperbarui sebulan terakhir?",
];

export default function Chat() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...msgs, { role: "user", content }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const d = await r.json();
      setMsgs([...next, { role: "assistant", content: r.ok ? d.answer : "⚠ " + (d.error || "Gagal") }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "⚠ Koneksi terputus. Coba lagi." }]);
    }
    setBusy(false);
  }

  return (
    <div className="card flex h-[70vh] min-h-[480px] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {!msgs.length && (
          <div className="grid gap-3 sm:grid-cols-2">
            {SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-xl border border-line bg-subtle p-4 text-left text-sm text-heading hover:border-gold">{s}</button>)}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
            <div className={m.role === "user" ? "max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-4 py-3 text-sm text-white" : "w-full max-w-[90%] rounded-2xl rounded-bl-sm border border-line bg-card px-4 py-3"}>
              {m.role === "user" ? m.content : <Markdown text={m.content} />}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-muted">AI sedang membaca data...</div>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Contoh: hari ini IT mengerjakan apa?" className="input" maxLength={1500} />
        <button disabled={busy || !input.trim()} className="btn-primary">Kirim</button>
      </form>
    </div>
  );
}
