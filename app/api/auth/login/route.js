import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { one, q, audit } from "@/lib/db";
import { signToken, cookieOptions, SESSION_COOKIE, SESSION_HOURS, clientIp } from "@/lib/auth";
import { json, rateLimit, sameOrigin } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: "Origin tidak valid" }, 403);
  const ip = clientIp();
  if (!rateLimit("login:" + ip, 10, 15 * 60 * 1000)) return json({ error: "Terlalu banyak percobaan. Coba lagi 15 menit lagi." }, 429);
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) return json({ error: "Isi username dan password" }, 400);
  const user = await one("SELECT * FROM users WHERE username = ?", [String(username).trim().toLowerCase()]);
  const fail = () => json({ error: "Username atau password salah" }, 401);
  if (!user) {
    await bcrypt.compare(password, "$2a$12$abcdefghijklmnopqrstuuJ1A1pQe3s0yq0yqK3yC2m1F5l0s7m6W"); // samakan waktu respons
    await audit(null, "login_gagal", String(username).slice(0, 60), ip);
    return fail();
  }
  if (user.locked_until && new Date(user.locked_until.replace(" ", "T")) > new Date()) {
    return json({ error: "Akun dikunci sementara karena terlalu banyak percobaan. Coba lagi nanti." }, 423);
  }
  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) {
    const n = user.failed_logins + 1;
    await q("UPDATE users SET failed_logins = ?, locked_until = IF(? >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), locked_until) WHERE id = ?", [n >= 5 ? 0 : n, n, user.id]);
    await audit(user.id, "login_gagal", user.username, ip);
    return fail();
  }
  await q("UPDATE users SET failed_logins = 0, locked_until = NULL, last_login = NOW() WHERE id = ?", [user.id]);
  const token = await signToken({ typ: "session", uid: user.id, sv: user.session_version }, `${SESSION_HOURS}h`);
  cookies().set(SESSION_COOKIE, token, cookieOptions(SESSION_HOURS * 3600));
  await audit(user.id, "login", user.username, ip);
  return json({ ok: true, role: user.role });
}
