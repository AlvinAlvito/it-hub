import Link from "next/link";
import { notFound } from "next/navigation";
import { one, q } from "@/lib/db";
import { todayWIB, nice } from "@/lib/dates";
import { WEB_FIELDS, ACCOUNT_FIELDS, UPDATE_FIELDS } from "@/lib/forms";
import { EntityForm, DeleteButton, UploadForm } from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function KelolaWebDetail({ params }) {
  const id = Number(params.id);
  const web = await one("SELECT * FROM webs WHERE id = ?", [id]);
  if (!web) notFound();
  const [media, updates, accounts] = await Promise.all([
    q("SELECT * FROM web_media WHERE web_id = ? ORDER BY sort, id", [id]),
    q("SELECT * FROM web_updates WHERE web_id = ? ORDER BY date DESC", [id]),
    q("SELECT id, role_name, username, fungsi, holder, login_url, note, sort, (password_enc IS NOT NULL) AS has_password FROM web_accounts WHERE web_id = ? ORDER BY sort, id", [id]),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/kelola/web" className="text-sm font-semibold text-accent">← Semua web</Link>
        <Link href={`/web/${web.slug}`} className="text-sm text-muted">Lihat halaman publik ↗</Link>
      </div>
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl">{web.name}</h2><DeleteButton entity="webs" id={id} label="Hapus web" confirmText="Hapus web ini beserta media, update, dan akunnya?" redirect="/kelola/web" /></div>
        <EntityForm entity="webs" id={id} fields={WEB_FIELDS} initial={web} />
      </div>

      <div className="card p-6">
        <h2 className="text-xl">Screenshot dan video</h2>
        <p className="mb-3 text-sm text-muted">Gambar maksimal 250 MB per file. Untuk video panjang, lebih ringan memakai link YouTube (unlisted).</p>
        <UploadForm webId={id} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {media.map((m) => (
            <div key={m.id} className="rounded-lg border border-line p-2">
              {m.type === "image" && <img src={`/api/media/${m.path}`} alt="" className="aspect-video w-full rounded object-cover" />}
              {m.type === "video" && <video src={`/api/media/${m.path}`} className="aspect-video w-full rounded bg-black" />}
              {m.type === "youtube" && <div className="grid aspect-video place-items-center rounded bg-subtle text-xs text-heading">YouTube {m.path}</div>}
              <div className="mt-2 flex items-center justify-between gap-2"><span className="truncate text-xs text-muted">{m.caption || "-"}</span><DeleteButton entity="web_media" id={m.id} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl">Akun</h2>
        <div className="mt-3 space-y-3">
          {accounts.map((a) => (
            <details key={a.id} className="rounded-lg border border-line p-4">
              <summary className="cursor-pointer text-sm font-semibold text-heading">{a.role_name} · {a.username || "-"} {a.has_password ? "· password tersimpan" : ""}</summary>
              <div className="mt-4"><EntityForm entity="web_accounts" id={a.id} fields={ACCOUNT_FIELDS} initial={{ ...a, password: "" }} /></div>
              <div className="mt-3"><DeleteButton entity="web_accounts" id={a.id} label="Hapus akun" /></div>
            </details>
          ))}
        </div>
        <h3 className="mb-3 mt-6 font-semibold text-heading">Tambah akun</h3>
        <EntityForm entity="web_accounts" fields={ACCOUNT_FIELDS} fixed={{ web_id: id }} reset submitLabel="Tambah akun" />
      </div>

      <div className="card p-6">
        <h2 className="text-xl">Update manual</h2>
        <p className="mb-3 text-sm text-muted">Perubahan kode dari GitHub masuk otomatis. Pakai ini untuk update di luar kode, misalnya rilis fitur atau perubahan prosedur.</p>
        <EntityForm entity="web_updates" fields={UPDATE_FIELDS.map((f) => (f.name === "date" ? { ...f, default: todayWIB() } : f))} fixed={{ web_id: id }} reset submitLabel="Tambah update" />
        <div className="mt-4 divide-y divide-line">
          {updates.map((u) => (
            <div key={u.id} className="flex items-start justify-between gap-3 py-3 text-sm">
              <div><div className="text-xs text-muted">{nice(u.date)}</div><div className="font-semibold">{u.title}</div>{u.detail && <div className="text-muted">{u.detail}</div>}</div>
              <DeleteButton entity="web_updates" id={u.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
