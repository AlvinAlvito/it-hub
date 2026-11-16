import Link from "next/link";
import { q } from "@/lib/db";
import { WEB_FIELDS } from "@/lib/forms";
import { FormModal } from "@/components/admin";
import { Badge, STATUS_WEB } from "@/components/ui";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function KelolaWeb() {
  const webs = await q(`SELECT w.*,
    (SELECT COUNT(*) FROM web_accounts a WHERE a.web_id = w.id) AS n_acc,
    (SELECT COUNT(*) FROM web_media m WHERE m.web_id = w.id AND m.section = 'slider') AS n_slider,
    (SELECT COUNT(*) FROM web_media m WHERE m.web_id = w.id AND m.section = 'galeri') AS n_img,
    (SELECT COUNT(*) FROM web_media m WHERE m.web_id = w.id AND m.section = 'video') AS n_vid,
    (SELECT path FROM web_media m WHERE m.web_id = w.id AND m.type = 'image' ORDER BY m.section = 'slider' DESC, m.sort, m.id LIMIT 1) AS thumb
    FROM webs w ORDER BY sort, name`);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{webs.length} web. Klik salah satu untuk mengelola info, media, akun, dan update.</p>
        <FormModal label="Tambah web" title="Tambah web baru" wide entity="webs" fields={WEB_FIELDS} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {webs.map((w) => (
          <Link key={w.id} href={`/kelola/web/${w.id}`} className="card group overflow-hidden transition hover:border-gold">
            <div className="relative aspect-[16/8] bg-subtle">
              {w.thumb ? <img src={`/api/media/${w.thumb}`} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-2xl font-bold text-heading/20">{w.name}</div>}
              <span className="absolute right-3 top-3"><Badge map={STATUS_WEB} value={w.status} /></span>
            </div>
            <div className="p-4">
              <div className="font-bold text-heading">{w.name}</div>
              <div className="truncate text-xs text-accent">{w.url?.replace(/^https?:\/\//, "") || "-"}</div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                <span className="flex items-center gap-1"><Icon name="slides" className="h-3.5 w-3.5" />{w.n_slider}</span>
                <span className="flex items-center gap-1"><Icon name="image" className="h-3.5 w-3.5" />{w.n_img}</span>
                <span className="flex items-center gap-1"><Icon name="video" className="h-3.5 w-3.5" />{w.n_vid}</span>
                <span className="flex items-center gap-1"><Icon name="key" className="h-3.5 w-3.5" />{w.n_acc} akun</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
