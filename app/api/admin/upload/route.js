import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { q, audit } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { json, requireAdmin } from "@/lib/guard";

export const dynamic = "force-dynamic";

const TYPES = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif", "video/mp4": ".mp4", "video/webm": ".webm" };
const MAX = 250 * 1024 * 1024;

function youtubeId(url) {
  const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export async function POST(req) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;
  const form = await req.formData();
  const webId = Number(form.get("web_id"));
  const caption = String(form.get("caption") || "").slice(0, 250) || null;
  const section = ["slider", "galeri", "video"].includes(form.get("section")) ? form.get("section") : "galeri";
  if (!webId) return json({ error: "web_id wajib" }, 400);
  const yt = form.get("youtube");
  if (yt) {
    if (section !== "video") return json({ error: "Link YouTube hanya untuk galeri video" }, 400);
    const id = youtubeId(yt);
    if (!id) return json({ error: "Link YouTube tidak valid" }, 400);
    await q("INSERT INTO web_media (web_id, type, section, path, caption) VALUES (?, 'youtube', 'video', ?, ?)", [webId, id, caption]);
    return json({ ok: true });
  }
  const file = form.get("file");
  if (!file || typeof file === "string") return json({ error: "Pilih file" }, 400);
  const ext = TYPES[file.type];
  if (!ext) return json({ error: "Format harus PNG, JPG, WEBP, GIF, MP4, atau WEBM" }, 400);
  const isVideo = file.type.startsWith("video");
  if (isVideo !== (section === "video")) return json({ error: section === "video" ? "Galeri video hanya menerima MP4 atau WEBM" : "Slider dan galeri hanya menerima gambar" }, 400);
  if (file.size > MAX) return json({ error: "Ukuran maksimal 250 MB" }, 400);
  const dir = process.env.UPLOAD_DIR || "./uploads";
  await fs.mkdir(dir, { recursive: true });
  const name = crypto.randomBytes(12).toString("hex") + ext;
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  await q("INSERT INTO web_media (web_id, type, section, path, caption) VALUES (?, ?, ?, ?, ?)", [webId, isVideo ? "video" : "image", section, name, caption]);
  await audit(user.id, "unggah_media", name, clientIp());
  return json({ ok: true });
}
