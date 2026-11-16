import { q, getSetting, setSetting } from "./db";
import { toWIB, addDays, todayWIB } from "./dates";

const API = "https://api.github.com";

function headers() {
  const h = { Accept: "application/vnd.github+json", "User-Agent": "it-hub-posi", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function gh(path) {
  const r = await fetch(API + path, { headers: headers(), cache: "no-store" });
  if (r.status === 409) return []; // repo kosong
  if (!r.ok) throw new Error(`GitHub ${r.status} untuk ${path}`);
  return r.json();
}

async function listRepos() {
  const user = process.env.GITHUB_USER;
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const path = process.env.GITHUB_TOKEN
      ? `/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member`
      : `/users/${user}/repos?per_page=100&page=${page}&sort=pushed`;
    const batch = await gh(path);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

function isMine(c) {
  const user = (process.env.GITHUB_USER || "").toLowerCase();
  const emails = (process.env.GITHUB_EMAILS || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  const login = (c.author?.login || c.committer?.login || "").toLowerCase();
  const email = (c.commit?.author?.email || "").toLowerCase();
  return login === user || emails.includes(email);
}

// Ambil commit milik pengguna sejak sinkron terakhir (default 120 hari ke belakang)
export async function syncGithub() {
  const last = await getSetting("github_last_sync");
  const sinceDate = last ? addDays(last.slice(0, 10), -2) : addDays(todayWIB(), -120);
  const since = new Date(sinceDate + "T00:00:00+07:00").toISOString();
  const repos = await listRepos();
  let added = 0, scanned = 0;
  for (const repo of repos) {
    if (repo.pushed_at && repo.pushed_at < since) continue;
    scanned++;
    for (let page = 1; page <= 10; page++) {
      const commits = await gh(`/repos/${repo.full_name}/commits?since=${since}&per_page=100&page=${page}`);
      for (const c of commits) {
        if (!isMine(c)) continue;
        if ((c.parents || []).length > 1) continue; // lewati merge commit
        const msg = (c.commit?.message || "").trim();
        const res = await q(
          "INSERT IGNORE INTO commits (sha, repo, message, author, committed_at, url) VALUES (?, ?, ?, ?, ?, ?)",
          [c.sha, repo.name, msg.slice(0, 2000), c.commit?.author?.name || "", toWIB(c.commit?.author?.date || c.commit?.committer?.date), c.html_url]
        );
        added += res.affectedRows || 0;
      }
      if (commits.length < 100) break;
    }
  }
  const now = new Date().toISOString();
  await setSetting("github_last_sync", now);
  await setSetting("github_last_result", JSON.stringify({ at: now, repos: repos.length, scanned, added, token: !!process.env.GITHUB_TOKEN }));
  return { repos: repos.length, scanned, added, token: !!process.env.GITHUB_TOKEN };
}
