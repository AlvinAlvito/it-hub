import { q } from "@/lib/db";
import { todayWIB, nice } from "@/lib/dates";
import { ACT_CATEGORIES } from "@/lib/forms";
import { EntityForm, DeleteButton } from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function KelolaAktivitas() {
  const [acts, projects] = await Promise.all([
    q("SELECT a.*, p.name AS project_name FROM activities a LEFT JOIN projects p ON p.id = a.project_id ORDER BY a.date DESC, a.id DESC LIMIT 100"),
    q("SELECT id, name FROM projects ORDER BY start_date"),
  ]);
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-xl">Catat aktivitas</h2>
        <EntityForm entity="activities" reset submitLabel="Catat" fields={[
          { name: "date", label: "Tanggal", type: "date", required: true, default: todayWIB() },
          { name: "category", label: "Jenis", type: "select", options: ACT_CATEGORIES, default: "koordinasi" },
          { name: "title", label: "Apa yang dikerjakan", required: true, wide: true },
          { name: "duration_min", label: "Durasi (menit)", type: "number" },
          { name: "project_id", label: "Proyek terkait", type: "select", options: [["", "Tidak ada"], ...projects.map((p) => [String(p.id), p.name])] },
          { name: "detail", label: "Detail", type: "textarea" },
        ]} />
      </div>
      <div className="card divide-y divide-line">
        {acts.length ? acts.map((a) => (
          <div key={a.id} className="flex flex-wrap items-start gap-3 p-4 text-sm">
            <span className="w-24 text-xs text-muted">{nice(a.date)}</span>
            <span className="chip bg-teal/10 capitalize text-teal">{a.category}</span>
            <div className="flex-1"><div className="font-semibold">{a.title}</div>{a.detail && <div className="text-muted">{a.detail}</div>}{a.project_name && <div className="text-xs text-accent">{a.project_name}</div>}</div>
            <DeleteButton entity="activities" id={a.id} />
          </div>
        )) : <p className="p-4 text-sm text-muted">Belum ada aktivitas.</p>}
      </div>
    </div>
  );
}
