import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TABS = [["/kelola", "Ringkasan"], ["/kelola/web", "Web dan akun"], ["/kelola/rencana", "Rencana dan tugas"], ["/kelola/aktivitas", "Aktivitas manual"]];

export default async function KelolaLayout({ children }) {
  const user = await getSession();
  if (!isAdmin(user)) redirect("/login");
  return (
    <div className="wrap pt-8">
      <div className="kicker">Superadmin</div>
      <h1 className="mt-1 text-3xl">Kelola IT Hub</h1>
      <nav className="mt-4 flex flex-wrap gap-2 border-b border-hair pb-3">
        {TABS.map(([h, l]) => <Link key={h} href={h} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-navy-soft hover:text-navy">{l}</Link>)}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
