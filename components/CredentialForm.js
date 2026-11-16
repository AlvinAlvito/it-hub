"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./admin";
import Icon from "./Icon";

export function CredentialModal({ userId, self, name }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost"><Icon name="lock" className="h-4 w-4" />Password / PIN</button>
      {open && <Modal title={`Ganti password atau PIN: ${name}`} onClose={() => setOpen(false)}><CredentialForm userId={userId} self={self} bare /></Modal>}
    </>
  );
}

export default function CredentialForm({ userId, self, label, bare }) {
  const router = useRouter();
  const [f, setF] = useState({ current_password: "", password: "", pin: "" });
  const [msg, setMsg] = useState("");
  async function submit(e) {
    e.preventDefault();
    const body = { ...f };
    if (!body.password) delete body.password;
    if (!body.pin) delete body.pin;
    const r = await fetch(`/api/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    setMsg(r.ok ? "Tersimpan." : d.error || "Gagal");
    if (r.ok) setF({ current_password: "", password: "", pin: "" });
    if (d.relogin) router.push("/login");
  }
  return (
    <form onSubmit={submit} className={bare ? "space-y-3" : "card space-y-3 p-6"}>
      {label && <div className="font-semibold text-heading">{label}</div>}
      {self && (<><label className="label">Password saat ini</label><input type="password" className="input" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} required /></>)}
      <label className="label">Password baru (minimal 10 karakter, kosongkan bila tidak diganti)</label>
      <input type="password" className="input" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <label className="label">PIN baru (6 angka, kosongkan bila tidak diganti)</label>
      <input type="password" inputMode="numeric" maxLength={6} className="input" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "") })} />
      <div className="flex items-center gap-3"><button className="btn-primary">Simpan</button>{msg && <span className="text-sm text-muted">{msg}</span>}</div>
    </form>
  );
}
