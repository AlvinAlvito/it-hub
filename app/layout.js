import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import { getSession } from "@/lib/auth";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata = {
  title: "IT Hub POSI",
  description: "Katalog web, rencana kerja, dan jejak pekerjaan divisi IT POSI",
  robots: { index: false, follow: false },
};

// Pasang tema sebelum halaman tampil agar tidak berkedip
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default async function RootLayout({ children }) {
  const user = await getSession().catch(() => null);
  return (
    <html lang="id" className={font.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Sidebar user={user ? { name: user.name, role: user.role, id: user.id } : null} />
        <div className="min-w-0 overflow-x-clip lg:pl-64">
          <main className="min-h-screen pb-16">{children}</main>
          <footer className="wrap border-t border-line py-6 text-xs text-muted">IT Hub POSI · Divisi IT · Data internal Yayasan Pendidikan POSI</footer>
        </div>
      </body>
    </html>
  );
}
