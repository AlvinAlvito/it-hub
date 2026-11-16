"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";

// Dialog modal: tutup dengan Esc, klik latar, atau tombol ×
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`card my-6 w-full ${wide ? "max-w-3xl" : "max-w-xl"} p-0`}>
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="text-lg">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-subtle hover:text-heading" aria-label="Tutup"><Icon name="close" /></button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Formulir umum untuk tambah atau ubah data lewat /api/admin/[entity]
export function EntityForm({ entity, id, fields, initial = {}, fixed = {}, submitLabel = "Simpan", reset = false, onSaved, onCancel }) {
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
    router.refresh();
    onSaved && onSaved(d);
  }
  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
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
      <div className="flex items-center justify-end gap-3 border-t border-line pt-4 md:col-span-2">
        {msg && <span className="mr-auto text-sm text-muted">{msg}</span>}
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost">Batal</button>}
        <button disabled={busy} className="btn-primary">{busy ? "Menyimpan..." : submitLabel}</button>
      </div>
    </form>
  );
}

// Tombol yang membuka formulir tambah/ubah di dalam modal
export function FormModal({ label, title, icon = "plus", variant = "primary", wide, ...form }) {
  const [open, setOpen] = useState(false);
  const cls = { primary: "btn-primary", ghost: "btn-ghost", icon: "rounded-lg p-2 text-muted hover:bg-subtle hover:text-heading" }[variant];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cls} title={title}>
        {variant === "icon" ? <Icon name={icon} className="h-4 w-4" /> : <><Icon name={icon} className="h-4 w-4" />{label}</>}
      </button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)} wide={wide}>
          <EntityForm {...form} onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}

export function DeleteButton({ entity, id, label, confirmText = "Hapus data ini?", redirect }) {
  const router = useRouter();
  async function del() {
    if (!confirm(confirmText)) return;
    const r = await fetch(`/api/admin/${entity}/${id}`, { method: "DELETE" });
    if (!r.ok) return alert("Gagal menghapus");
    redirect ? router.push(redirect) : router.refresh();
  }
  if (!label) return <button type="button" onClick={del} title="Hapus" className="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-500"><Icon name="trash" className="h-4 w-4" /></button>;
  return <button type="button" onClick={del} className="btn-danger"><Icon name="trash" className="h-4 w-4" />{label}</button>;
}

export function QuickSelect({ entity, id, name, value, options }) {
  const router = useRouter();
  async function change(e) {
    await fetch(`/api/admin/${entity}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [name]: e.target.value }) });
    router.refresh();
  }
  return (
    <select defaultValue={value} onChange={change} onClick={(e) => e.stopPropagation()} className="input w-auto py-1 text-xs">
      {options.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
    </select>
  );
}

// Unggah satu file dengan progres
function upload(form, onProgress) {
  return new Promise((resolve) => {
    const x = new XMLHttpRequest();
    x.open("POST", "/api/admin/upload");
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch {} resolve({ ok: x.status < 300, d }); };
    x.onerror = () => resolve({ ok: false, d: { error: "Koneksi terputus" } });
    x.send(form);
  });
}

const SECTION_LABEL = { slider: "gambar slider", galeri: "gambar galeri", video: "video" };

// Tombol + modal untuk menambah media ke bagian tertentu (slider, galeri, video)
export function UploadModal({ webId, section, label }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("file");
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [yt, setYt] = useState("");
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState("");
  const video = section === "video";
  const accept = video ? "video/mp4,video/webm" : "image/png,image/jpeg,image/webp,image/gif";
  function close() { setOpen(false); setFiles([]); setCaption(""); setYt(""); setProgress(null); setMsg(""); }
  async function submit(e) {
    e.preventDefault();
    setMsg("");
    if (mode === "youtube") {
      const f = new FormData();
      f.set("web_id", webId); f.set("section", section); f.set("youtube", yt); f.set("caption", caption);
      const r = await upload(f, setProgress);
      if (!r.ok) return setMsg(r.d.error || "Gagal");
    } else {
      for (let i = 0; i < files.length; i++) {
        const f = new FormData();
        f.set("web_id", webId); f.set("section", section); f.set("file", files[i]); f.set("caption", files.length > 1 ? caption || "" : caption);
        setMsg(`Mengunggah ${i + 1} dari ${files.length}...`);
        const r = await upload(f, setProgress);
        if (!r.ok) return setMsg(`${files[i].name}: ${r.d.error || "gagal"}`);
      }
    }
    router.refresh();
    close();
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost"><Icon name="plus" className="h-4 w-4" />{label}</button>
      {open && (
        <Modal title={`Tambah ${SECTION_LABEL[section]}`} onClose={close}>
          <form onSubmit={submit} className="space-y-4">
            {video && (
              <div className="grid grid-cols-2 rounded-xl border border-line bg-subtle p-1 text-sm font-semibold">
                {[["file", "Unggah file"], ["youtube", "Link YouTube"]].map(([k, l]) => (
                  <button type="button" key={k} onClick={() => setMode(k)} className={`rounded-lg py-1.5 ${mode === k ? "bg-card text-heading shadow-soft" : "text-muted"}`}>{l}</button>
                ))}
              </div>
            )}
            {mode === "file" ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-subtle px-4 py-8 text-center hover:border-gold">
                <Icon name="upload" className="h-7 w-7 text-accent" />
                <span className="text-sm font-semibold text-heading">{files.length ? `${files.length} file dipilih` : `Pilih ${video ? "video (MP4/WEBM)" : "gambar (bisa lebih dari satu)"}`}</span>
                <span className="text-xs text-muted">{files.length ? files.map((f) => f.name).join(", ").slice(0, 120) : "Maksimal 250 MB per file"}</span>
                <input type="file" accept={accept} multiple={!video} className="hidden" onChange={(e) => setFiles([...e.target.files])} />
              </label>
            ) : (
              <div><label className="label">Link YouTube</label><input className="input" value={yt} onChange={(e) => setYt(e.target.value)} placeholder="https://youtu.be/..." required /></div>
            )}
            <div><label className="label">Keterangan (opsional)</label><input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={video ? "Contoh: Cara daftar kompetisi" : "Contoh: Halaman dashboard admin"} /></div>
            {progress !== null && <div className="h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>}
            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              {msg && <span className="mr-auto text-sm text-muted">{msg}</span>}
              <button type="button" onClick={close} className="btn-ghost">Batal</button>
              <button disabled={mode === "file" ? !files.length : !yt} className="btn-primary">Simpan</button>
            </div>
          </form>
        </Modal>
      )}
    </>
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
      <button onClick={run} disabled={busy} className="btn-gold"><Icon name="refresh" className="h-4 w-4" />{busy ? "Berjalan..." : "Sinkronkan GitHub"}</button>
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </div>
  );
}
