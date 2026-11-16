import { q, one } from "./db";
import { todayWIB, addDays, rangeFor } from "./dates";

export const repoList = (s) => (s || "").split(",").map((x) => x.trim().split("/").pop()).filter(Boolean);

export async function getWebs() {
  const webs = await q("SELECT * FROM webs ORDER BY sort, name");
  const updates = await q("SELECT web_id, MAX(date) AS d FROM web_updates GROUP BY web_id");
  const commits = await q("SELECT repo, MAX(committed_at) AS d, COUNT(*) AS n FROM commits GROUP BY repo");
  const media = await q("SELECT web_id, MIN(id) AS id FROM web_media WHERE type = 'image' GROUP BY web_id");
  const thumbs = media.length ? await q(`SELECT id, web_id, path FROM web_media WHERE id IN (${media.map(() => "?").join(",")})`, media.map((m) => m.id)) : [];
  return webs.map((w) => {
    const repos = repoList(w.repo);
    const cs = commits.filter((c) => repos.includes(c.repo));
    const dates = [updates.find((u) => u.web_id === w.id)?.d, ...cs.map((c) => c.d?.slice(0, 10))].filter(Boolean).sort();
    return { ...w, last_update: dates.pop() || null, commit_count: cs.reduce((a, c) => a + Number(c.n), 0), thumb: thumbs.find((t) => t.web_id === w.id)?.path || null };
  });
}

export async function getWeb(slug, withAccounts) {
  const web = await one("SELECT * FROM webs WHERE slug = ?", [slug]);
  if (!web) return null;
  const repos = repoList(web.repo);
  const [media, updates, commits, accounts] = await Promise.all([
    q("SELECT * FROM web_media WHERE web_id = ? ORDER BY sort, id", [web.id]),
    q("SELECT * FROM web_updates WHERE web_id = ? ORDER BY date DESC, id DESC", [web.id]),
    repos.length ? q(`SELECT * FROM commits WHERE repo IN (${repos.map(() => "?").join(",")}) ORDER BY committed_at DESC LIMIT 40`, repos) : [],
    withAccounts ? q("SELECT id, role_name, username, fungsi, holder, login_url, note, (password_enc IS NOT NULL) AS has_password, updated_at FROM web_accounts WHERE web_id = ? ORDER BY sort, id", [web.id]) : [],
  ]);
  return { web, media, updates, commits, accounts };
}

export async function getProjects() {
  const projects = await q("SELECT * FROM projects ORDER BY start_date, sort");
  const tasks = await q("SELECT * FROM project_tasks ORDER BY start_date, sort, id");
  return projects.map((p) => ({ ...p, tasks: tasks.filter((t) => t.project_id === p.id) }));
}

export async function getActivity(a, b) {
  const [commits, acts] = await Promise.all([
    q("SELECT * FROM commits WHERE committed_at BETWEEN ? AND ? ORDER BY committed_at DESC", [a + " 00:00:00", b + " 23:59:59"]),
    q("SELECT a.*, p.name AS project_name FROM activities a LEFT JOIN projects p ON p.id = a.project_id WHERE a.date BETWEEN ? AND ? ORDER BY a.date DESC, a.id DESC", [a, b]),
  ]);
  return { commits, acts };
}

export function repoNameMap(webs) {
  const m = {};
  for (const w of webs) for (const r of repoList(w.repo)) m[r] = w.name;
  return m;
}

// Konteks untuk AI Asisten. Password tidak pernah ikut dikirim.
export async function aiContext(user) {
  const today = todayWIB();
  const [webs, projects] = await Promise.all([getWebs(), getProjects()]);
  const map = repoNameMap(webs);
  const since = addDays(today, -60);
  const { commits, acts } = await getActivity(since, today);
  const accounts = user ? await q("SELECT w.name AS web, a.role_name, a.username, a.fungsi, a.holder FROM web_accounts a JOIN webs w ON w.id = a.web_id ORDER BY w.name") : [];
  const [ws, we] = rangeFor("week", today);
  const id = (x) => (user ? `#${x.id} ` : "");
  const lines = [];
  lines.push(`Hari ini: ${today} (WIB). Minggu ini: ${ws} s.d. ${we}.`);
  lines.push(`Pengguna yang bertanya: ${user ? `${user.name} (${user.role})` : "pengunjung publik (tanpa akses data akun)"}.`);
  lines.push("\n## Daftar web yang dikelola IT (Paris Alvito)");
  for (const w of webs) lines.push(`- ${id(w)}${w.name} | ${w.url || "-"} | ${w.status} | repo ${w.repo || "-"} | update ${w.last_update || "-"} | ${(w.summary || "").slice(0, 140)}`);
  if (user) {
    lines.push("\n## Akun per web (tanpa password)");
    for (const a of accounts) lines.push(`- ${a.web}: ${a.role_name} | username ${a.username || "-"} | pemegang ${a.holder || "-"} | ${a.fungsi || ""}`);
  }
  lines.push("\n## Rencana kerja (proyek dan tugas)");
  for (const p of projects) {
    lines.push(`- ${id(p)}[${p.status} ${p.progress}%] ${p.name} (${p.start_date}..${p.end_date}). Tujuan: ${(p.tujuan || "-").slice(0, 120)}`);
    for (const t of p.tasks) lines.push(`  • ${id(t)}${t.title} (${t.start_date || "?"}..${t.end_date || "?"}) ${t.status}`);
  }
  // Rekap jumlah commit per hari per web untuk 60 hari, lalu rincian pesan 14 hari terakhir (hemat token)
  const perDay = {};
  for (const c of commits) {
    const k = c.committed_at.slice(0, 10);
    const w = map[c.repo] || c.repo;
    perDay[k] = perDay[k] || {};
    perDay[k][w] = (perDay[k][w] || 0) + 1;
  }
  lines.push(`\n## Rekap commit GitHub per hari, 60 hari terakhir (total ${commits.length})`);
  for (const [d, ws2] of Object.entries(perDay)) lines.push(`- ${d}: ${Object.entries(ws2).map(([w, n]) => `${w} ${n}`).join(", ")}`);
  const recent = commits.filter((c) => c.committed_at >= addDays(today, -7));
  lines.push(`\n## Rincian commit 7 hari terakhir (${recent.length}, terbaru dulu, maks 60)`);
  for (const c of recent.slice(0, 60)) lines.push(`- ${c.committed_at.slice(0, 16)} | ${map[c.repo] || c.repo} | ${c.message.split("\n")[0].slice(0, 90)}`);
  lines.push("\n## Aktivitas manual (koordinasi, rapat, strategi, support)");
  for (const a of acts.slice(0, 80)) lines.push(`- ${id(a)}${a.date} | ${a.category} | ${a.title}${a.duration_min ? ` (${a.duration_min} menit)` : ""}${a.detail ? ` | ${a.detail.slice(0, 120)}` : ""}`);
  if (user) {
    const ups = await q("SELECT u.id, u.date, u.title, w.name AS web FROM web_updates u JOIN webs w ON w.id = u.web_id ORDER BY u.date DESC, u.id DESC LIMIT 30");
    lines.push("\n## Riwayat update web manual (30 terbaru)");
    for (const u of ups) lines.push(`- ${id(u)}${u.date} | ${u.web} | ${u.title}`);
  }
  return lines.join("\n");
}
