import Link from "next/link";
import { q } from "@/lib/db";
import { WEB_FIELDS } from "@/lib/forms";
import { EntityForm } from "@/components/admin";
import { Badge, STATUS_WEB } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function KelolaWeb() {
  const webs = await q("SELECT w.*, (SELECT COUNT(*) FROM web_accounts a WHERE a.web_id = w.id) AS n_acc, (SELECT COUNT(*) FROM web_media m WHERE m.web_id = w.id) AS n_media FROM webs w ORDER BY sort, name");
  return (
    <div className="space-y-6">
      <div className="card divide-y divide-line">
        {webs.map((w) => (
          <Link key={w.id} href={`/kelola/web/${w.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-subtle">
            <span className="font-semibold text-heading">{w.name}</span>
            <Badge map={STATUS_WEB} value={w.status} />
            <span className="text-xs text-muted">{w.url}</span>
            <span className="ml-auto text-xs text-muted">{w.n_acc} akun · {w.n_media} media · repo {w.repo || "-"}</span>
          </Link>
        ))}
      </div>
      <div className="card p-6">
        <h2 className="mb-4 text-xl">Tambah web baru</h2>
        <EntityForm entity="webs" fields={WEB_FIELDS} reset submitLabel="Tambah web" />
      </div>
    </div>
  );
}
