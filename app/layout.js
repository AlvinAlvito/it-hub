import "./globals.css";
import Nav from "@/components/Nav";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "IT Hub POSI",
  description: "Katalog web, rencana kerja, dan jejak pekerjaan divisi IT POSI",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }) {
  const user = await getSession().catch(() => null);
  return (
    <html lang="id">
      <body>
        <Nav user={user ? { name: user.name, role: user.role, id: user.id } : null} />
        <main className="pb-16">{children}</main>
        <footer className="wrap border-t border-hair py-6 text-xs text-muted">IT Hub POSI · Divisi IT · Data internal Yayasan Pendidikan POSI</footer>
      </body>
    </html>
  );
}
