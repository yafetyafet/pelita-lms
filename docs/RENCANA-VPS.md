# Rencana Pindah ke VPS

Dokumen perencanaan sebelum menyewa VPS. Ditulis 19 September 2026, diperbarui
20 September 2026 dengan hasil pengukuran ulang.

---

## 1. Koreksi penting atas versi pertama dokumen ini

Versi pertama menyimpulkan bahwa penyebab utama lambatnya aplikasi adalah
**jarak ke basis data**: latensi ~143 ms ke Supabase Singapura.

**Kesimpulan itu keliru.** Angka 143 ms diukur dari komputer sekolah di
Purbalingga ke Singapura — bukan dari fungsi Vercel ke Supabase. Fungsi
Vercel-nya sendiri berjalan di Singapura (`sin1`), satu wilayah dengan
Supabase, sehingga jarak fungsi ke basis data sebenarnya sudah dekat.

Setelah diukur ulang pada 20 September 2026, penyebab sebenarnya ada di tempat
lain, dan sebagian besar sudah diperbaiki tanpa pindah ke mana pun:

| Temuan | Keadaan |
| --- | --- |
| Pustaka Excel 420 KB ikut terunduh setiap kunjungan | Sudah diperbaiki (dimuat saat dibutuhkan saja) |
| Daftar siswa 32,8 KB dikirim ke halaman yang tidak memakainya | Sudah diperbaiki (jadi ~1 KB) |
| Beranda menunggu JavaScript selesai sebelum mengambil data | Sudah diperbaiki (dirender di server) |
| Setiap halaman mengunduh ~121 KB JavaScript terkompresi (sebagian besar React + Next.js) | **Masih ada** — batas kerangka kerja, dan ukurannya memang wajar |
| Cold start fungsi Vercel 0,4–1,3 detik | **Masih ada** — hanya hilang di VPS |

Latensi jaringan ke Vercel sendiri sehat: TTFB terukur **123–192 ms** dari
Purbalingga.

Jadi alasan pindah ke VPS **bergeser**: bukan karena basis data jauh, melainkan
karena (a) cold start, (b) kapasitas hari ujian yang bisa dipastikan, dan
(c) paket Vercel Hobby melarang penggunaan seperti ini — lihat bagian 7.

---

## 2. Spesifikasi yang dibutuhkan

Untuk 387 siswa, dengan ujian dijalankan per sesi. Diuji sampai **128 siswa
serentak** (lihat bagian 2a) dan masih lapang.

### Kebutuhan terukur (20 September 2026)

| Yang diukur | Hasil |
| --- | --- |
| Memori proses Next.js (produksi, idle) | **94 MB** |
| Ukuran basis data | **13 MB** |
| `node_modules` | **781 MB** (≈920 MB terpakai di disk) |
| Hasil build `.next` | **100 MB** |
| JavaScript per kunjungan pertama | **121 KB** brotli / 140 KB gzip (di-cache setelahnya) |
| Muatan data beranda guru | **1,6 KB** |

### Rekomendasi

| Komponen | Nyaman | Minimum yang sanggup |
| --- | --- | --- |
| vCPU | 2 | **1** |
| RAM | 4 GB | **2 GB** (wajib + swap 2 GB) |
| Disk | 40 GB | **20 GB** (wajib rotasi log) |
| Lokasi | Jakarta | Jakarta |
| OS | Ubuntu 22.04 / 24.04 LTS | sama |

**Jangan pilih VPS di Singapura atau luar negeri** hanya karena lebih murah —
itu menambah latensi yang justru ingin dihindari. Penyedia dalam negeri yang
umum: Biznet Gio, IDCloudHost, Dewaweb, Rumahweb.

---

## 2a. Evaluasi spek 1 core / 2 GB / 20 GB

Spek ini **sanggup**, tetapi tanpa cadangan. Semua syarat di bawah wajib
dipenuhi, bukan pilihan.

### Kenapa sanggup

- Beban puncaknya kecil. Ujian dijalankan per sesi 40–70 siswa. Kalau semuanya
  menekan "Mulai Ujian" dalam satu menit, itu sekitar **1 permintaan dinamis
  per detik** — jauh di bawah kemampuan satu core.
- Basis datanya 13 MB dan muat seluruhnya di RAM.
- Berkas JavaScript bersifat statis dan `immutable`; setelah kunjungan
  pertama, siswa tidak mengunduhnya lagi.
- 400 siswa × 121 KB = **48 MB** pada hari pertama. Lewat port 1 Gbps lokal,
  itu hitungan detik — yang membatasi justru wifi sekolah, bukan VPS-nya.

### Uji beban ujian 128 siswa serentak (21 September 2026)

Ujian ternyata adalah beban **paling ringan** di aplikasi ini, bukan paling
berat. Penyebabnya satu keputusan yang diambil sebelumnya: jawaban disimpan
sementara di perangkat siswa (localStorage), bukan dikirim berkala ke server.
Akibatnya sepanjang 60 menit pengerjaan, **tidak ada lalu lintas ke server
sama sekali**.

Bebannya hanya dua lonjakan pendek: saat menekan "Mulai Ujian" dan saat
mengumpulkan.

| Yang diukur | Hasil | Untuk 128 siswa |
| --- | --- | --- |
| Ukuran naskah ujian 20 soal | 5,1 KB | **0,64 MB** total |
| CPU: acak soal + buang kunci jawaban | 0,020 ms | — |
| CPU: koreksi otomatis | 0,021 ms | — |
| **Total CPU per siswa** | **0,041 ms** | **5,2 ms** total |
| Kueri basis data saat "Mulai Ujian" | ~5 | ~640 kueri |
| Kueri basis data saat mengumpulkan | ~3 | ~384 kueri |
| Memori proses Next.js pada 128 sambungan serentak | 88 MB → **182 MB** | — |

Seluruh pekerjaan mengoreksi 128 lembar jawaban memakan **5,2 milidetik** CPU.
Satu core bukan hambatan di sini.

Perkiraan pemakaian memori saat ujian berlangsung:

| Proses | Perkiraan |
| --- | --- |
| Next.js pada beban puncak | ~182 MB |
| Postgres (dengan setelan di bawah) | ~400 MB |
| Caddy | ~30 MB |
| Ubuntu | ~250 MB |
| **Total** | **~860 MB dari 2 GB** |

### Unduhan pertama: jauh lebih ringan daripada perkiraan semula

> **Koreksi (21 September 2026).** Versi sebelumnya dokumen ini menyebut
> "579 KB JavaScript" dan "74 MB untuk 128 siswa". Kedua angka itu **salah**,
> karena diukur tanpa kompresi dan ikut menghitung berkas polyfill yang tidak
> pernah diunduh peramban modern.

Angka sebenarnya, diukur ulang pada berkas hasil build:

| Keadaan | Ukuran per siswa | 128 siswa |
| --- | --- | --- |
| Tanpa kompresi (bukan yang terjadi) | 469 KB | 59 MB |
| **gzip** (bawaan Caddy dan nginx) | **140 KB** | **17 MB** |
| **brotli** (dipakai Vercel) | **121 KB** | **15 MB** |

Dari 121 KB itu, hanya sekitar **32 KB adalah kode aplikasi ini**; sisanya
React dan runtime Next.js yang tidak bisa dibuang.

Berkasnya bertanda `immutable`, jadi hanya diunduh sekali per perangkat.
Meminta siswa membuka aplikasi sehari sebelum ujian tetap membantu, tetapi
bukan lagi keharusan: 15 MB untuk 128 siswa lewat sambungan 100 Mbps selesai
dalam hitungan detik.

### Catatan kejujuran atas pengukuran ini

- Uji 128 sambungan serentak dijalankan di komputer Windows dengan pembangkit
  beban dan server pada mesin yang sama. Angka **memori** (182 MB) dapat
  dijadikan pegangan; angka **throughput**-nya tidak mewakili VPS Linux.
- Waktu basis data diukur dari Purbalingga ke Supabase Singapura, sehingga
  memuat latensi ~140 ms yang **hilang** di VPS dengan Postgres lokal.
- Naskah 5,1 KB berasal dari ujian 20 soal. Ujian 50 soal sekitar 13 KB -
  tetap tidak berarti. Gambar soal memakai tautan luar dan diunduh langsung
  oleh ponsel siswa, tidak lewat VPS.

### Syarat wajib

1. **Swap 2 GB.** Tanpa ini, lonjakan memori saat ujian bisa memicu OOM killer
   dan mematikan Postgres atau Node di tengah ujian.

   ```bash
   fallocate -l 2G /swapfile && chmod 600 /swapfile
   mkswap /swapfile && swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   sysctl -w vm.swappiness=10
   ```

2. **JANGAN build di VPS.** `next build` butuh RAM jauh lebih besar daripada
   menjalankannya, dan `node_modules` saja menempati ~920 MB disk. Di mesin 1 core / 2 GB,
   build sangat mungkin gagal kehabisan memori — dan kalaupun berhasil, lama.

   Build di komputer sekolah atau GitHub Actions, lalu kirim hasilnya. Untuk
   itu `output: 'standalone'` di `next.config.ts` wajib: hasilnya berisi server
   beserta dependensi yang benar-benar dipakai saja, bukan seluruh 781 MB.

3. **Kompresi HTTP wajib dinyalakan.** Vercel melakukannya otomatis; VPS
   **tidak**. Tanpa ini siswa mengunduh 469 KB, bukan 140 KB - empat kali
   lebih berat, semata karena pindah tempat.

   Di Caddy cukup satu baris:

   ```
   sekolah.sch.id {
     encode zstd gzip
     reverse_proxy localhost:3000
   }
   ```

   Periksa hasilnya setelah pasang:

   ```bash
   curl -sI -H "Accept-Encoding: gzip" https://sekolah.sch.id/_next/static/... \
     | grep -i content-encoding
   ```

   Harus muncul `content-encoding: gzip`. Kalau kosong, kompresinya belum
   jalan.

4. **Postgres dikecilkan.** Nilai bawaan mengasumsikan mesin besar.

   ```
   shared_buffers = 256MB
   effective_cache_size = 768MB
   work_mem = 4MB
   maintenance_work_mem = 64MB
   max_connections = 50
   ```

5. **Batas koneksi Prisma.** Satu core tidak butuh banyak koneksi, dan tiap
   koneksi memakan memori Postgres:

   ```
   DATABASE_URL="postgresql://...?connection_limit=8&pool_timeout=20"
   ```

6. **Rotasi log.** Disk 20 GB terisi OS (~5 GB), aplikasi (~1 GB), dan sisanya
   untuk log serta backup. Log yang dibiarkan menumpuk akan menghabiskannya dan
   membuat aplikasi berhenti.

   ```
   # /etc/systemd/journald.conf
   SystemMaxUse=500M
   ```

7. **Backup dikirim ke luar VPS.** Disk 20 GB tidak cukup untuk menyimpan
   riwayat backup di mesin yang sama — dan backup di mesin yang sama tidak
   menolong kalau mesinnya yang rusak.

### Risiko yang tersisa pada spek ini

| Risiko | Kapan terasa | Penanganan |
| --- | --- | --- |
| Satu core dipakai bersama Postgres, Node, dan Caddy | Bukan saat ujian (terukur ringan), melainkan saat banyak guru membuka rekap dan cetak laporan bersamaan | Hindari menjadwalkan cetak rapor massal di jam ujian |
| 2 GB tanpa ruang gerak | Lonjakan tak terduga | Swap + pantau memori; naik ke 4 GB bisa dilakukan kapan saja |
| **20 Mbps internasional** | `npm install`, `apt upgrade`, `git pull` | Bukan masalah untuk siswa — mereka mengakses lewat jalur domestik (IIX) di port 1 Gbps. Yang lambat hanya pemasangan dan pembaruan |
| Satu mesin tanpa redundansi | Kalau VPS mati | Backup teruji + tahu cara memulihkan cepat |

### Tentang "20 Mbps International"

Angka ini **tidak memengaruhi kecepatan siswa**. Siswa di Indonesia mencapai
VPS Indonesia lewat jalur domestik (IIX) yang memakai port 1 Gbps. Yang lewat
jalur internasional hanya lalu lintas VPS ke luar negeri: mengunduh paket npm,
pembaruan sistem, dan `git pull`. Itu membuat pemasangan terasa lambat, bukan
aplikasinya.

Satu hal yang perlu dipastikan: **gambar soal ujian** yang memakai tautan luar
(Google Drive, dan sejenisnya) diunduh langsung oleh ponsel siswa, bukan lewat
VPS — jadi tidak terkena batas 20 Mbps itu.

### Kesimpulan spek ini

Sanggup untuk pemakaian harian dan ujian per sesi. Yang dikorbankan adalah
ruang gerak: tidak ada cadangan kalau ada yang tidak terduga di hari-H. Kalau
selisih harga ke 2 core / 4 GB kecil, ambil yang itu. Kalau tidak, spek ini
bisa dijalankan asalkan tujuh syarat di atas dipenuhi — dan VPS bisa dinaikkan
spesifikasinya tanpa memasang ulang apa pun.

---

## 2b. Apakah muatan halaman jadi lebih cepat di VPS?

Sebagian ya, sebagian tidak. Diukur dari Purbalingga, 21 September 2026.

### Yang pasti lebih cepat: cold start

| Keadaan | TTFB terukur |
| --- | --- |
| Permintaan pertama setelah fungsi menganggur | **0,42 – 2,14 detik** |
| Permintaan berikutnya (hangat) | **0,14 – 0,22 detik** |

Selisih itu **cold start** fungsi Vercel: mesin yang menjalankan aplikasi
dimatikan saat tidak dipakai, lalu dinyalakan lagi pada permintaan berikutnya.
Siswa pertama yang membuka aplikasi pagi hari selalu kena.

Di VPS, prosesnya berjalan terus. Cold start **hilang sepenuhnya**. Inilah
keuntungan terbesar dan paling nyata dari pindah.

### Yang kemungkinan besar TIDAK lebih cepat: jarak jaringan

Dugaan umum "VPS Jakarta pasti lebih dekat daripada Vercel Singapura" ternyata
**belum tentu benar**:

| Tujuan | Waktu sambung TCP dari Purbalingga |
| --- | --- |
| Vercel (edge Singapura, `sin1`) | **35 – 46 ms** |
| Penyedia hosting Indonesia (Jakarta) | **72 – 226 ms** |

Vercel memakai jaringan edge dengan peering luas, sehingga dari Jawa Tengah
justru terjangkau lebih cepat daripada beberapa host Jakarta yang diuji.

> **Batas keabsahan uji ini:** yang diukur adalah situs pemasaran penyedia
> hosting, bukan VPS sungguhan milik kita - keduanya bisa berbeda rute dan
> berbeda konfigurasi. Angka ini **bukan bukti** bahwa VPS Jakarta akan lebih
> lambat, melainkan peringatan bahwa "lebih dekat" tidak otomatis berarti
> "lebih cepat". **Ukur sendiri VPS-nya sebelum memindahkan domain utama.**

### Yang sama sekali tidak berubah

**JavaScript kerangka kerja.** Dari ~121 KB (brotli) yang diunduh pada
kunjungan pertama, sekitar 90 KB adalah React dan runtime Next.js. Jumlahnya
sama persis di mana pun aplikasi diletakkan, dan tidak bisa dikurangi tanpa
mengganti kerangka kerjanya.

Kode aplikasi ini sendiri hanya ~32 KB - sudah kecil, tidak ada yang berarti
untuk dipangkas.

### Yang berisiko jadi lebih lambat

| Hal | Sebabnya |
| --- | --- |
| Pengiriman berkas statis | Vercel menyajikannya dari jaringan CDN; VPS menyajikan semuanya dari satu mesin |
| Waktu render per halaman | Satu core Xeon berbagi dengan Postgres dan Caddy, kemungkinan lebih lambat per render daripada perangkat keras fungsi Vercel |

Keduanya bukan masalah pada beban sekolah ini, tetapi jangan diharapkan
menjadi lebih cepat.

### Ringkasnya

| Bagian waktu muat | Sesudah pindah |
| --- | --- |
| Cold start 0,4 – 2,1 detik | **Hilang** |
| Jarak jaringan | Belum tentu membaik - wajib diuji |
| Kueri basis data | Membaik sedikit (fungsi Vercel dan Supabase sudah sama-sama di Singapura) |
| JavaScript (~121 KB brotli) | **Tidak berubah** |
| Penyajian berkas statis | Berpotensi menurun - **wajib menyalakan kompresi** |

Pindah ke VPS menghapus jeda pertama yang paling mengganggu. Yang **tidak**
bisa diharapkan darinya adalah muatan JavaScript yang lebih ringan - ukurannya
sudah wajar (~121 KB terkompresi) dan sebagian besar milik React serta Next.js.

Yang justru perlu dijaga saat pindah: **jangan sampai kompresi lupa
dinyalakan.** Itu satu-satunya cara migrasi ini bisa membuat muatan halaman
menjadi lebih berat, bukan lebih ringan.

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

## 7. Kenapa tidak bertahan di Vercel Hobby

Ini alasan pindah yang paling menentukan, dan baru jelas pada 20 September 2026.

**Ketentuan layanan.** Vercel menulis: *"Hobby teams are restricted to
non-commercial personal use only. All commercial usage requires either a Pro or
Enterprise plan."* Definisi "commercial" mereka mencakup *"receiving payment to
create, update, or host the site"* dan *"a paid employee or consultant writing
the code"*. LMS sekolah yang dibangun dan dikelola pegawai sekolah masuk
kategori itu — bukan soal apakah siswa membayar. Vercel berhak menonaktifkan
proyek **tanpa pemberitahuan**.

**Cara gagalnya.** Vercel menulis: *"if you exceed your usage limits on the
Hobby plan, you will have to wait until 30 days have passed before you can use
the feature again."* Bukan diperlambat, bukan ditagih — berhenti sampai 30
hari. Kalau kuota habis di tengah masa ujian, aplikasi mati sampai bulan
berikutnya.

**Kuota yang paling sempit.** Bukan lalu lintas, melainkan **Active CPU: 4 jam
per bulan**. Untuk 400 pengguna aktif, itu ketat — dan perubahan render sisi
server yang membuat beranda terasa cepat justru memindahkan kerja CPU dari
ponsel siswa ke fungsi Vercel, sehingga pos ini makin terpakai.

| Sumber daya | Jatah Hobby/bulan | Perkiraan pemakaian |
| --- | --- | --- |
| Function Invocations | 1.000.000 | ~10.000 per hari ujian — lega |
| Fast Data Transfer | 100 GB | ~5–15 GB — lega |
| Edge Requests | 1.000.000 | cukup |
| **Active CPU** | **4 jam** | **sempit** |

Pilihannya: naik ke Vercel Pro (US$20/bulan, sesuai ketentuan, kelebihan
pemakaian ditagih bukan dimatikan) atau pindah ke VPS. Keduanya sah; VPS lebih
murah dan menghilangkan cold start, dengan konsekuensi backup dan keamanan
menjadi tanggung jawab sendiri.

Sumber: [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby),
[Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines).

---

## 8. Ringkasan keputusan

- **Jangan menjalankan ujian di Vercel Hobby** — bukan karena lambat, tetapi
  karena bisa berhenti 30 hari atau ditutup tanpa pemberitahuan (bagian 7)
- **Spek 1 core / 2 GB / 20 GB sanggup** untuk ujian per sesi, asalkan enam
  syarat di bagian 2a dipenuhi — terutama swap dan tidak membangun di VPS
- **Lokasi Jakarta**, Postgres di mesin yang sama
- **Siapkan backup sejak hari pertama**, dan uji pemulihannya
- **Migrasi jauh sebelum masa ujian**, bukan menjelang

Setelah penyedia dipilih, berkas deployment (Docker Compose atau systemd berisi
Next.js + Postgres + Caddy, skrip backup, dan panduan migrasi data dari
Supabase) akan disiapkan menyesuaikan lingkungan yang didapat.
