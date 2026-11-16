import crypto from "crypto";
import { syncGithub } from "@/lib/github";
import { getSession, isAdmin } from "@/lib/auth";
import { json, sameOrigin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function cronOk(req) {
  const s = process.env.CRON_SECRET || "";
  const h = req.headers.get("x-cron-secret") || "";
  return s.length >= 16 && h.length === s.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(s));
}

export async function POST(req) {
  if (!cronOk(req)) {
    if (!sameOrigin(req)) return json({ error: "Origin tidak valid" }, 403);
    if (!isAdmin(await getSession())) return json({ error: "Khusus superadmin" }, 403);
  }
  try {
    return json({ ok: true, ...(await syncGithub()) });
  } catch (e) {
    return json({ error: String(e.message || e) }, 500);
  }
}
