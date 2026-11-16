import fs from "fs/promises";
import path from "path";
import { q, one, audit } from "@/lib/db";
import { ENTITIES, pick, prepare } from "@/lib/entities";
import { clientIp } from "@/lib/auth";
import { json, requireAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;
  const cfg = ENTITIES[params.entity];
  if (!cfg) return json({ error: "Entitas tidak dikenal" }, 404);
  const body = await req.json().catch(() => ({}));
  if (params.entity === "web_accounts" && body.password === "") delete body.password; // kosong = password tidak diubah
  const data = prepare(params.entity, pick(params.entity, body));
  const keys = Object.keys(data);
  if (!keys.length) return json({ ok: true });
  try {
    await q(`UPDATE ${cfg.table} SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`, [...keys.map((k) => data[k]), Number(params.id)]);
  } catch (e) {
    return json({ error: e.code === "ER_DUP_ENTRY" ? "Slug sudah dipakai" : "Gagal menyimpan" }, 400);
  }
  await audit(user.id, "ubah_" + params.entity, String(params.id), clientIp());
  return json({ ok: true });
}

export async function DELETE(req, { params }) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;
  const cfg = ENTITIES[params.entity];
  if (!cfg) return json({ error: "Entitas tidak dikenal" }, 404);
  const id = Number(params.id);
  if (params.entity === "web_media") {
    const m = await one("SELECT * FROM web_media WHERE id = ?", [id]);
    if (m && m.type !== "youtube") await fs.unlink(path.join(process.env.UPLOAD_DIR || "./uploads", path.basename(m.path))).catch(() => {});
  }
  await q(`DELETE FROM ${cfg.table} WHERE id = ?`, [id]);
  await audit(user.id, "hapus_" + params.entity, String(id), clientIp());
  return json({ ok: true });
}
