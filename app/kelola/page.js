import { q, getSetting } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { todayWIB } from "@/lib/dates";
import { activityFields } from "@/lib/forms";
import { FormModal, SyncButton } from "@/components/admin";
import { CredentialModal } from "@/components/CredentialForm";
import { Stat } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function KelolaHome() {
  const me = await getSession();
  const [result, users, logs, projects, counts] = await Promise.all([
    getSetting("github_last_result"),
    q("SELECT id, username, name, role, last_login FROM users ORDER BY id"),
    q("SELECT l.*, u.username FROM audit_log l LEFT JOIN users u ON u.id = l.user_id ORDER BY l.id DESC LIMIT 25"),
    q("SELECT id, name FROM projects ORDER BY start_date"),
    q("SELECT (SELECT COUNT(*) FROM commits) AS commits, (SELECT COUNT(*) FROM web_accounts) AS accounts, (SELECT COUNT(*) FROM web_media) AS media"),
  ]);
  const last = result ? JSON.parse(result) : null;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat value={counts[0].commits} label="commit GitHub tersimpan" />
        <Stat value={counts[0].media} label="gambar dan video" tone="gold" />
        <Stat value={counts[0].accounts} label="akun web tercatat" tone="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg">Sinkron GitHub</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            {last ? `Terakhir ${last.at.replace("T", " ").slice(0, 16)} UTC: ${last.added} commit baru dari ${last.repos} repo${last.token ? "" : " (tanpa token, hanya repo publik)"}.` : "Belum pernah disinkronkan."} Otomatis setiap 30 menit.
          </p>
          <SyncButton />
        </div>
        <div className="card p-6">
          <h2 className="text-lg">Catat aktivitas cepat</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Pekerjaan di luar GitHub: koordinasi, rapat, strategi, support, standby.</p>
          <FormModal label="Catat aktivitas" title="Catat aktivitas" entity="activities" fields={activityFields(projects, todayWIB())} />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg">Pengguna</h2>
        <div className="mt-4 divide-y divide-line">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-xs font-bold text-white">{u.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-heading">{u.name} <span className="ml-1 text-xs font-normal text-muted">@{u.username}</span></div>
                <div className="text-xs capitalize text-muted">{u.role}{u.last_login ? ` · login terakhir ${u.last_login.slice(0, 16)}` : " · belum pernah login"}</div>
              </div>
              <CredentialModal userId={u.id} self={u.id === me.id} name={u.name} />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl">Log keamanan</h2>
        <p className="text-sm text-muted">Login, PIN, dan setiap kali password akun dilihat.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-line">
                  <td className="py-2 pr-4 text-xs text-muted">{l.created_at}</td>
                  <td className="py-2 pr-4 font-semibold">{l.username || "-"}</td>
                  <td className="py-2 pr-4">{l.action.replace(/_/g, " ")}</td>
                  <td className="py-2 pr-4 text-muted">{l.target || ""}</td>
                  <td className="py-2 text-xs text-muted">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
