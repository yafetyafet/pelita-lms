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

## 2. Layanan dan HTTPS

```bash
sudo cp pelita.service /etc/systemd/system/
sudo cp Caddyfile      /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile     # ganti lms.sekolah.sch.id
sudo systemctl daemon-reload
```

---

## 3. Split-DNS — jangan dilewati

Kalau siswa di sekolah mengakses lewat nama domain publik, sebagian router
mengirim lalu lintasnya **keluar ke internet lalu masuk lagi**. Sambungan
10 Mbps sekolah jadi terpakai dua kali untuk data yang sebenarnya tidak perlu
keluar gedung.

Buat catatan DNS internal supaya nama domain yang sama menunjuk ke **IP lokal**
server bagi perangkat di jaringan sekolah. Setelah itu seluruh lalu lintas
ujian berjalan pada kecepatan LAN dan tidak menyentuh sambungan internet.

Periksa dari laptop yang tersambung wifi sekolah:

```bash
nslookup lms.sekolah.sch.id     # harus menjawab IP lokal, bukan IP publik
```

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
| Internet sekolah putus | Siswa di sekolah tetap bisa mengakses lewat LAN kalau split-DNS sudah dipasang. Yang dari luar terputus |
| Disk VM penuh | Rotasi log sudah dipasang; pantau `df -h` |
| Sertifikat HTTPS kedaluwarsa | Caddy memperbaruinya otomatis - pastikan port 80 tetap terbuka |
| Server rusak | Snapshot Proxmox + backup di luar server |
