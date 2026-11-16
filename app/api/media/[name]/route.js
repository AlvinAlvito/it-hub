import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm" };

// Menyajikan file unggahan, mendukung Range agar video bisa digeser
export async function GET(req, { params }) {
  const name = path.basename(params.name);
  if (!/^[a-f0-9]{24}\.(png|jpg|webp|gif|mp4|webm)$/.test(name)) return new Response("Not found", { status: 404 });
  const file = path.join(process.env.UPLOAD_DIR || "./uploads", name);
  let stat;
  try { stat = fs.statSync(file); } catch { return new Response("Not found", { status: 404 }); }
  const type = MIME[path.extname(name)];
  const range = req.headers.get("range");
  const base = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=2592000, immutable" };
  if (range) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = Number(s) || 0;
    const end = Math.min(e ? Number(e) : start + 2 * 1024 * 1024 - 1, stat.size - 1);
    const stream = fs.createReadStream(file, { start, end });
    return new Response(stream, { status: 206, headers: { ...base, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(fs.createReadStream(file), { headers: { ...base, "Content-Length": String(stat.size) } });
}
