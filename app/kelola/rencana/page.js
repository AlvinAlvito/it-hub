import { getProjects } from "@/lib/data";
import { nice } from "@/lib/dates";
import { PROJECT_FIELDS, TASK_FIELDS, TASK_STATUS, PROJECT_STATUS } from "@/lib/forms";
import { FormModal, DeleteButton, QuickSelect } from "@/components/admin";
import { Progress, CAT } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function KelolaRencana() {
  const projects = await getProjects();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{projects.length} proyek. Ubah status langsung dari daftar, atau buka detail dengan tombol ubah.</p>
        <FormModal label="Tambah proyek" title="Tambah proyek" wide entity="projects" fields={PROJECT_FIELDS} />
      </div>
      {projects.map((p) => {
        const color = (CAT[p.category] || CAT.internal)[1];
        return (
          <section key={p.id} className="card p-5">
            <div className="flex flex-wrap items-start gap-3">
              <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-heading">{p.name}</div>
                <div className="text-xs text-muted">{nice(p.start_date)} – {nice(p.end_date)} · {p.tasks.filter((t) => t.status === "selesai").length}/{p.tasks.length} tugas selesai</div>
                <div className="mt-2 flex max-w-sm items-center gap-2"><Progress value={p.progress} color={color} /><span className="text-xs font-semibold text-muted">{p.progress}%</span></div>
              </div>
              <QuickSelect entity="projects" id={p.id} name="status" value={p.status} options={PROJECT_STATUS} />
              <FormModal variant="icon" icon="edit" title={`Ubah ${p.name}`} wide entity="projects" id={p.id} fields={PROJECT_FIELDS} initial={p} />
              <DeleteButton entity="projects" id={p.id} confirmText="Hapus proyek beserta tugasnya?" />
            </div>
            <div className="mt-4 divide-y divide-line rounded-xl border border-line">
              {p.tasks.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={`min-w-0 flex-1 ${t.status === "selesai" ? "text-muted line-through" : "font-medium text-fg"}`}>{t.title}</span>
                  <span className="text-xs text-muted">{t.start_date ? nice(t.start_date) : "?"} – {t.end_date ? nice(t.end_date) : "?"}</span>
                  <QuickSelect entity="project_tasks" id={t.id} name="status" value={t.status} options={TASK_STATUS} />
                  <FormModal variant="icon" icon="edit" title="Ubah tugas" entity="project_tasks" id={t.id} fields={TASK_FIELDS} initial={t} />
                  <DeleteButton entity="project_tasks" id={t.id} />
                </div>
              ))}
              {!p.tasks.length && <div className="px-4 py-3 text-sm text-muted">Belum ada tugas.</div>}
            </div>
            <div className="mt-3"><FormModal label="Tambah tugas" title={`Tambah tugas: ${p.name}`} variant="ghost" entity="project_tasks" fields={TASK_FIELDS} fixed={{ project_id: p.id }} /></div>
          </section>
        );
      })}
    </div>
  );
}
