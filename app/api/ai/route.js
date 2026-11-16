import { getSession, isStaff, isAdmin, clientIp } from "@/lib/auth";
import { aiContext } from "@/lib/data";
import { groqMessage } from "@/lib/groq";
import { AI_TOOLS, runOperation } from "@/lib/aiTools";
import { json, rateLimit, sameOrigin } from "@/lib/guard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RULES = `Kamu adalah AI Asisten IT Hub POSI. Tugasmu menjawab pertanyaan pimpinan dan karyawan POSI tentang pekerjaan divisi IT (dikerjakan Paris Alvito): web yang dikelola, rencana kerja, progres, dan aktivitas dari GitHub serta catatan manual.
Aturan:
- Jawab dalam bahasa Indonesia yang ringkas dan mudah dipahami orang non-teknis. Terjemahkan istilah teknis dan pesan commit ke bahasa sehari-hari.
- Jawab HANYA dari DATA di bawah. Jika datanya tidak ada, katakan terus terang. Jangan mengarang angka.
- Jangan pernah menampilkan atau menebak password. Password tidak ada di data.
- Gunakan poin-poin bila daftar. Sebut tanggal bila relevan.
- Jika grafik membantu (misalnya jumlah pekerjaan per hari, per web, atau progres proyek), tambahkan SATU blok grafik di akhir jawaban dengan format persis:
\`\`\`chart
{"type":"bar","title":"Judul grafik","labels":["A","B"],"values":[1,2]}
\`\`\`
type boleh "bar" atau "line". labels dan values harus sama panjang, values berupa angka.`;

const READ_ONLY = `
- Kamu HANYA bisa membaca data. Jika pengguna meminta menambah, mengubah, atau menghapus data, jelaskan dengan sopan bahwa perubahan hanya bisa dilakukan oleh superadmin (Paris Alvito).`;

const ADMIN = `
- Pengguna ini SUPERADMIN. Kamu boleh mengubah data memakai alat ubah_data.
- Pakai alat HANYA bila pengguna jelas meminta perubahan (contoh: "ganti", "ubah", "geser", "tandai selesai", "tambahkan", "catat", "hapus"). Untuk pertanyaan biasa, cukup jawab.
- Setiap data di DATA punya tanda #id. Pakai id itu persis; jangan menebak id. Bila yang dimaksud pengguna ambigu (lebih dari satu kandidat), tanyakan dulu tanpa memanggil alat.
- "Minggu ini", "minggu depan", "minggu ke-N bulan X" dihitung dari tanggal hari ini di DATA. Tanggal selalu YYYY-MM-DD.
- Satu permintaan boleh berisi beberapa perubahan; masukkan semuanya ke operations dalam SATU panggilan ubah_data.
- Hapus tidak langsung terjadi: pengguna harus menekan tombol konfirmasi.`;

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: "Origin tidak valid" }, 403);
  const user = await getSession();
  const ip = clientIp();
  const admin = isAdmin(user);
  const limit = isStaff(user) ? 60 : 10;
  if (!rateLimit("ai:" + (user ? "u" + user.id : ip), limit, 60 * 60 * 1000)) return json({ error: "Batas pertanyaan per jam tercapai. Coba lagi nanti." }, 429);
  const { messages } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || !messages.length) return json({ error: "Pertanyaan kosong" }, 400);
  const history = messages.slice(-6).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 2000) }));
  try {
    const context = await aiContext(isStaff(user) ? user : null);
    const system = { role: "system", content: RULES + (admin ? ADMIN : READ_ONLY) + "\n\n=== DATA ===\n" + context };
    // Alat ubah data hanya dikirim untuk superadmin; direktur dan publik tidak pernah mendapatkannya.
    const msg = await groqMessage([system, ...history], admin ? { tools: AI_TOOLS } : {});
    const calls = admin ? (msg.tool_calls || []).slice(0, 10) : [];
    if (!calls.length) return json({ answer: msg.content || "" });

    const results = [];
    for (const c of calls) {
      let args = {};
      try { args = JSON.parse(c.function?.arguments || "{}"); } catch {}
      const ops = Array.isArray(args.operations) ? args.operations : [args];
      for (const op of ops.slice(0, 15)) results.push(await runOperation(op, user, ip));
    }
    const changes = results.filter((r) => r.ok && !r.pending);
    const pending = results.filter((r) => r.pending).map((r) => ({ entity: r.entity, id: r.id, label: r.label }));
    const failed = results.filter((r) => !r.ok).map((r) => r.error);
    // Laporan dibuat dari hasil database langsung (tanpa panggilan AI kedua): hemat kuota dan tidak bisa mengarang.
    const parts = [];
    if (msg.content) parts.push(msg.content);
    parts.push(changes.length ? `Selesai, ${changes.length} perubahan disimpan.` : failed.length ? "Tidak ada perubahan yang tersimpan." : "");
    if (failed.length) parts.push(`${failed.length} perubahan gagal, lihat rinciannya di bawah.`);
    if (pending.length) parts.push(`${pending.length} penghapusan menunggu konfirmasi Anda. Tekan **Ya, hapus** untuk melanjutkan.`);
    const answer = parts.filter(Boolean).join("\n\n");
    return json({ answer, changes, pending, failed });
  } catch (e) {
    return json({ error: String(e.message || e).slice(0, 220) }, 502);
  }
}
