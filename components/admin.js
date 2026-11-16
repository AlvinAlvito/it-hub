"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Formulir umum untuk tambah atau ubah data lewat /api/admin/[entity]
export function EntityForm({ entity, id, fields, initial = {}, fixed = {}, submitLabel = "Simpan", reset = false, onSaved }) {
  const router = useRouter();
  const blank = Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? f.default ?? ""]));
  const [v, setV] = useState(blank);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const r = await fetch(id ? `/api/admin/${entity}/${id}` : `/api/admin/${entity}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, ...fixed }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Gagal");
    setMsg("Tersimpan");
    if (reset) setV(Object.fromEntries(fields.map((f) => [f.name, f.default ?? ""])));
    onSaved ? onSaved(d) : router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.wide || f.type === "textarea" ? "md:col-span-2" : ""}>
          <label className="label">{f.label}{f.required && " *"}</label>
          {f.type === "textarea" ? (
            <textarea className="input min-h-[96px]" value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} placeholder={f.placeholder} />
          ) : f.type === "select" ? (
            <select className="input" value={v[f.name] ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })}>
              {f.options.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
            </select>
          ) : (
            <input className="input" type={f.type || "text"} value={v[f.name] ?? ""} required={f.required} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} placeholder={f.placeholder} autoComplete={f.type === "password" ? "new-password" : "off"} />
          )}
          {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
        </div>
      ))}
      <div className="flex items-center gap-3 md:col-span-2">
        <button disabled={busy} className="btn-primary">{busy ? "Menyimpan..." : submitLabel}</button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  );
}

export function DeleteButton({ entity, id, label = "Hapus", confirmText = "Hapus data ini?", redirect }) {
  const router = useRouter();
  async function del() {
    if (!confirm(confirmText)) return;
    const r = await fetch(`/api/admin/${entity}/${id}`, { method: "DELETE" });
    if (!r.ok) return alert("Gagal menghapus");
    redirect ? router.push(redirect) : router.refresh();
  }
  return <button type="button" onClick={del} className="btn-danger">{label}</button>;
}

export function QuickSelect({ entity, id, name, value, options }) {
  const router = useRouter();
  async function change(e) {
    await fetch(`/api/admin/${entity}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [name]: e.target.value }) });
    router.refresh();
  }
  return (
    <select defaultValue={value} onChange={change} className="input w-auto py-1 text-xs">
      {options.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
    </select>
  );
}

export function UploadForm({ webId }) {
  const router = useRouter();
  const [mode, setMode] = useState("file");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("web_id", webId);
    setBusy(true); setMsg(mode === "file" ? "Mengunggah..." : "");
    const r = await fetch("/api/admin/upload", { method: "POST", body: form });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Gagal mengunggah");
    setMsg("Tersimpan");
    e.target.reset();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
      <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="file">Unggah gambar/video</option>
        <option value="youtube">Link YouTube</option>
      </select>
      {mode === "file" ? <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" className="input" required /> : <input name="youtube" className="input" placeholder="https://youtu.be/..." required />}
      <input name="caption" className="input" placeholder="Keterangan (opsional)" />
      <button disabled={busy} className="btn-primary">Tambah</button>
      {msg && <p className="text-sm text-muted md:col-span-4">{msg}</p>}
    </form>
  );
}

export function SyncButton() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true); setMsg("Menyinkronkan GitHub...");
    const r = await fetch("/api/sync/github", { method: "POST" });
    const d = await r.json();
    setBusy(false);
    setMsg(r.ok ? `Selesai: ${d.added} commit baru dari ${d.scanned} repo aktif (${d.repos} repo${d.token ? "" : ", hanya repo publik karena token belum diatur"}).` : d.error);
    router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={run} disabled={busy} className="btn-gold">{busy ? "Berjalan..." : "Sinkronkan GitHub sekarang"}</button>
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </div>
  );
}
