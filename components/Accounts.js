"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Daftar akun. Password hanya diambil dari server setelah PIN benar, dan disembunyikan lagi otomatis.
export default function Accounts({ accounts, vault }) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(vault);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [shown, setShown] = useState({});
  const [busy, setBusy] = useState(false);

  async function unlock(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/vault", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
    const d = await r.json();
    setBusy(false); setPin("");
    if (!r.ok) return setErr(d.error || "Gagal");
    setUnlocked(true);
    setTimeout(() => { setUnlocked(false); setShown({}); }, d.minutes * 60 * 1000);
  }
  async function lock() {
    await fetch("/api/vault", { method: "DELETE" });
    setUnlocked(false); setShown({});
    router.refresh();
  }
  async function reveal(id) {
    if (shown[id] !== undefined) return setShown((s) => { const n = { ...s }; delete n[id]; return n; });
    const r = await fetch(`/api/accounts/${id}/reveal`, { method: "POST" });
    const d = await r.json();
    if (!r.ok) { setErr(d.error); if (r.status === 401) setUnlocked(false); return; }
    setShown((s) => ({ ...s, [id]: d.password }));
    setTimeout(() => setShown((s) => { const n = { ...s }; delete n[id]; return n; }), 30000);
  }
  const copy = (t) => navigator.clipboard?.writeText(t);

  if (!accounts.length) return <p className="mt-2 text-sm text-muted">Belum ada akun yang dicatat untuk web ini.</p>;
  return (
    <div className="mt-4">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-subtle p-3 text-sm">
        {unlocked ? (
          <>
            <span className="font-semibold text-teal">Brankas terbuka 10 menit. Password tampil 30 detik per klik.</span>
            <button onClick={lock} className="btn-ghost ml-auto">Kunci sekarang</button>
          </>
        ) : (
          <form onSubmit={unlock} className="flex flex-wrap items-center gap-2">
            <span className="text-muted">Masukkan PIN untuk melihat password:</span>
            <input type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="input w-28" placeholder="PIN" />
            <button disabled={busy || pin.length !== 6} className="btn-primary">Buka</button>
          </form>
        )}
        {err && <span className="text-red-600 dark:text-red-400">{err}</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="py-2 pr-4">Peran</th><th className="py-2 pr-4">Username</th><th className="py-2 pr-4">Password</th><th className="py-2 pr-4">Fungsi</th><th className="py-2">Pemegang</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-line align-top">
                <td className="py-3 pr-4 font-semibold text-heading">{a.role_name}{a.login_url && <a href={a.login_url} target="_blank" rel="noreferrer" className="block text-xs font-normal text-accent">halaman login ↗</a>}</td>
                <td className="py-3 pr-4">{a.username ? <button onClick={() => copy(a.username)} title="Salin" className="font-mono hover:underline">{a.username}</button> : "-"}</td>
                <td className="py-3 pr-4">
                  {!a.has_password ? "-" : unlocked ? (
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{shown[a.id] !== undefined ? shown[a.id] : "••••••••"}</span>
                      <button onClick={() => reveal(a.id)} className="text-xs font-semibold text-accent">{shown[a.id] !== undefined ? "Sembunyikan" : "Lihat"}</button>
                      {shown[a.id] !== undefined && <button onClick={() => copy(shown[a.id])} className="text-xs text-muted">Salin</button>}
                    </span>
                  ) : <span className="font-mono text-muted">•••••••• (terkunci)</span>}
                </td>
                <td className="py-3 pr-4 text-muted">{a.fungsi || "-"}{a.note && <div className="mt-1 text-xs">{a.note}</div>}</td>
                <td className="py-3">{a.holder || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
