"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./Icon";

const MENU = [
  ["/", "Beranda", "home"],
  ["/web", "Katalog Web", "globe"],
  ["/rencana", "Rencana", "calendar"],
  ["/aktivitas", "Aktivitas", "activity"],
  ["/asisten", "AI Asisten", "sparkles"],
];

// Sorotan tombol memakai kelas dark: agar selalu sesuai tema, bahkan sebelum hidrasi
function ThemeToggle() {
  function set(d) {
    document.documentElement.classList.toggle("dark", d);
    try { localStorage.setItem("theme", d ? "dark" : "light"); } catch {}
  }
  const on = "bg-card text-heading shadow-soft";
  return (
    <div className="grid grid-cols-2 rounded-xl border border-line bg-subtle p-1 text-xs font-semibold">
      <button onClick={() => set(false)} className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-muted transition hover:text-heading ${on} dark:bg-transparent dark:text-muted dark:shadow-none`}>
        <Icon name="sun" className="h-4 w-4" />Terang
      </button>
      <button onClick={() => set(true)} className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-muted transition hover:text-heading dark:bg-card dark:text-heading dark:shadow-soft">
        <Icon name="moon" className="h-4 w-4" />Gelap
      </button>
    </div>
  );
}

export default function Sidebar({ user }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  const initials = user ? user.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() : "";

  const item = (href, label, icon) => (
    <Link key={href} href={href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active(href) ? "bg-brand text-white shadow-soft" : "text-muted hover:bg-subtle hover:text-heading"}`}>
      <Icon name={icon} className={`h-[18px] w-[18px] ${active(href) ? "text-accent-soft" : "text-muted group-hover:text-accent"}`} />
      {label}
    </Link>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-card/90 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-heading hover:bg-subtle" aria-label="Buka menu"><Icon name="menu" /></button>
        <span className="font-bold text-heading">IT Hub <span className="text-accent">POSI</span></span>
      </div>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-card transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#0F2A4A] to-[#25487A] text-sm font-extrabold text-gold-light shadow-soft">IT</div>
          <div className="leading-tight">
            <div className="text-base font-extrabold text-heading">IT Hub</div>
            <div className="text-[11px] font-semibold text-muted">Divisi IT · POSI</div>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto rounded-lg p-1.5 text-muted hover:bg-subtle lg:hidden" aria-label="Tutup menu"><Icon name="close" /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted/80">Menu</div>
          {MENU.map(([h, l, i]) => item(h, l, i))}
          {user?.role === "superadmin" && (
            <>
              <div className="px-3 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted/80">Admin</div>
              {item("/kelola", "Kelola", "settings")}
            </>
          )}
        </nav>
        <div className="space-y-3 border-t border-line p-4">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3 rounded-xl bg-subtle p-2.5">
              <Link href="/akun" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-white">{initials}</Link>
              <Link href="/akun" className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-sm font-semibold text-heading">{user.name}</div>
                <div className="text-[11px] capitalize text-accent">{user.role}</div>
              </Link>
              <button onClick={logout} title="Keluar" className="rounded-lg p-2 text-muted hover:bg-card hover:text-red-500"><Icon name="logout" className="h-4 w-4" /></button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary w-full"><Icon name="login" className="h-4 w-4" />Masuk</Link>
          )}
        </div>
      </aside>
    </>
  );
}
