import { getSession, isStaff, clientIp } from "@/lib/auth";
import { aiContext } from "@/lib/data";
import { groqChat } from "@/lib/groq";
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

export async function POST(req) {
  if (!sameOrigin(req)) return json({ error: "Origin tidak valid" }, 403);
  const user = await getSession();
  const ip = clientIp();
  const limit = isStaff(user) ? 60 : 10;
  if (!rateLimit("ai:" + (user ? "u" + user.id : ip), limit, 60 * 60 * 1000)) return json({ error: "Batas pertanyaan per jam tercapai. Coba lagi nanti." }, 429);
  const { messages } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || !messages.length) return json({ error: "Pertanyaan kosong" }, 400);
  const history = messages.slice(-6).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 2000) }));
  try {
    const context = await aiContext(isStaff(user) ? user : null);
    const answer = await groqChat([{ role: "system", content: RULES + "\n\n=== DATA ===\n" + context }, ...history]);
    return json({ answer });
  } catch (e) {
    return json({ error: String(e.message || e).slice(0, 220) }, 502);
  }
}
