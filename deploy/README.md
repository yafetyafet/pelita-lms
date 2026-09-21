# Memasang PELITA LMS di VM Ubuntu Server

Panduan ini untuk server sekolah sendiri (Proxmox + VM Ubuntu Server, IP
publik). Ditulis 21 September 2026.

Urutannya sengaja menaruh migrasi data **sebelum** memindahkan domain, supaya
sistem lama tetap berjalan sampai yang baru terbukti benar.

---

## 0. Yang perlu disiapkan lebih dulu

| Hal | Keterangan |
| --- | --- |
| VM Ubuntu Server | 22.04 atau 24.04 LTS, minimal 2 vCPU / 4 GB (1 core / 2 GB masih sanggup) |
| Nama domain | Wajib. Let's Encrypt tidak melayani IP telanjang |
| Port 80 dan 443 | Harus terjangkau dari internet untuk verifikasi sertifikat |
| Akses SSH | Dari komputer sekolah yang dipakai membangun aplikasi |

**Kenapa HTTPS wajib:** peramban memblokir akses lokasi di situs non-HTTPS,
sehingga presensi GPS siswa tidak akan berfungsi tanpanya.

---

## 1. Pemasangan awal server

Salin folder `deploy/` ke server, lalu:

```bash
bash pasang-server.sh
```

Skrip itu memasang Node.js 22, PostgreSQL beserta setelan hemat memorinya,
Caddy, swap 2 GB, rotasi log, pengguna layanan `pelita`, dan basis data
kosong. Kata sandi basis data serta `SESSION_SECRET` dibuat acak dan disimpan
di `/opt/pelita/pelita.env`.

> `SESSION_SECRET` yang baru membuat **semua pengguna harus login ulang**.
> Itu wajar, tetapi jangan sampai terjadi pada hari ujian.

---

## 1b. Uji coba dulu tanpa domain

Kalau domain belum siap dan Anda ingin mencoba lebih dulu, pakai
`Caddyfile.ujicoba` — **bukan HTTP biasa**.

Uji coba lewat HTTP polos **tidak akan bisa login sama sekali**. Cookie sesi
memakai tanda `Secure` saat `NODE_ENV=production`, dan peramban menolak
mengirim cookie ber-tanda Secure melalui HTTP. Gejalanya menyesatkan: login
tampak berhasil, lalu halaman berikutnya menendang kembali ke layar masuk
tanpa pesan galat apa pun.

`Caddyfile.ujicoba` memakai `tls internal` — Caddy menerbitkan sertifikatnya
sendiri untuk IP server. Peramban memperingatkan sekali, dan setelah ditekan
"Lanjutkan" sambungannya menjadi HTTPS sungguhan: login berfungsi, dan
presensi GPS ikut bisa diuji.

```bash
sudo cp Caddyfile.ujicoba /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile       # ganti 192.168.1.50 dengan IP server
sudo systemctl reload caddy
```

Ini hanya untuk uji coba: setiap pengunjung harus menekan "Lanjutkan" lebih
dulu, jadi tidak layak untuk 400 siswa. Begitu domain siap, ganti ke
`Caddyfile` biasa.

---

## 2. Layanan dan HTTPS

```bash
sudo cp pelita.service /etc/systemd/system/
sudo cp Caddyfile      /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile     # ganti lms.sekolah.sch.id
sudo systemctl daemon-reload
```

---

## 3. Bandwidth: seluruh siswa lewat sambungan 10 Mbps

Keputusan sekolah (21 September 2026): **tidak ada akses lokal**. Semua
siswa, termasuk yang duduk di ruang kelas, mengakses lewat internet dan
sambungan dedicated 10 Mbps. Dengan begitu bandwidth menjadi pembatas utama,
dan angkanya perlu dihitung jujur.

### Terukur, tanpa CDN

| Skenario | Data | Waktu di 10 Mbps |
| --- | --- | --- |
| 128 siswa mulai ujian, JS sudah tersimpan di HP | 1,9 MB | 2 detik |
| 400 siswa presensi pagi, JS sudah tersimpan | 3,9 MB | 3 detik |
| 128 siswa mulai ujian, JS **belum** tersimpan | 19,4 MB | 16 detik |
| 400 siswa presensi pagi, kunjungan **pertama** | 58,6 MB | **49 detik** |
| 400 siswa, 5 halaman sehari, kunjungan pertama | 74,2 MB | **62 detik** |

Dua baris terakhir berbahaya. Saat sambungan jenuh selama puluhan detik,
permintaan tidak sekadar lambat - sebagian **gagal** karena peramban
menyerah menunggu, dan siswa mengira aplikasinya rusak.

### Jalan keluarnya: berkas statis dilayani CDN, bukan sekolah

Dari 150 KB yang diunduh tiap siswa pada kunjungan pertama, **140 KB adalah
berkas statis** - JavaScript, ikon, logo - yang isinya sama untuk semua orang.
Tidak ada alasan berkas itu harus keluar dari sambungan sekolah 400 kali.

Cloudflare (paket gratis) diletakkan di depan server: berkas statis
disimpannya di jaringan edge (ada titiknya di Jakarta), dan yang lewat
sambungan sekolah tinggal HTML dinamis serta data - sekitar 10 KB per halaman.

| Skenario | Tanpa CDN | **Dengan CDN** |
| --- | --- | --- |
| 400 siswa presensi pagi, kunjungan pertama | 49 detik | **3 detik** |
| 128 siswa mulai ujian, JS belum tersimpan | 16 detik | **2 detik** |
| 400 siswa, 5 halaman sehari, kunjungan pertama | 62 detik | **16 detik** |

Dengan CDN, skenario terburuk turun **15 kali lipat**. Ini bukan pilihan
tambahan untuk rencana "semua lewat 10 Mbps" - ini prasyaratnya.

Header `Cache-Control: immutable` untuk `/_next/static/*` di Caddyfile
sudah disiapkan untuk ini; Cloudflare akan menyimpannya tanpa pengaturan
tambahan.

### Cara memasang Cloudflare

Cloudflare gratis mensyaratkan **seluruh zona domain** dikelola DNS-nya.
Ada dua jalan:

**Jalan A - pindahkan DNS `smkn1kemangkon.sch.id` ke Cloudflare.**
Gratis. Cloudflare mengimpor semua catatan DNS yang ada secara otomatis,
lalu nameserver di IDCloudHost diganti ke milik Cloudflare. Website sekolah
tetap di tempatnya - hanya pengelolaan DNS yang pindah. Perlu koordinasi
dengan pemegang akun IDCloudHost, dan ada jeda propagasi beberapa jam.

**Jalan B - domain terpisah khusus LMS.**
Beli satu domain (mis. di Hostinger, ~Rp 150-250 rb/tahun) dan langsung
kelola di Cloudflare. Domain sekolah tidak disentuh sama sekali. Ini alasan
yang sah untuk membeli domain terpisah - bukan demi hosting, melainkan supaya
Cloudflare bisa dipasang tanpa mengusik domain utama sekolah.

Setelah zona ada di Cloudflare:

1. Catatan **A** `lms` (atau `@`) → IP publik server, **awan oranye menyala**
   (proxied)
2. SSL/TLS → **Full (strict)**
3. **Jangan** nyalakan "Always Use HTTPS" di Cloudflare - Caddy sudah
   mengalihkan sendiri, dan pengaturan itu mengganggu verifikasi sertifikat
4. Caching → Caching Level: Standard (bawaan sudah cukup)

Caddy tetap mengambil sertifikat Let's Encrypt seperti biasa; Cloudflare
meneruskan verifikasinya.

### Tetap lakukan meski sudah ada CDN

- **Minta siswa membuka aplikasi sehari sebelum ujian.** Sesudah itu JS
  tersimpan di HP dan bahkan CDN pun tidak lagi disentuh.
- **Jadwalkan mulai ujian bertahap** per rombel, selang 2-3 menit, kalau
  ada lebih dari satu rombel ujian bersamaan.
- **Batasi pemakaian internet lain saat ujian.** Sambungan 10 Mbps itu
  dipakai bersama seluruh sekolah. Satu guru memutar YouTube di jam ujian
  memakan bandwidth yang sama. Kalau router sekolah mendukung QoS,
  prioritaskan lalu lintas ke server LMS.

---

## 4. Memindahkan data dari Supabase

Di komputer sekolah:

```bash
pg_dump "$DATABASE_URL_SUPABASE" --no-owner --no-privileges -f pelita.sql
scp pelita.sql pelita@IP_SERVER:/tmp/
```

Di server:

```bash
source /opt/pelita/pelita.env
psql "${DATABASE_URL%%\?*}" -f /tmp/pelita.sql
rm /tmp/pelita.sql
```

Pastikan jumlah barisnya cocok sebelum melangkah:

```bash
psql "${DATABASE_URL%%\?*}" -c 'SELECT
  (SELECT count(*) FROM "User")   AS pengguna,
  (SELECT count(*) FROM "Class")  AS rombel,
  (SELECT count(*) FROM "Exam")   AS ujian;'
```

Angkanya harus sama dengan di Supabase. Per 21 September 2026: 407 pengguna,
13 rombel.

---

## 5. Mengirim aplikasinya

Dari komputer sekolah, di dalam folder proyek:

```bash
bash deploy/kirim.sh pelita@IP_SERVER
```

Aplikasinya **dibangun di komputer sekolah**, bukan di server. `next build`
butuh memori jauh lebih besar daripada menjalankannya, dan di VM kecil mudah
gagal kehabisan memori. Yang dikirim hanya hasil standalone (~56 MB).

Lalu nyalakan:

```bash
sudo systemctl enable --now pelita
sudo systemctl reload caddy
```

---

## 6. Backup — syarat mutlak

```bash
sudo cp backup.sh /opt/pelita/backup.sh
sudo chmod +x /opt/pelita/backup.sh
sudo crontab -e
#   0 22 * * *  /opt/pelita/backup.sh
```

Buka `backup.sh` dan **aktifkan salah satu baris penyalinan ke luar server**
(komputer sekolah atau Google Drive). Snapshot Proxmox tidak menggantikan ini:
snapshot tersimpan di mesin yang sama, jadi ikut hilang kalau disknya rusak.

**Uji pemulihannya sekali** sebelum menganggap backup ini ada:

```bash
sudo -u postgres createdb ujicoba
gzip -dc /opt/pelita/backup/pelita-*.sql.gz | sudo -u postgres psql ujicoba
sudo -u postgres psql ujicoba -c 'SELECT count(*) FROM "User";'
sudo -u postgres dropdb ujicoba
```

Backup yang belum pernah diuji pulih sama saja dengan tidak punya backup.

---

## 7. Urutan peralihan yang aman

1. Pasang semuanya, **uji dengan subdomain lain** (misal `uji.sekolah.sch.id`)
2. Uji ketiga peran: admin, guru, siswa
3. Uji **presensi GPS** (butuh HTTPS) dan **satu ujian CBT lengkap**
4. Minta 20–30 siswa membuka bersamaan
5. **Ambil snapshot Proxmox** sebagai titik aman
6. Baru pindahkan domain utama — **di luar masa ujian**

Jangan pindah pada minggu ujian. Beri jeda minimal satu minggu untuk menemukan
masalah yang tidak muncul saat uji coba.

---

## 8. Perawatan sehari-hari

```bash
sudo systemctl status pelita          # keadaan layanan
sudo journalctl -u pelita -f          # log langsung
sudo journalctl -u pelita --since '1 hour ago' | grep -i error
free -h                               # sisa memori dan swap
df -h /                               # sisa disk
```

Memasang versi baru aplikasi: ulangi `bash deploy/kirim.sh pelita@IP_SERVER`.
Rilis lama disimpan tiga terakhir, dan perintah untuk mengembalikannya
ditampilkan di akhir skrip.

---

## 9. Risiko baru yang tidak ada di cloud

| Risiko | Penanganan |
| --- | --- |
| **Listrik sekolah padam saat ujian** | UPS. Minimal cukup untuk mematikan server dengan rapi; idealnya cukup menyelesaikan satu sesi ujian |
| Internet sekolah putus | **Seluruh** akses terputus, termasuk siswa di dalam sekolah - tidak ada jalur lokal. Pastikan ada kontak darurat ke penyedia dedicated |
| Disk VM penuh | Rotasi log sudah dipasang; pantau `df -h` |
| Sertifikat HTTPS kedaluwarsa | Caddy memperbaruinya otomatis - pastikan port 80 tetap terbuka |
| Server rusak | Snapshot Proxmox + backup di luar server |
