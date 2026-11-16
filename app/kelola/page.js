import { q, getSetting } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { todayWIB } from "@/lib/dates";
import { ACT_CATEGORIES } from "@/lib/forms";
import { EntityForm, SyncButton } from "@/components/admin";
import CredentialForm from "@/components/CredentialForm";

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
      <div className="card p-6">
        <h2 className="text-xl">Sinkron GitHub</h2>
        <p className="mt-1 text-sm text-muted">
          {last ? `Terakhir ${last.at.replace("T", " ").slice(0, 16)} UTC: ${last.added} commit baru, ${last.repos} repo${last.token ? "" : " (tanpa token, hanya repo publik)"}.` : "Belum pernah disinkronkan."} Total {counts[0].commits} commit, {counts[0].accounts} akun, {counts[0].media} media tersimpan.
        </p>
        <div className="mt-3"><SyncButton /></div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl">Catat aktivitas cepat</h2>
        <p className="mb-3 text-sm text-muted">Untuk pekerjaan yang tidak ada di GitHub: koordinasi, rapat, strategi, support, standby.</p>
        <EntityForm entity="activities" reset submitLabel="Catat" fields={[
          { name: "date", label: "Tanggal", type: "date", required: true, default: todayWIB() },
          { name: "category", label: "Jenis", type: "select", options: ACT_CATEGORIES, default: "koordinasi" },
          { name: "title", label: "Apa yang dikerjakan", required: true, wide: true },
          { name: "duration_min", label: "Durasi (menit)", type: "number" },
          { name: "project_id", label: "Proyek terkait", type: "select", options: [["", "Tidak ada"], ...projects.map((p) => [String(p.id), p.name])] },
          { name: "detail", label: "Detail", type: "textarea" },
        ]} />
      </div>

      <div className="card p-6">
        <h2 className="text-xl">Pengguna</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {users.map((u) => (
            <div key={u.id}>
              <CredentialForm userId={u.id} self={u.id === me.id} label={`${u.name} · ${u.username} · ${u.role}${u.last_login ? ` · login terakhir ${u.last_login.slice(0, 16)}` : ""}`} />
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
