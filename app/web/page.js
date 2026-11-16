import Link from "next/link";
import { getWebs } from "@/lib/data";
import { nice } from "@/lib/dates";
import { PageHead, Badge, STATUS_WEB } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function WebList() {
  const webs = await getWebs();
  const cats = [...new Set(webs.map((w) => w.category || "Lainnya"))];
  return (
    <>
      <PageHead kicker="Katalog" title="Web dan sistem yang dikelola IT">
        Klik salah satu web untuk melihat fungsi, cara pakai, screenshot, video, riwayat update, dan akunnya.
      </PageHead>
      <div className="wrap space-y-10">
        {cats.map((cat) => (
          <section key={cat}>
            <h2 className="mb-3 text-xl">{cat}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {webs.filter((w) => (w.category || "Lainnya") === cat).map((w) => (
                <Link key={w.id} href={`/web/${w.slug}`} className="card overflow-hidden hover:border-gold">
                  <div className="relative aspect-[16/9] bg-subtle">
                    {w.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/media/${w.thumb}`} alt={w.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center font-bold text-3xl text-heading/30">{w.name}</div>
                    )}
                    <span className="absolute right-3 top-3"><Badge map={STATUS_WEB} value={w.status} /></span>
                  </div>
                  <div className="p-5">
                    <div className="font-bold text-lg text-heading">{w.name}</div>
                    <div className="text-xs text-accent">{w.url?.replace(/^https?:\/\//, "")}</div>
                    <p className="mt-2 line-clamp-3 text-sm text-muted">{w.summary}</p>
                    <div className="mt-3 flex justify-between text-xs text-muted">
                      <span>Update: {w.last_update ? nice(w.last_update) : "-"}</span>
                      <span>{w.commit_count} perubahan kode</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
