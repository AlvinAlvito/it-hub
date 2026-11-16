# IT Hub POSI

Katalog web POSI, rencana kerja, jejak pekerjaan dari GitHub, dan AI Asisten untuk pimpinan.

- **Publik (tanpa login):** katalog web, rencana, aktivitas, AI Asisten. Akun tidak terlihat.
- **Direktur:** semua isi, termasuk daftar akun. Password hanya tampil setelah PIN.
- **Superadmin:** mengelola semua konten di menu Kelola.

## Menjalankan lokal

```bash
cp .env.example .env.local   # isi DB, AUTH_SECRET, VAULT_KEY, GROQ_API_KEY
npm install
npm run migrate              # membuat tabel dan akun awal (dicetak sekali)
npm run dev                  # http://localhost:3070
```

Untuk uji `next start` lewat http lokal, tambahkan `COOKIE_SECURE=false` di `.env.local`.

## Keamanan

- Password akun web disimpan terenkripsi AES-256-GCM dengan `VAULT_KEY`. Kehilangan kunci ini berarti password tidak bisa dibuka lagi.
- Melihat password butuh login dan PIN 6 angka; brankas terbuka 10 menit, setiap password tampil 30 detik, dan setiap akses tercatat di log.
- Login dan PIN terkunci 15 menit setelah 5 kali salah.
- Password tidak pernah dikirim ke AI.

## Sinkron GitHub

`POST /api/sync/github` dengan header `x-cron-secret: <CRON_SECRET>`. Tanpa `GITHUB_TOKEN` hanya repo publik yang terbaca.
