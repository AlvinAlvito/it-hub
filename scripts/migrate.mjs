// Membuat tabel dan mengisi data awal. Aman dijalankan berulang: data hanya diisi bila tabel kosong.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { WEBS, PROJECTS } from "./seed-data.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const db = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1", port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME,
  multipleStatements: true, charset: "utf8mb4",
});

await db.query(fs.readFileSync(path.join(dir, "schema.sql"), "utf8"));
console.log("Tabel siap.");

const count = async (t) => (await db.query(`SELECT COUNT(*) AS n FROM ${t}`))[0][0].n;
const randPass = () => crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "x");
const randPin = () => String(crypto.randomInt(100000, 999999));

if ((await count("users")) === 0) {
  const users = [
    ["paris", "Paris Alvito", "superadmin"],
    ["bangoji", "Bang Oji", "direktur"],
    ["kakros", "Kak Ros", "direktur"],
  ];
  console.log("\n=== AKUN AWAL (simpan, hanya ditampilkan sekali) ===");
  for (const [u, n, r] of users) {
    const pw = randPass(), pin = randPin();
    await db.query("INSERT INTO users (username, name, role, password_hash, pin_hash) VALUES (?, ?, ?, ?, ?)", [u, n, r, bcrypt.hashSync(pw, 12), bcrypt.hashSync(pin, 12)]);
    console.log(`${r.padEnd(10)} username: ${u.padEnd(8)} password: ${pw}  PIN: ${pin}`);
  }
  console.log("====================================================\n");
}

if ((await count("webs")) === 0) {
  for (const w of WEBS) {
    await db.query("INSERT INTO webs (slug, name, url, category, status, summary, fungsi, cara_pakai, repo, tech, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [w.slug, w.name, w.url, w.category, w.status, w.summary, w.fungsi, w.cara_pakai, w.repo || null, w.tech, w.sort]);
  }
  console.log(`${WEBS.length} web diisi.`);
}

if ((await count("projects")) === 0) {
  let sort = 0;
  for (const p of PROJECTS) {
    const [r] = await db.query("INSERT INTO projects (slug, name, start_date, end_date, category, status, progress, masalah, solusi, tujuan, manfaat, output, repos, sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [p.slug, p.name, p.start, p.end, p.category, p.status, p.progress, p.masalah, p.solusi, p.tujuan, p.manfaat, p.output, p.repos || null, sort++]);
    let ts = 0;
    for (const t of p.tasks) {
      await db.query("INSERT INTO project_tasks (project_id, title, start_date, end_date, status, sort) VALUES (?,?,?,?,?,?)",
        [r.insertId, t.title, t.start, t.end, p.slug === "it-hub" && ts === 0 ? "selesai" : "belum", ts++]);
    }
  }
  console.log(`${PROJECTS.length} proyek diisi.`);
}

await db.end();
console.log("Migrasi selesai.");
