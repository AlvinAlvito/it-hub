"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error || "Gagal masuk");
    router.push(d.role === "superadmin" ? "/kelola" : "/");
    router.refresh();
  }
  return (
    <div className="wrap grid min-h-[70vh] place-items-center py-10">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <div className="kicker">IT Hub POSI</div>
        <h1 className="mt-1 text-2xl">Masuk</h1>
        <p className="mt-1 text-sm text-muted">Khusus pimpinan dan superadmin.</p>
        <label className="label mt-6">Username</label>
        <input className="input" autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
        <label className="label mt-4">Password</label>
        <input className="input" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        {err && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{err}</p>}
        <button disabled={busy} className="btn-primary mt-6 w-full">{busy ? "Memeriksa..." : "Masuk"}</button>
      </form>
    </div>
  );
}
