import { encrypt } from "./crypto";

// Entitas yang boleh dikelola superadmin lewat /api/admin/[entity]
export const ENTITIES = {
  webs: {
    table: "webs",
    fields: ["slug", "name", "url", "category", "status", "summary", "fungsi", "cara_pakai", "repo", "tech", "sort"],
    required: ["slug", "name"],
  },
  web_updates: { table: "web_updates", fields: ["web_id", "date", "title", "detail"], required: ["web_id", "date", "title"] },
  web_accounts: {
    table: "web_accounts",
    fields: ["web_id", "role_name", "username", "password", "fungsi", "holder", "login_url", "note", "sort"],
    required: ["web_id", "role_name"],
  },
  web_media: { table: "web_media", fields: ["caption", "sort", "section"], required: [] },
  projects: {
    table: "projects",
    fields: ["slug", "name", "start_date", "end_date", "category", "status", "progress", "masalah", "solusi", "tujuan", "manfaat", "output", "repos", "sort"],
    required: ["slug", "name", "start_date", "end_date"],
  },
  project_tasks: { table: "project_tasks", fields: ["project_id", "title", "start_date", "end_date", "status", "sort"], required: ["project_id", "title"] },
  activities: { table: "activities", fields: ["date", "title", "detail", "category", "duration_min", "project_id"], required: ["date", "title"] },
};

export function pick(entity, body) {
  const cfg = ENTITIES[entity];
  const out = {};
  for (const f of cfg.fields) {
    if (body[f] === undefined) continue;
    let v = body[f];
    if (typeof v === "string") v = v.trim();
    if (v === "") v = null;
    out[f] = v;
  }
  return out;
}

// Password dienkripsi sebelum disimpan; angka dinormalkan
export function prepare(entity, data) {
  if (entity === "web_accounts" && "password" in data) {
    data.password_enc = data.password ? encrypt(data.password) : null;
    delete data.password;
  }
  for (const k of ["progress", "sort", "duration_min", "web_id", "project_id"]) {
    if (k in data && data[k] !== null) data[k] = Number(data[k]) || 0;
  }
  if ("progress" in data) data.progress = Math.max(0, Math.min(100, data.progress || 0));
  if (entity === "web_media" && "section" in data && !["slider", "galeri", "video"].includes(data.section)) delete data.section;
  return data;
}
