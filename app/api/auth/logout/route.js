import { cookies } from "next/headers";
import { SESSION_COOKIE, VAULT_COOKIE } from "@/lib/auth";
import { json, sameOrigin } from "@/lib/guard";

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: "Origin tidak valid" }, 403);
  cookies().delete(SESSION_COOKIE);
  cookies().delete(VAULT_COOKIE);
  return json({ ok: true });
}
