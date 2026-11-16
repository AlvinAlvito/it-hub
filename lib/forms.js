// Definisi kolom formulir di menu Kelola
export const WEB_FIELDS = [
  { name: "name", label: "Nama web", required: true },
  { name: "slug", label: "Slug (untuk alamat halaman)", required: true, placeholder: "contoh: hris" },
  { name: "url", label: "Alamat web", placeholder: "https://..." },
  { name: "category", label: "Kategori", placeholder: "Kompetisi, SDM, Penjualan, ..." },
  { name: "status", label: "Status", type: "select", options: [["aktif", "Aktif"], ["pengembangan", "Pengembangan"], ["rencana", "Rencana"], ["nonaktif", "Nonaktif"]], default: "aktif" },
  { name: "repo", label: "Repo GitHub (pisahkan koma)", placeholder: "hris, project-scan", hint: "Perubahan kode di repo ini otomatis masuk riwayat update." },
  { name: "tech", label: "Teknologi", wide: true },
  { name: "summary", label: "Ringkasan", type: "textarea" },
  { name: "fungsi", label: "Fungsi (satu poin per baris)", type: "textarea" },
  { name: "cara_pakai", label: "Cara pakai (satu langkah per baris)", type: "textarea" },
  { name: "sort", label: "Urutan", type: "number", default: 0 },
];

export const ACCOUNT_FIELDS = [
  { name: "role_name", label: "Peran / level akun", required: true, placeholder: "Superadmin, Admin, Peserta, ..." },
  { name: "username", label: "Username atau email" },
  { name: "password", label: "Password", type: "password", hint: "Disimpan terenkripsi. Kosongkan saat mengubah bila tidak ingin mengganti." },
  { name: "holder", label: "Pemegang akun" },
  { name: "login_url", label: "Halaman login", placeholder: "https://..." },
  { name: "sort", label: "Urutan", type: "number", default: 0 },
  { name: "fungsi", label: "Fungsi akun", type: "textarea" },
  { name: "note", label: "Catatan", type: "textarea" },
];

export const UPDATE_FIELDS = [
  { name: "date", label: "Tanggal", type: "date", required: true },
  { name: "title", label: "Judul update", required: true },
  { name: "detail", label: "Detail", type: "textarea" },
];

export const MEDIA_FIELDS = [
  { name: "caption", label: "Keterangan", wide: true },
  { name: "section", label: "Bagian", type: "select", options: [["slider", "Slider gambar"], ["galeri", "Galeri gambar"], ["video", "Galeri video"]], hint: "Gambar hanya untuk slider/galeri; video hanya untuk galeri video." },
  { name: "sort", label: "Urutan", type: "number" },
];

export const PROJECT_STATUS =[["rencana", "Rencana"], ["berjalan", "Berjalan"], ["selesai", "Selesai"], ["tertunda", "Tertunda"]];
export const TASK_STATUS = [["belum", "Belum"], ["berjalan", "Berjalan"], ["selesai", "Selesai"], ["tertunda", "Tertunda"]];

export const PROJECT_FIELDS = [
  { name: "name", label: "Nama proyek", required: true },
  { name: "slug", label: "Slug", required: true },
  { name: "start_date", label: "Mulai", type: "date", required: true },
  { name: "end_date", label: "Selesai", type: "date", required: true },
  { name: "category", label: "Kategori", type: "select", options: [["internal", "Sistem internal"], ["posi", "posi.id dan penjualan"], ["produk", "Produk dan bisnis baru"]], default: "internal" },
  { name: "status", label: "Status", type: "select", options: PROJECT_STATUS, default: "rencana" },
  { name: "progress", label: "Progres (%)", type: "number", default: 0 },
  { name: "repos", label: "Repo GitHub terkait (pisahkan koma)" },
  { name: "masalah", label: "Masalah", type: "textarea" },
  { name: "solusi", label: "Solusi", type: "textarea" },
  { name: "tujuan", label: "Tujuan", type: "textarea" },
  { name: "manfaat", label: "Manfaat", type: "textarea" },
  { name: "output", label: "Output", type: "textarea" },
];

export const TASK_FIELDS = [
  { name: "title", label: "Tugas", required: true, wide: true },
  { name: "start_date", label: "Mulai", type: "date" },
  { name: "end_date", label: "Selesai", type: "date" },
  { name: "status", label: "Status", type: "select", options: TASK_STATUS, default: "belum" },
];

export function activityFields(projects, today) {
  return [
    { name: "date", label: "Tanggal", type: "date", required: true, default: today },
    { name: "category", label: "Jenis", type: "select", options: ACT_CATEGORIES, default: "koordinasi" },
    { name: "title", label: "Apa yang dikerjakan", required: true, wide: true },
    { name: "duration_min", label: "Durasi (menit)", type: "number" },
    { name: "project_id", label: "Proyek terkait", type: "select", options: [["", "Tidak ada"], ...projects.map((p) => [String(p.id), p.name])] },
    { name: "detail", label: "Detail", type: "textarea" },
  ];
}

export const ACT_CATEGORIES =[["koordinasi", "Koordinasi"], ["rapat", "Rapat"], ["strategi", "Strategi"], ["support", "IT support"], ["standby", "Standby event"], ["operasional", "Backup operasional"], ["lainnya", "Lainnya"]];
