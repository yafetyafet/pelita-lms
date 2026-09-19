# Rencana Pindah ke VPS

Dokumen perencanaan sebelum menyewa VPS. Ditulis 19 September 2026, berdasarkan
pengukuran langsung terhadap sistem yang sedang berjalan — bukan perkiraan.

---

## 1. Kenapa sekarang terasa lambat

Pengukuran ke basis data produksi:

| | Nilai terukur |
| --- | --- |
| Latensi satu kueri ke Supabase | **~143 ms** (rata-rata 5× `SELECT 1`) |
| Ukuran seluruh basis data | **12 MB** |
| Baris terbanyak | 407 `User`, 387 `ClassStudent` |
| Muat halaman siswa di produksi | 0,9 – 1,5 detik |

Penyebabnya **bukan jumlah data** — 12 MB itu sangat kecil, dan kodenya sudah
dioptimalkan (beranda siswa kini 1 permintaan, bukan 6). Penyebab utamanya
**jarak fisik**: setiap kueri harus pulang-pergi Indonesia ↔ Singapura, dan
setiap halaman butuh beberapa kueri.

Dengan Postgres di mesin yang sama, latensi itu turun ke **di bawah 1 ms**.

### Perkiraan setelah pindah

| | Sekarang | VPS Jakarta, DB lokal |
| --- | --- | --- |
| Latensi per kueri | ~143 ms | **< 1 ms** |
| Cold start fungsi | 200 – 800 ms | tidak ada |
| Muat halaman siswa | 0,9 – 1,5 s | **perkiraan 150 – 300 ms** |

> Angka kolom kanan adalah perkiraan berdasarkan hilangnya latensi jaringan dan
> cold start. Belum diukur karena VPS-nya belum ada.

---

## 2. Spesifikasi yang dibutuhkan

Untuk 387 siswa, dengan asumsi ujian dijalankan per sesi (1–2 rombel, sekitar
**40–70 siswa serentak**):

| Komponen | Rekomendasi | Alasan |
| --- | --- | --- |
| vCPU | **2** | Next.js SSR + Postgres pada beban ini ringan |
| RAM | **4 GB** | 1 GB Node, 1 GB Postgres, sisanya cache sistem |
| Disk | **40–60 GB SSD NVMe** | DB hanya 12 MB; ruang habis untuk OS, log, backup |
| Lokasi | **Jakarta** | Ini yang paling menentukan kecepatan |
| OS | Ubuntu 22.04 / 24.04 LTS | Dukungan panjang, dokumentasi melimpah |

**Jangan pilih VPS di Singapura atau luar negeri** hanya karena lebih murah —
itu mengembalikan masalah latensi yang justru ingin diselesaikan.

Penyedia dalam negeri yang umum: Biznet Gio, IDCloudHost, Dewaweb, Rumahweb.
Kalau memakai DigitalOcean/Vultr, tidak ada region Indonesia — Singapura adalah
yang terdekat (~10–30 ms dari Jawa, masih jauh lebih baik daripada sekarang
karena DB-nya ikut pindah ke mesin yang sama).

### Kalau ingin lebih hemat

2 vCPU / 2 GB RAM masih sanggup untuk beban ini, tetapi tanpa ruang gerak saat
ujian serentak. Selisih harganya biasanya kecil; **4 GB lebih aman** untuk
hari-H.

---

## 3. Yang harus disiapkan di sisi kode

Perubahan ini belum dikerjakan — dilakukan setelah penyedia VPS dipilih.

1. **`output: 'standalone'`** di `next.config.ts` agar hasil build mandiri dan
   ringan dipindah.
2. **`binaryTargets`** pada `prisma/schema.prisma` supaya engine Prisma cocok
   dengan Linux VPS (`debian-openssl-3.0.x` untuk Ubuntu 22.04+).
3. **`DATABASE_URL`** diarahkan ke Postgres lokal. Parameter `pgbouncer=true`
   dihapus karena tidak lagi lewat pooler Supabase.
4. **`connection_limit`** disesuaikan agar Prisma tidak menghabiskan
   `max_connections` Postgres.
5. **`SESSION_SECRET`** disalin ke VPS. Kalau nilainya berubah, semua pengguna
   harus login ulang — tidak masalah, tetapi jangan sampai terjadi di hari-H.
6. **HTTPS**: Caddy (sertifikat otomatis) atau nginx + certbot. Wajib, karena
   presensi siswa memakai GPS dan peramban **memblokir akses lokasi di situs
   non-HTTPS**.
7. **Zona waktu server tidak perlu diatur** — seluruh perhitungan hari/jam
   sudah memakai `Asia/Jakarta` secara eksplisit lewat `src/lib/logic/waktu.ts`.

---

## 4. Yang hilang saat meninggalkan Supabase

Ini bagian yang paling sering terlewat. Di Supabase hal-hal berikut gratis dan
otomatis; di VPS menjadi tanggung jawab Anda.

| Hal | Di Supabase | Di VPS |
| --- | --- | --- |
| Backup harian | Otomatis | **Harus dibuat sendiri** (`pg_dump` + cron) |
| Point-in-time recovery | Tersedia | Perlu konfigurasi WAL archiving |
| Pembaruan keamanan Postgres | Otomatis | Manual (`apt upgrade`) |
| Pemantauan & peringatan | Dasbor bawaan | Perlu dipasang sendiri |
| Ketahanan perangkat keras | Redundan | Satu mesin — kalau mati, semua mati |

**Backup adalah syarat mutlak.** Data 387 siswa beserta nilai dan presensinya
tidak boleh bergantung pada satu disk. Minimal: `pg_dump` harian, disimpan juga
di luar VPS (Google Drive, S3, atau komputer sekolah).

---

## 5. Urutan migrasi yang disarankan

Jangan pindah mendadak menjelang ujian. Urutan aman:

1. Sewa VPS, pasang Docker atau Node + Postgres + Caddy.
2. Jalankan aplikasi di VPS memakai **salinan** data (`pg_dump` dari Supabase),
   dengan subdomain uji, misalnya `uji.sekolah.sch.id`.
3. Uji seluruh peran: admin, guru, siswa. Khususnya **presensi GPS** (butuh
   HTTPS) dan **ujian CBT**.
4. Uji beban ringan: minta 20–30 siswa membuka ujian bersamaan.
5. Siapkan backup otomatis dan pastikan hasilnya benar-benar bisa dipulihkan —
   backup yang belum pernah diuji pulih sama saja dengan tidak punya backup.
6. Baru pindahkan domain utama, di luar masa ujian.

**Jangan pindah pada minggu ujian.** Berikan jeda minimal satu minggu untuk
menemukan masalah yang tidak muncul saat uji coba.

---

## 6. Risiko yang perlu diantisipasi

| Risiko | Dampak | Penanganan |
| --- | --- | --- |
| Listrik/jaringan sekolah putus saat ujian | Siswa tidak bisa mengumpulkan | VPS tetap hidup; siswa melanjutkan setelah koneksi pulih. Jawaban tersimpan sementara di perangkat |
| VPS mati (1 mesin, tanpa redundansi) | Seluruh layanan berhenti | Backup rutin + tahu cara memulihkan cepat. Pertimbangkan snapshot otomatis dari penyedia |
| Disk penuh karena log | Aplikasi berhenti | Batasi ukuran log, pantau kapasitas |
| Lupa memperpanjang sewa | Layanan mati mendadak | Aktifkan perpanjangan otomatis |
| Sertifikat HTTPS kedaluwarsa | **Presensi GPS berhenti berfungsi** | Caddy memperbarui otomatis; kalau nginx, pastikan cron certbot jalan |

### Batasan yang masih ada pada ujian CBT

Jawaban siswa kini disimpan sementara di **perangkat** (localStorage), sehingga
halaman ter-refresh atau HP mati tidak menghilangkan pekerjaan. Yang **tidak**
tertolong:

- siswa berganti perangkat di tengah ujian
- data situs dibersihkan atau peramban dibuka dalam mode penyamaran

Menyimpan jawaban ke server secara berkala akan menutup celah ini sepenuhnya,
tetapi memerlukan satu kolom tambahan pada tabel `ExamSubmission`. Belum
dikerjakan — silakan pertimbangkan sebelum ujian besar.

---

## 7. Ringkasan keputusan

- **Sewa**: 2 vCPU / 4 GB RAM / 40–60 GB NVMe, **lokasi Jakarta**
- **Postgres di mesin yang sama**, bukan basis data terkelola di luar
- **Siapkan backup sejak hari pertama**, dan uji pemulihannya
- **Migrasi jauh sebelum masa ujian**, bukan menjelang

Setelah penyedia dipilih, berkas deployment (Docker Compose berisi Next.js +
Postgres + Caddy, skrip backup, dan panduan migrasi data dari Supabase) akan
disiapkan menyesuaikan lingkungan yang Anda dapat.
