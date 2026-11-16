import { q } from "@/lib/db";
import { todayWIB, nice } from "@/lib/dates";
import { activityFields } from "@/lib/forms";
import { FormModal, DeleteButton } from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function KelolaAktivitas() {
  const [acts, projects] = await Promise.all([
    q("SELECT a.*, p.name AS project_name FROM activities a LEFT JOIN projects p ON p.id = a.project_id ORDER BY a.date DESC, a.id DESC LIMIT 100"),
    q("SELECT id, name FROM projects ORDER BY start_date"),
  ]);
  const fields = activityFields(projects, todayWIB());
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Pekerjaan di luar GitHub: koordinasi, rapat, strategi, support, standby.</p>
        <FormModal label="Catat aktivitas" title="Catat aktivitas" entity="activities" fields={fields} />
      </div>
      <div className="card divide-y divide-line">
        {acts.length ? acts.map((a) => (
          <div key={a.id} className="flex flex-wrap items-start gap-3 p-4 text-sm">
            <span className="w-24 text-xs text-muted">{nice(a.date)}</span>
            <span className="chip bg-teal/10 capitalize text-teal">{a.category}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-heading">{a.title}{a.duration_min ? <span className="ml-2 text-xs font-normal text-muted">{a.duration_min} menit</span> : null}</div>
              {a.detail && <div className="text-muted">{a.detail}</div>}
              {a.project_name && <div className="text-xs text-accent">{a.project_name}</div>}
            </div>
            <FormModal variant="icon" icon="edit" title="Ubah aktivitas" entity="activities" id={a.id} fields={fields} initial={{ ...a, project_id: a.project_id ? String(a.project_id) : "" }} />
            <DeleteButton entity="activities" id={a.id} />
          </div>
        )) : <p className="p-6 text-center text-sm text-muted">Belum ada aktivitas.</p>}
      </div>
    </div>
  );
}
