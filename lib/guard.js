import { NextResponse } from "next/server";
import { getSession, isAdmin, isStaff } from "./auth";

const hits = globalThis.__ithubHits || (globalThis.__ithubHits = new Map());

// Batas permintaan sederhana per kunci (IP + aksi) dalam jendela waktu
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length <= max;
}

// Tolak permintaan ubah data dari situs lain
export function sameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export async function requireAdmin(req) {
  if (req && !sameOrigin(req)) return { error: json({ error: "Origin tidak valid" }, 403) };
  const user = await getSession();
  if (!isAdmin(user)) return { error: json({ error: "Khusus superadmin" }, 403) };
  return { user };
}

export async function requireStaff(req) {
  if (req && !sameOrigin(req)) return { error: json({ error: "Origin tidak valid" }, 403) };
  const user = await getSession();
  if (!isStaff(user)) return { error: json({ error: "Perlu login" }, 401) };
  return { user };
}
