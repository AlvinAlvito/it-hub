import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { one } from "./db";

export const SESSION_COOKIE = "ithub_session";
export const VAULT_COOKIE = "ithub_vault";
export const SESSION_HOURS = 8;
export const VAULT_MINUTES = 10;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET belum diatur");
  return new TextEncoder().encode(s);
}

export async function signToken(payload, expires) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(expires).sign(secret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

// Sesi aktif, atau null untuk pengunjung publik
export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const p = await verifyToken(token);
  if (!p || p.typ !== "session") return null;
  const user = await one("SELECT id, username, name, role, session_version FROM users WHERE id = ?", [p.uid]);
  if (!user || user.session_version !== p.sv) return null;
  return user;
}

export async function vaultOpen(user) {
  const token = cookies().get(VAULT_COOKIE)?.value;
  if (!token || !user) return false;
  const p = await verifyToken(token);
  return !!(p && p.typ === "vault" && p.uid === user.id);
}

export function cookieOptions(maxAgeSeconds) {
  // COOKIE_SECURE=false hanya untuk uji lokal lewat http
  const secure = process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";
  return { httpOnly: true, secure, sameSite: "strict", path: "/", maxAge: maxAgeSeconds };
}

export function clientIp() {
  const h = headers();
  // X-Real-IP diset Nginx dan tidak bisa dipalsukan klien, berbeda dengan X-Forwarded-For
  return h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",").pop().trim() || "local";
}

export const isStaff = (u) => !!u && (u.role === "superadmin" || u.role === "direktur");
export const isAdmin = (u) => !!u && u.role === "superadmin";
