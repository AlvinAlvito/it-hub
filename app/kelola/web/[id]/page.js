import Link from "next/link";
import { notFound } from "next/navigation";
import { one, q } from "@/lib/db";
import { todayWIB, nice } from "@/lib/dates";
import { WEB_FIELDS, ACCOUNT_FIELDS, UPDATE_FIELDS, MEDIA_FIELDS } from "@/lib/forms";
import { FormModal, DeleteButton, UploadModal } from "@/components/admin";
import { Badge, STATUS_WEB, Lines } from "@/components/ui";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

function Section({ icon, title, desc, action, children }) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-subtle text-accent"><Icon name={icon} /></span>
          <div>
            <h2 className="text-lg">{title}</h2>
            {desc && <p className="text-sm text-muted">{desc}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }) {
  return <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{text}</div>;
}

function MediaGrid({ items, video }) {
  if (!items.length) return <Empty text="Belum ada. Klik tombol tambah di kanan atas." />;
  return (
    <div className={`grid gap-3 ${video ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
      {items.map((m) => (
        <div key={m.id} className="group overflow-hidden rounded-2xl border border-line bg-subtle">
          <div className="relative">
            {m.type === "image" && <img src={`/api/media/${m.path}`} alt="" className="aspect-video w-full object-cover" />}
            {m.type === "video" && <video src={`/api/media/${m.path}`} preload="metadata" className="aspect-video w-full bg-black" />}
            {m.type === "youtube" && <img src={`https://i.ytimg.com/vi/${m.path}/hqdefault.jpg`} alt="" className="aspect-video w-full object-cover" />}
            {m.type === "youtube" && <span className="absolute left-2 top-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">YouTube</span>}
          </div>
          <div className="flex items-center gap-1 bg-card px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs text-muted">{m.caption || "Tanpa keterangan"}</span>
            <FormModal variant="icon" icon="edit" title="Ubah media" entity="web_media" id={m.id} fields={MEDIA_FIELDS} initial={m} />
            <DeleteButton entity="web_media" id={m.id} confirmText="Hapus media ini?" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function KelolaWebDetail({ params }) {
  const id = Number(params.id);
  const web = await one("SELECT * FROM webs WHERE id = ?", [id]);
  if (!web) notFound();
  const [media, updates, accounts] = await Promise.all([
    q("SELECT * FROM web_media WHERE web_id = ? ORDER BY sort, id", [id]),
    q("SELECT * FROM web_updates WHERE web_id = ? ORDER BY date DESC, id DESC", [id]),
    q("SELECT id, role_name, username, fungsi, holder, login_url, note, sort, (password_enc IS NOT NULL) AS has_password FROM web_accounts WHERE web_id = ? ORDER BY sort, id", [id]),
  ]);
  const by = (s) => media.filter((m) => (m.section || "galeri") === s);
  const info = [["Alamat", web.url], ["Kategori", web.category], ["Repo GitHub", web.repo], ["Teknologi", web.tech], ["Urutan", web.sort]];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link href="/kelola/web" className="font-semibold text-accent">← Semua web</Link>
        <Link href={`/web/${web.slug}`} className="text-muted hover:text-heading">Lihat halaman publik ↗</Link>
      </div>

      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl">{web.name}</h2><Badge map={STATUS_WEB} value={web.status} /></div>
            <p className="mt-2 max-w-3xl text-sm text-muted">{web.summary || "Belum ada ringkasan."}</p>
          </div>
          <div className="flex gap-2">
            <FormModal label="Ubah info" title={`Ubah ${web.name}`} icon="edit" variant="ghost" wide entity="webs" id={id} fields={WEB_FIELDS} initial={web} />
            <DeleteButton entity="webs" id={id} label="Hapus" confirmText="Hapus web ini beserta media, update, dan akunnya?" redirect="/kelola/web" />
          </div>
        </div>
        <dl className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-5">
          {info.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="truncate text-sm font-semibold text-heading">{v || "-"}</dd></div>)}
        </dl>
        <div className="mt-5 grid gap-6 border-t border-line pt-5 md:grid-cols-2">
          <div><div className="kicker mb-2">Fungsi</div><Lines text={web.fungsi} /></div>
          <div><div className="kicker mb-2">Cara pakai</div><Lines text={web.cara_pakai} /></div>
        </div>
      </section>

      <Section icon="slides" title="Slider gambar" desc="Tampil sebagai carousel besar di bagian atas halaman web." action={<UploadModal webId={id} section="slider" label="Tambah slide" />}>
        <MediaGrid items={by("slider")} />
      </Section>

      <Section icon="image" title="Galeri gambar" desc="Screenshot fitur dan halaman penting." action={<UploadModal webId={id} section="galeri" label="Tambah gambar" />}>
        <MediaGrid items={by("galeri")} />
      </Section>

      <Section icon="video" title="Galeri video" desc="Unggah MP4/WEBM atau pakai link YouTube (lebih ringan untuk video panjang)." action={<UploadModal webId={id} section="video" label="Tambah video" />}>
        <MediaGrid items={by("video")} video />
      </Section>

      <Section icon="key" title="Akun" desc="Password disimpan terenkripsi dan hanya tampil setelah PIN." action={<FormModal label="Tambah akun" title="Tambah akun" wide entity="web_accounts" fields={ACCOUNT_FIELDS} fixed={{ web_id: id }} />}>
        {accounts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs text-muted"><th className="py-2 pr-4">Peran</th><th className="py-2 pr-4">Username</th><th className="py-2 pr-4">Password</th><th className="py-2 pr-4">Pemegang</th><th className="py-2 pr-4">Fungsi</th><th /></tr></thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-b border-line align-top last:border-0">
                    <td className="py-3 pr-4 font-semibold text-heading">{a.role_name}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{a.username || "-"}</td>
                    <td className="py-3 pr-4 text-xs">{a.has_password ? <span className="chip bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Tersimpan</span> : <span className="text-muted">-</span>}</td>
                    <td className="py-3 pr-4">{a.holder || "-"}</td>
                    <td className="max-w-xs py-3 pr-4 text-muted">{a.fungsi || "-"}</td>
                    <td className="whitespace-nowrap py-2 text-right">
                      <FormModal variant="icon" icon="edit" title={`Ubah akun ${a.role_name}`} wide entity="web_accounts" id={a.id} fields={ACCOUNT_FIELDS} initial={{ ...a, password: "" }} />
                      <DeleteButton entity="web_accounts" id={a.id} confirmText="Hapus akun ini?" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty text="Belum ada akun yang dicatat." />}
      </Section>

      <Section icon="clock" title="Update manual" desc="Perubahan kode dari GitHub masuk otomatis. Catat di sini rilis fitur atau perubahan prosedur." action={<FormModal label="Tambah update" title="Tambah update" entity="web_updates" fields={UPDATE_FIELDS.map((f) => (f.name === "date" ? { ...f, default: todayWIB() } : f))} fixed={{ web_id: id }} />}>
        {updates.length ? (
          <div className="divide-y divide-line">
            {updates.map((u) => (
              <div key={u.id} className="flex items-start gap-3 py-3 text-sm">
                <span className="w-24 shrink-0 text-xs text-muted">{nice(u.date)}</span>
                <div className="min-w-0 flex-1"><div className="font-semibold text-heading">{u.title}</div>{u.detail && <div className="whitespace-pre-line text-muted">{u.detail}</div>}</div>
                <FormModal variant="icon" icon="edit" title="Ubah update" entity="web_updates" id={u.id} fields={UPDATE_FIELDS} initial={u} />
                <DeleteButton entity="web_updates" id={u.id} />
              </div>
            ))}
          </div>
        ) : <Empty text="Belum ada update manual." />}
      </Section>
    </div>
  );
}
