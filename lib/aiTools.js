// Alat ubah data untuk AI Asisten. HANYA dipakai bila yang login superadmin (dicek di route).
import { q, one, audit } from "./db";
import { ENTITIES, pick, prepare } from "./entities";
import { PROJECT_STATUS, TASK_STATUS, ACT_CATEGORIES } from "./forms";

const vals = (opts) => opts.map((o) => o[0]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Entitas yang boleh disentuh AI. Akun (password) dan media sengaja tidak termasuk.
export const AI_ENTITIES = {
  projects: { label: "proyek", title: "name", enums: { status: vals(PROJECT_STATUS), category: ["internal", "posi", "produk"] }, dates: ["start_date", "end_date"] },
  project_tasks: { label: "tugas", title: "title", enums: { status: vals(TASK_STATUS) }, dates: ["start_date", "end_date"] },
  activities: { label: "aktivitas", title: "title", enums: { category: vals(ACT_CATEGORIES) }, dates: ["date"] },
  web_updates: { label: "riwayat update web", title: "title", enums: {}, dates: ["date"] },
  webs: { label: "web", title: "name", enums: { status: ["aktif", "pengembangan", "rencana", "nonaktif"] }, dates: [] },
};

const ENTITY_ENUM = Object.keys(AI_ENTITIES);
const DATA_DESC = `Kolom per entitas:
- projects: name, start_date, end_date, category (internal|posi|produk), status (rencana|berjalan|selesai|tertunda), progress (0-100), masalah, solusi, tujuan, manfaat, output, repos
- project_tasks: project_id, title, start_date, end_date, status (belum|berjalan|selesai|tertunda)
- activities: date, title, detail, category (${vals(ACT_CATEGORIES).join("|")}), duration_min, project_id
- web_updates: web_id, date, title, detail
- webs: name, url, status (aktif|pengembangan|rencana|nonaktif), summary, fungsi, cara_pakai, repo, tech
Tanggal format YYYY-MM-DD.`;

export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "ubah_data",
      description: "Menjalankan satu atau beberapa perubahan data IT Hub sekaligus. Masukkan SEMUA perubahan yang diminta ke dalam operations dalam satu panggilan. action: tambah (perlu data), ubah (perlu id dan data berisi kolom yang berubah saja), hapus (perlu id; baru terjadi setelah pengguna konfirmasi). id diambil dari tanda #id di DATA. " + DATA_DESC,
      parameters: {
        type: "object",
        properties: {
          operations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["tambah", "ubah", "hapus"] },
                entity: { type: "string", enum: ENTITY_ENUM },
                id: { type: "integer" },
                data: { type: "object", description: "Kolom dan nilainya" },
              },
              required: ["action", "entity"],
            },
          },
        },
        required: ["operations"],
      },
    },
  },
];

const slugify = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "item";

function validate(entity, data) {
  const cfg = AI_ENTITIES[entity];
  for (const [k, allowed] of Object.entries(cfg.enums)) if (data[k] != null && !allowed.includes(data[k])) return `Nilai ${k} "${data[k]}" tidak valid (pilihan: ${allowed.join(", ")})`;
  for (const k of cfg.dates) if (data[k] != null && !DATE.test(data[k])) return `Format ${k} harus YYYY-MM-DD`;
  return null;
}

async function titleOf(entity, id) {
  const r = await one(`SELECT ${AI_ENTITIES[entity].title} AS t FROM ${ENTITIES[entity].table} WHERE id = ?`, [id]);
  return r ? r.t : null;
}

// Menjalankan satu panggilan alat. Hasilnya dikirim balik ke AI dan ditampilkan di chat.
export async function runOperation(args, user, ip) {
  const name = { tambah: "tambah_data", ubah: "ubah_data", hapus: "hapus_data" }[args?.action];
  const entity = args?.entity;
  const cfg = AI_ENTITIES[entity];
  if (!cfg) return { ok: false, error: "Entitas tidak diizinkan" };
  const table = ENTITIES[entity].table;
  const id = Number(args.id);

  if (name === "hapus_data") {
    const t = await titleOf(entity, id);
    if (t == null) return { ok: false, error: `${cfg.label} #${id} tidak ditemukan` };
    return { ok: true, pending: true, entity, id, label: `Hapus ${cfg.label}: ${t}`, note: "Menunggu konfirmasi pengguna" };
  }

  const raw = args.data && typeof args.data === "object" ? { ...args.data } : {};
  delete raw.password; delete raw.id;
  if (name === "tambah_data" && ["projects", "webs"].includes(entity) && !raw.slug) raw.slug = slugify(raw.name);
  const data = prepare(entity, pick(entity, raw));
  const bad = validate(entity, data);
  if (bad) return { ok: false, error: bad };
  const keys = Object.keys(data);
  if (!keys.length) return { ok: false, error: "Tidak ada kolom yang valid untuk disimpan" };

  try {
    if (name === "tambah_data") {
      for (const r of ENTITIES[entity].required) if (data[r] == null) return { ok: false, error: `Kolom ${r} wajib diisi` };
      const res = await q(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`, keys.map((k) => data[k]));
      await audit(user.id, "ai_tambah_" + entity, String(res.insertId), ip);
      return { ok: true, action: "tambah", entity, id: res.insertId, label: `Tambah ${cfg.label}: ${data[cfg.title] || "#" + res.insertId}` };
    }
    if (name === "ubah_data") {
      const before = await one(`SELECT * FROM ${table} WHERE id = ?`, [id]);
      if (!before) return { ok: false, error: `${cfg.label} #${id} tidak ditemukan` };
      await q(`UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`, [...keys.map((k) => data[k]), id]);
      await audit(user.id, "ai_ubah_" + entity, `${id}: ${keys.join(",")}`.slice(0, 250), ip);
      const diff = keys.map((k) => `${k}: ${before[k] ?? "-"} → ${data[k] ?? "-"}`).join("; ");
      return { ok: true, action: "ubah", entity, id, label: `Ubah ${cfg.label} "${before[cfg.title]}" (${diff})`.slice(0, 400) };
    }
  } catch (e) {
    return { ok: false, error: e.code === "ER_DUP_ENTRY" ? "Slug sudah dipakai" : e.code === "ER_NO_REFERENCED_ROW_2" ? "project_id atau web_id tidak ada" : "Gagal menyimpan" };
  }
  return { ok: false, error: "Alat tidak dikenal" };
}
