import { q, audit } from "@/lib/db";
import { ENTITIES, pick, prepare } from "@/lib/entities";
import { clientIp } from "@/lib/auth";
import { json, requireAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;
  const cfg = ENTITIES[params.entity];
  if (!cfg) return json({ error: "Entitas tidak dikenal" }, 404);
  const body = await req.json().catch(() => ({}));
  const data = prepare(params.entity, pick(params.entity, body));
  for (const r of cfg.required) if (data[r] == null) return json({ error: `Kolom ${r} wajib diisi` }, 400);
  const keys = Object.keys(data);
  try {
    const res = await q(`INSERT INTO ${cfg.table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`, keys.map((k) => data[k]));
    await audit(user.id, "tambah_" + params.entity, String(res.insertId), clientIp());
    return json({ ok: true, id: res.insertId });
  } catch (e) {
    return json({ error: e.code === "ER_DUP_ENTRY" ? "Data dengan slug yang sama sudah ada" : "Gagal menyimpan" }, 400);
  }
}
