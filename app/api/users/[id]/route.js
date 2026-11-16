import bcrypt from "bcryptjs";
import { one, q, audit } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { json, requireStaff } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Ganti password atau PIN. Pengguna boleh mengganti miliknya sendiri (wajib password lama);
// superadmin boleh mengatur ulang milik direktur.
export async function PUT(req, { params }) {
  const { user, error } = await requireStaff(req);
  if (error) return error;
  const id = Number(params.id);
  const self = id === user.id;
  if (!self && user.role !== "superadmin") return json({ error: "Tidak diizinkan" }, 403);
  const target = await one("SELECT * FROM users WHERE id = ?", [id]);
  if (!target) return json({ error: "Pengguna tidak ditemukan" }, 404);
  const { current_password, password, pin } = await req.json().catch(() => ({}));
  if (self && !(await bcrypt.compare(String(current_password || ""), target.password_hash))) return json({ error: "Password lama salah" }, 401);
  if (password && String(password).length < 10) return json({ error: "Password minimal 10 karakter" }, 400);
  if (pin && !/^\d{6}$/.test(String(pin))) return json({ error: "PIN harus 6 angka" }, 400);
  if (!password && !pin) return json({ error: "Isi password baru atau PIN baru" }, 400);
  if (password) await q("UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?", [bcrypt.hashSync(String(password), 12), id]);
  if (pin) await q("UPDATE users SET pin_hash = ? WHERE id = ?", [bcrypt.hashSync(String(pin), 12), id]);
  await audit(user.id, password ? "ganti_password" : "ganti_pin", target.username, clientIp());
  return json({ ok: true, relogin: !!(password && self) });
}
