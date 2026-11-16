import { one, q } from "@/lib/db";
import { getSession, isAdmin, clientIp } from "@/lib/auth";
import { getActivity, getWebs, repoNameMap } from "@/lib/data";
import { rangeFor, todayWIB } from "@/lib/dates";
import { groqChat } from "@/lib/groq";
import { json, rateLimit, sameOrigin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Ringkasan AI untuk satu periode, disimpan agar tidak dihitung ulang
export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: "Origin tidak valid" }, 403);
  const { view = "week", date, force } = await req.json().catch(() => ({}));
  if (!["day", "week", "month"].includes(view) || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return json({ error: "Periode tidak valid" }, 400);
  const [a, b] = rangeFor(view, date);
  const key = `${a}_${b}`;
  const user = await getSession();
  const { commits, acts } = await getActivity(a, b);
  const total = commits.length + acts.length;
  const cached = await one("SELECT content, source_count FROM summaries WHERE period_type = ? AND period_key = ?", [view, key]);
  const stale = cached && cached.source_count !== total && b >= todayWIB();
  if (cached && !stale && !(force && isAdmin(user))) return json({ content: cached.content, cached: true });
  if (!total) return json({ content: "Belum ada aktivitas tercatat pada periode ini." });
  if (!rateLimit("sum:" + (user ? user.id : clientIp()), 15, 60 * 60 * 1000)) return json({ error: "Terlalu sering. Coba lagi nanti." }, 429);
  const map = repoNameMap(await getWebs());
  const lines = [
    ...commits.map((c) => `${c.committed_at.slice(0, 10)} | ${map[c.repo] || c.repo} | ${c.message.split("\n")[0].slice(0, 160)}`),
    ...acts.map((x) => `${x.date} | aktivitas ${x.category} | ${x.title}${x.detail ? " | " + x.detail.slice(0, 200) : ""}`),
  ];
  try {
    const content = await groqChat([
      { role: "system", content: "Kamu menulis laporan kerja divisi IT POSI untuk Direktur. Bahasa Indonesia, ringkas, non-teknis. Kelompokkan per web atau proyek dengan judul tebal (**Nama**), lalu poin-poin hasil kerja dalam bahasa sehari-hari. Gabungkan commit yang mirip. Akhiri dengan satu kalimat ringkasan. Jangan mengarang di luar data." },
      { role: "user", content: `Periode ${a} s.d. ${b}. Data (${commits.length} commit GitHub, ${acts.length} aktivitas manual):\n` + lines.slice(0, 200).join("\n") },
    ], { maxTokens: 3000 });
    await q("INSERT INTO summaries (period_type, period_key, content, source_count) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content), source_count = VALUES(source_count), created_at = NOW()", [view, key, content, total]);
    return json({ content });
  } catch (e) {
    return json({ error: "AI gagal: " + String(e.message || e).slice(0, 200) }, 502);
  }
}
