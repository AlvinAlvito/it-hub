"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "./Markdown";
import Icon from "./Icon";

const SUGGEST = [
  "Minggu ini IT mengerjakan apa saja? Buatkan grafiknya.",
  "Proyek apa yang sedang berjalan dan berapa progresnya?",
  "Apa rencana IT bulan Desember?",
  "Web mana yang paling sering diperbarui sebulan terakhir?",
];
const SUGGEST_ADMIN = [
  "Tugas saya minggu ini apa saja? Rinci per proyek.",
  "Proyek apa yang sedang berjalan dan berapa progresnya?",
  "Catat aktivitas hari ini: rapat koordinasi dengan direktur 60 menit.",
  "Web mana yang paling sering diperbarui sebulan terakhir?",
];

function Pending({ items }) {
  const router = useRouter();
  const [state, setState] = useState({});
  async function act(p, ok) {
    const k = p.entity + p.id;
    if (!ok) return setState({ ...state, [k]: "batal" });
    setState({ ...state, [k]: "..." });
    const r = await fetch(`/api/admin/${p.entity}/${p.id}`, { method: "DELETE" });
    setState((s) => ({ ...s, [k]: r.ok ? "terhapus" : "gagal" }));
    if (r.ok) router.refresh();
  }
  return (
    <div className="mt-3 space-y-2">
      {items.map((p) => {
        const st = state[p.entity + p.id];
        return (
          <div key={p.entity + p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm">
            <Icon name="trash" className="h-4 w-4 text-red-500" />
            <span className="min-w-0 flex-1 text-heading">{p.label}</span>
            {st ? <span className="text-xs font-semibold text-muted">{st === "terhapus" ? "✓ Terhapus" : st === "batal" ? "Dibatalkan" : st === "gagal" ? "Gagal menghapus" : "Menghapus..."}</span> : (
              <>
                <button onClick={() => act(p, false)} className="btn-ghost !px-3 !py-1 text-xs">Batal</button>
                <button onClick={() => act(p, true)} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700">Ya, hapus</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Changes({ items, failed }) {
  if (!items?.length && !failed?.length) return null;
  return (
    <div className="mt-3 space-y-1 rounded-xl border border-line bg-subtle px-3 py-2 text-xs">
      <div className="font-semibold uppercase tracking-wider text-muted">Perubahan data</div>
      {items?.map((c, i) => <div key={i} className="text-teal">✓ {c.label}</div>)}
      {failed?.map((e, i) => <div key={"f" + i} className="text-red-500">✗ {e}</div>)}
    </div>
  );
}

export default function Chat({ admin }) {
  const router = useRouter();
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
      const r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.map(({ role, content, changes }) => ({ role, content: changes?.length ? content + "\n[Perubahan tersimpan: " + changes.map((c) => c.label).join("; ") + "]" : content })) }) });
      const d = await r.json();
      setMsgs([...next, r.ok ? { role: "assistant", content: d.answer, changes: d.changes, pending: d.pending, failed: d.failed } : { role: "assistant", content: "⚠ " + (d.error || "Gagal") }]);
      if (d.changes?.length) router.refresh();
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
            {(admin ? SUGGEST_ADMIN : SUGGEST).map((s) => <button key={s} onClick={() => send(s)} className="rounded-xl border border-line bg-subtle p-4 text-left text-sm text-heading hover:border-gold">{s}</button>)}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
            <div className={m.role === "user" ? "max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-4 py-3 text-sm text-white" : "w-full max-w-[90%] rounded-2xl rounded-bl-sm border border-line bg-card px-4 py-3"}>
              {m.role === "user" ? m.content : (
                <>
                  <Markdown text={m.content} />
                  <Changes items={m.changes} failed={m.failed} />
                  {m.pending?.length > 0 && <Pending items={m.pending} />}
                </>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-muted">AI sedang membaca data...</div>}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-line p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={admin ? "Contoh: tugas X geser ke minggu depan, tandai selesai..." : "Contoh: hari ini IT mengerjakan apa?"} className="input" maxLength={1500} />
        <button disabled={busy || !input.trim()} className="btn-primary">Kirim</button>
      </form>
    </div>
  );
}
