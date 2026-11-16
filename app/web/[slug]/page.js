import Link from "next/link";
import { notFound } from "next/navigation";
import { getWeb } from "@/lib/data";
import { getSession, isStaff, vaultOpen } from "@/lib/auth";
import { nice } from "@/lib/dates";
import { Badge, STATUS_WEB, Lines } from "@/components/ui";
import Gallery, { VideoGallery } from "@/components/Gallery";
import Slider from "@/components/Slider";
import Accounts from "@/components/Accounts";

export const dynamic = "force-dynamic";

export default async function WebDetail({ params }) {
  const user = await getSession();
  const staff = isStaff(user);
  const data = await getWeb(params.slug, staff);
  if (!data) notFound();
  const { web, media, updates, commits, accounts } = data;
  const timeline = [
    ...updates.map((u) => ({ date: u.date, title: u.title, detail: u.detail, kind: "update" })),
    ...commits.map((c) => ({ date: c.committed_at.slice(0, 10), title: c.message.split("\n")[0], kind: "kode", url: c.url })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40);
  const last = timeline[0]?.date;
  const slides = media.filter((m) => m.section === "slider" && m.type === "image");
  const images = media.filter((m) => m.section === "galeri" && m.type === "image");
  const videos = media.filter((m) => m.section === "video" || m.type !== "image");

  return (
    <>
      <div className="wrap pt-8">
        <Link href="/web" className="text-sm font-semibold text-accent">← Katalog web</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl md:text-4xl">{web.name}</h1>
          <Badge map={STATUS_WEB} value={web.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {web.url && <a href={web.url} target="_blank" rel="noreferrer" className="font-semibold text-heading underline-offset-4 hover:underline">{web.url.replace(/^https?:\/\//, "")} ↗</a>}
          {web.category && <span>{web.category}</span>}
          {web.tech && <span>{web.tech}</span>}
          <span>Update terakhir: {last ? nice(last) : "-"}</span>
        </div>
        <p className="mt-4 max-w-3xl text-lg text-fg">{web.summary}</p>
      </div>

      {slides.length > 0 && <div className="wrap mt-6"><Slider images={slides} /></div>}

      {images.length > 0 && (
        <div className="wrap mt-8">
          <div className="kicker">Galeri</div>
          <h2 className="mb-4 mt-1 text-xl">Tampilan sistem</h2>
          <Gallery media={images} />
        </div>
      )}

      {videos.length > 0 && (
        <div className="wrap mt-8">
          <div className="kicker">Video</div>
          <h2 className="mb-4 mt-1 text-xl">Video panduan dan demo</h2>
          <VideoGallery media={videos} />
        </div>
      )}

      <div className="wrap mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="kicker">Fungsi</div>
          <h2 className="mb-3 mt-1 text-xl">Apa saja yang bisa dilakukan</h2>
          <Lines text={web.fungsi} />
        </div>
        <div className="card p-6">
          <div className="kicker">Cara pakai</div>
          <h2 className="mb-3 mt-1 text-xl">Langkah penggunaan</h2>
          <Lines text={web.cara_pakai} />
        </div>
      </div>

      <div className="wrap mt-6">
        <div className="card p-6">
          <div className="kicker">Akun</div>
          <h2 className="mt-1 text-xl">Akun dan fungsinya</h2>
          {staff ? (
            <Accounts accounts={accounts} vault={await vaultOpen(user)} />
          ) : (
            <p className="mt-2 text-sm text-muted">Daftar akun hanya bisa dilihat pimpinan setelah login. <Link href="/login" className="font-semibold text-heading">Masuk</Link></p>
          )}
        </div>
      </div>

      <div className="wrap mt-6">
        <div className="card p-6">
          <div className="kicker">Riwayat</div>
          <h2 className="mt-1 text-xl">Update dan perubahan</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-line pl-5">
            {timeline.length ? timeline.map((t, i) => (
              <li key={i} className="relative">
                <span className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ${t.kind === "update" ? "bg-gold" : "bg-brand"}`} />
                <div className="text-xs text-muted">{nice(t.date)} · {t.kind === "update" ? "Update" : "Perubahan kode"}</div>
                <div className="text-sm font-semibold text-fg">{t.url ? <a href={t.url} target="_blank" rel="noreferrer" className="hover:underline">{t.title}</a> : t.title}</div>
                {t.detail && <div className="mt-1 whitespace-pre-line text-sm text-muted">{t.detail}</div>}
              </li>
            )) : <li className="text-sm text-muted">Belum ada riwayat.</li>}
          </ol>
        </div>
      </div>
    </>
  );
}
