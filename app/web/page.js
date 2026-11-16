import { getWebs } from "@/lib/data";
import { nice } from "@/lib/dates";
import { PageHead } from "@/components/ui";
import WebGrid from "@/components/WebGrid";

export const dynamic = "force-dynamic";

export default async function WebList() {
  const webs = (await getWebs()).map((w) => ({
    id: w.id, slug: w.slug, name: w.name, url: w.url, category: w.category, status: w.status, summary: w.summary, tech: w.tech,
    thumb: w.thumb, commit_count: w.commit_count, update_label: w.last_update ? nice(w.last_update) : "-",
  }));
  return (
    <>
      <PageHead kicker="Katalog" title="Web dan sistem yang dikelola IT">
        Klik salah satu web untuk melihat fungsi, cara pakai, screenshot, video, riwayat update, dan akunnya.
      </PageHead>
      <div className="wrap"><WebGrid webs={webs} /></div>
    </>
  );
}
