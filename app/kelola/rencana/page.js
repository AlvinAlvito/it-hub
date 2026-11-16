import { getProjects } from "@/lib/data";
import { nice } from "@/lib/dates";
import { PROJECT_FIELDS, TASK_FIELDS, TASK_STATUS, PROJECT_STATUS } from "@/lib/forms";
import { EntityForm, DeleteButton, QuickSelect } from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function KelolaRencana() {
  const projects = await getProjects();
  return (
    <div className="space-y-4">
      {projects.map((p) => (
        <details key={p.id} className="card p-5">
          <summary className="flex cursor-pointer flex-wrap items-center gap-3">
            <span className="font-semibold text-heading">{p.name}</span>
            <span className="text-xs text-muted">{nice(p.start_date)} – {nice(p.end_date)} · {p.progress}%</span>
            <span className="ml-auto"><QuickSelect entity="projects" id={p.id} name="status" value={p.status} options={PROJECT_STATUS} /></span>
          </summary>
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="mb-2 font-semibold text-heading">Tugas</h3>
              <div className="divide-y divide-line">
                {p.tasks.map((t) => (
                  <details key={t.id} className="py-2">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                      <span className="font-semibold">{t.title}</span>
                      <span className="text-xs text-muted">{t.start_date ? nice(t.start_date) : "?"} – {t.end_date ? nice(t.end_date) : "?"}</span>
                      <span className="ml-auto"><QuickSelect entity="project_tasks" id={t.id} name="status" value={t.status} options={TASK_STATUS} /></span>
                    </summary>
                    <div className="mt-3"><EntityForm entity="project_tasks" id={t.id} fields={TASK_FIELDS} initial={t} /></div>
                    <div className="mt-2"><DeleteButton entity="project_tasks" id={t.id} label="Hapus tugas" /></div>
                  </details>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-subtle p-4">
                <div className="mb-2 text-sm font-semibold text-heading">Tambah tugas</div>
                <EntityForm entity="project_tasks" fields={TASK_FIELDS} fixed={{ project_id: p.id }} reset submitLabel="Tambah tugas" />
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-heading">Detail proyek</h3>
              <EntityForm entity="projects" id={p.id} fields={PROJECT_FIELDS} initial={p} />
              <div className="mt-3"><DeleteButton entity="projects" id={p.id} label="Hapus proyek" confirmText="Hapus proyek beserta tugasnya?" /></div>
            </div>
          </div>
        </details>
      ))}
      <div className="card p-6">
        <h2 className="mb-4 text-xl">Tambah proyek</h2>
        <EntityForm entity="projects" fields={PROJECT_FIELDS} reset submitLabel="Tambah proyek" />
      </div>
    </div>
  );
}
