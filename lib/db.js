import mysql from "mysql2/promise";

const g = globalThis;

export function pool() {
  if (!g.__ithubPool) {
    g.__ithubPool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 8,
      dateStrings: true,
      charset: "utf8mb4",
    });
  }
  return g.__ithubPool;
}

export async function q(sql, params = []) {
  const [rows] = await pool().query(sql, params);
  return rows;
}

export async function one(sql, params = []) {
  const rows = await q(sql, params);
  return rows[0] || null;
}

export async function getSetting(key, fallback = null) {
  const r = await one("SELECT v FROM settings WHERE k = ?", [key]);
  return r ? r.v : fallback;
}

export async function setSetting(key, value) {
  await q("INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)", [key, String(value)]);
}

export async function audit(userId, action, target, ip) {
  await q("INSERT INTO audit_log (user_id, action, target, ip) VALUES (?, ?, ?, ?)", [userId || null, action, target || null, ip || null]);
}
