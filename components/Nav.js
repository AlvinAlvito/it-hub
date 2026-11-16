"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LINKS = [
  ["/", "Beranda"],
  ["/web", "Katalog Web"],
  ["/rencana", "Rencana"],
  ["/aktivitas", "Aktivitas"],
  ["/asisten", "AI Asisten"],
];

export default function Nav({ user }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = user?.role === "superadmin" ? [...LINKS, ["/kelola", "Kelola"]] : LINKS;
  const active = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <header className="sticky top-0 z-30 border-b border-hair bg-white/95 backdrop-blur">
      <div className="wrap flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy font-serif text-lg font-bold text-gold-light">IT</span>
          <span className="leading-tight">
            <span className="block font-serif text-lg text-navy">IT Hub</span>
            <span className="block text-[10px] font-bold tracking-[0.2em] text-gold-dark">POSI</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active(href) ? "bg-navy-soft text-navy" : "text-muted hover:text-navy"}`}>{label}</Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link href="/akun" className="text-right leading-tight">
                <span className="block text-sm font-semibold text-navy">{user.name}</span>
                <span className="block text-[11px] capitalize text-gold-dark">{user.role}</span>
              </Link>
              <button onClick={logout} className="btn-ghost">Keluar</button>
            </>
          ) : (
            <Link href="/login" className="btn-primary">Masuk</Link>
          )}
        </div>
        <button className="ml-auto rounded-lg border border-hair px-3 py-2 text-sm md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
      </div>
      {open && (
        <div className="wrap flex flex-col gap-1 pb-4 md:hidden">
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active(href) ? "bg-navy-soft text-navy" : "text-muted"}`}>{label}</Link>
          ))}
          {user ? (
            <>
              <Link href="/akun" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-muted">Akun saya ({user.name})</Link>
              <button onClick={logout} className="btn-ghost">Keluar</button>
            </>
          ) : (
            <Link href="/login" className="btn-primary">Masuk</Link>
          )}
        </div>
      )}
    </header>
  );
}
