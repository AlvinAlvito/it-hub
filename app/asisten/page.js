import Chat from "@/components/Chat";
import { getSession, isStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Asisten() {
  const user = await getSession();
  return (
    <div className="wrap pt-10">
      <div className="kicker">AI Asisten</div>
      <h1 className="mt-1 text-3xl md:text-4xl">Tanya apa saja soal pekerjaan IT</h1>
      <p className="mt-2 max-w-3xl text-muted">AI membaca isi IT Hub: daftar web, rencana kerja, perubahan kode dari GitHub, dan aktivitas yang dicatat. {isStaff(user) ? "Anda login sebagai pimpinan, jadi AI juga mengetahui daftar akun (tanpa password)." : "Login untuk pertanyaan yang lebih lengkap."}</p>
      <div className="mt-6"><Chat /></div>
    </div>
  );
}
