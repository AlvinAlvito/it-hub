import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap grid min-h-[60vh] place-items-center text-center">
      <div>
        <div className="kicker">404</div>
        <h1 className="mt-2 text-3xl">Halaman tidak ditemukan</h1>
        <Link href="/" className="btn-primary mt-6">Kembali ke beranda</Link>
      </div>
    </div>
  );
}
