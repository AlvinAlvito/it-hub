import { one, audit } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { vaultOpen, clientIp } from "@/lib/auth";
import { json, requireStaff } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  const { user, error } = await requireStaff(req);
  if (error) return error;
  if (!(await vaultOpen(user))) return json({ error: "Masukkan PIN dulu" }, 401);
  const acc = await one("SELECT a.id, a.role_name, a.password_enc, w.name AS web FROM web_accounts a JOIN webs w ON w.id = a.web_id WHERE a.id = ?", [Number(params.id)]);
  if (!acc) return json({ error: "Akun tidak ditemukan" }, 404);
  await audit(user.id, "lihat_password", `${acc.web} / ${acc.role_name}`, clientIp());
  const res = json({ password: decrypt(acc.password_enc) });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
