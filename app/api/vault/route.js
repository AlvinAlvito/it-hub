import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { one, q, audit } from "@/lib/db";
import { signToken, cookieOptions, VAULT_COOKIE, VAULT_MINUTES, clientIp } from "@/lib/auth";
import { json, rateLimit, requireStaff } from "@/lib/guard";

export const dynamic = "force-dynamic";

// Buka brankas password dengan PIN, berlaku VAULT_MINUTES menit
export async function POST(req) {
  const { user, error } = await requireStaff(req);
  if (error) return error;
  const ip = clientIp();
  if (!rateLimit("pin:" + user.id, 8, 15 * 60 * 1000)) return json({ error: "Terlalu banyak percobaan PIN." }, 429);
  const row = await one("SELECT pin_hash, failed_pins, pin_locked_until FROM users WHERE id = ?", [user.id]);
  if (row.pin_locked_until && new Date(row.pin_locked_until.replace(" ", "T")) > new Date()) {
    return json({ error: "PIN dikunci 15 menit karena salah berulang kali." }, 423);
  }
  const { pin } = await req.json().catch(() => ({}));
  const ok = pin && (await bcrypt.compare(String(pin), row.pin_hash));
  if (!ok) {
    const n = row.failed_pins + 1;
    await q("UPDATE users SET failed_pins = ?, pin_locked_until = IF(? >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), pin_locked_until) WHERE id = ?", [n >= 5 ? 0 : n, n, user.id]);
    await audit(user.id, "pin_gagal", null, ip);
    return json({ error: "PIN salah" }, 401);
  }
  await q("UPDATE users SET failed_pins = 0, pin_locked_until = NULL WHERE id = ?", [user.id]);
  const token = await signToken({ typ: "vault", uid: user.id }, `${VAULT_MINUTES}m`);
  cookies().set(VAULT_COOKIE, token, cookieOptions(VAULT_MINUTES * 60));
  await audit(user.id, "buka_brankas", null, ip);
  return json({ ok: true, minutes: VAULT_MINUTES });
}

export async function DELETE(req) {
  const { error } = await requireStaff(req);
  if (error) return error;
  cookies().delete(VAULT_COOKIE);
  return json({ ok: true });
}
