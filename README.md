# Tarasa Booth — Online Admin & Softfile Web Gallery
### Tarasa Booth Official Cloud Portal

Aplikasi Web mandiri yang siap dideploy ke **Vercel** untuk:
1. 📲 **Galeri Softfile Publik**: Pengunjung dapat mengunduh foto struk 4R HD, Video MP4 16:9, dan foto satuan dari smartphone mereka dari mana saja via QR Code (tidak perlu satu Wi-Fi).
2. 🛡️ **Panel Admin Online**: Pantau seluruh sesi foto real-time, kelola voucher cloud, dan unduh/hapus softfile.
3. 🧹 **24-Hour Auto-Cleanup (Supabase Garbage Collector)**: File foto dan video di Supabase Storage otomatis dihapus setelah 24 jam untuk menjaga kuota storage Supabase tetap hemat dan efisien.

---

## 🚀 Panduan Deploy ke Vercel (2 Menit)

### Cara 1: Menggunakan Vercel Dashboard (Rekomendasi)
1. Push repository ini ke GitHub Anda.
2. Buka [https://vercel.com](https://vercel.com) dan klik **"Add New Project"**.
3. Pilih repository GitHub Anda.
4. Pada bagian **Root Directory**, klik **Edit** dan pilih folder: `admin-web`.
5. Buka tab **Environment Variables** dan tambahkan variabel berikut:
   ```env
   SUPABASE_URL=https://rifcawifuojzercjauhy.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_BUCKET=pbak-assets
   ADMIN_PIN=1234
   RETENTION_HOURS=24
   ```
6. Klik tombol **Deploy**.
7. Setelah selesai, Anda akan mendapatkan URL Vercel (misal: `https://photobooth-jobfair-uin.vercel.app`).

### Cara 2: Menggunakan Vercel CLI
```bash
cd admin-web
npx vercel
```

---

## 🔗 Hubungkan ke Laptop Photobooth (Kiosk)

Setelah deploy di Vercel:
1. Salin domain Vercel Anda (contoh: `https://photobooth-jobfair-uin.vercel.app`).
2. Buka file `.env.local` di laptop Photobooth (folder utama), tambahkan:
   ```env
   PUBLIC_GALLERY_DOMAIN=https://photobooth-jobfair-uin.vercel.app
   ```
3. Selesai! Sekarang setiap sesi foto selesai, QR Code di layar Kiosk akan otomatis membuat link ke galeri Vercel Anda, dan pengunjung bisa langsung scan & download dari HP mereka dengan jaringan seluler apa saja!

---

## ⏱️ Auto-Cleanup 24 Jam
- **Vercel Cron** (`vercel.json`) menjalankan `/api/cron/cleanup` setiap jam secara otomatis.
- Di Panel Admin (`/admin`), Anda juga bisa memicu tombol **"🧹 Bersihkan File > 24 Jam Sekarang"** kapan saja secara manual.
