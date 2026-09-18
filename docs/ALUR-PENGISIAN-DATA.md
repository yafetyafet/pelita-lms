# Alur Pengisian Master Data

Urutan ini penting. Integrasi antar-menu sudah benar, tetapi tiap menu hanya
menampilkan data yang punya **relasi** ke pengguna yang membukanya. Kalau
relasinya belum dibuat, menu tetap kosong — bukan karena rusak.

Kondisi basis data saat dokumen ini dibuat (18 September 2026):

| | |
| --- | --- |
| Akun pengguna | 170 |
| Rombel (kelas) | 1 |
| **Siswa yang belum masuk rombel** | **167** |
| Mapel, jadwal, ujian, presensi | 0 |

Selama 167 siswa itu belum masuk rombel, halaman **Jadwal, Materi, Tugas, dan
Ujian** mereka akan kosong. Semua fitur siswa disaring lewat `classId` milik
siswa tersebut.

Dashboard admin punya panel **"Kesiapan Data & Integrasi"** yang menghitung
sisa pekerjaan ini secara otomatis dan menautkan langsung ke menu perbaikannya.
Jadikan panel itu acuan: kerjakan sampai semua baris berwarna hijau.

---

## Langkah 1 — Rombel (kelas)

`/admin/rombel` (sama dengan `/admin/classes`)

Buat setiap rombel yang ada, misalnya `X TKJ 1`, `XI AKL 2`. Tetapkan juga
**wali kelas** untuk tiap rombel.

Kenapa wali kelas penting: wali kelas dipakai untuk tindak lanjut pelanggaran
dan mendapat akses presensi rombelnya walau tidak mengampu mapel di sana.

## Langkah 2 — Tempatkan siswa ke rombel

Ini **langkah paling menentukan**. Tanpa ini siswa tidak melihat apa pun.
Ada tiga jalan, pilih yang paling cocok:

**a. Penempatan massal dari menu rombel** — `/admin/rombel` → pilih rombel →
**Tempatkan Banyak Siswa Sekaligus**. Daftar hanya memuat siswa yang belum
punya rombel, bisa dicari, dan bisa dicentang sekaligus ("Pilih semua"). Ini
cara tercepat untuk membereskan ratusan siswa yang sudah terdaftar.

**b. Satu per satu dari manajemen akun** — `/admin/users`. Tiap baris siswa
punya dropdown rombel; mengubahnya langsung menyimpan. Halaman ini juga punya
penyaring **"Siswa belum punya rombel"** dan spanduk peringatan berisi
jumlahnya, jadi mudah menyisir yang terlewat.

**c. Lewat impor Excel** — lihat Langkah 2b di bawah.

> Satu siswa hanya aktif di satu rombel. Mengubah dropdown rombel akan
> *memindahkan*, bukan menambah rombel kedua.

## Langkah 2b — Impor massal dengan kolom rombel

`/admin/users` → **Import Excel / CSV**

Templat siswa yang diunduh dari halaman itu **mengambil nama rombel dari
database**, bukan contoh karangan:

- kolom **Kelas** pada lembar *Data Siswa* sudah terisi nama rombel yang ada,
- ada lembar tambahan **Daftar Rombel** berisi seluruh nama rombel yang sah.

Karena itu **rombel harus dibuat lebih dulu** (Langkah 1) sebelum mengunduh
templat. Kalau belum ada rombel, tombol unduh templat siswa akan menolak dan
memberi tahu alasannya.

Aturan pencocokannya:

| Kondisi kolom Kelas | Yang terjadi |
| --- | --- |
| Cocok dengan nama rombel | Siswa langsung masuk rombel itu |
| Beda huruf besar/kecil atau spasi ganda | Tetap dianggap cocok (`X RPL 1` = `x rpl  1`) |
| Nama rombel tidak ada di database | Akun tetap dibuat, **tanpa** rombel; namanya dilaporkan agar bisa dibuat lalu diimpor ulang |
| Kosong | Akun dibuat tanpa rombel |
| Baris ber-role guru/admin/DUDI | Kolom Kelas diabaikan |

Sebelum impor dijalankan, tabel pratinjau menandai tiap baris dengan warna
hijau (rombel ditemukan), kuning (kolom kosong), atau merah (rombel tidak
dikenal), plus ringkasan jumlahnya. Jadi kesalahan penulisan nama rombel
ketahuan **sebelum** ratusan akun terbuat.

Ada juga centang **"Lengkapi juga rombel siswa yang sudah terdaftar"**
(menyala secara bawaan). Dengan ini, baris yang usernamenya sudah ada tetap
dipakai untuk mengisi rombel siswa tersebut — berguna untuk membereskan siswa
lama yang belum ditempatkan. Siswa yang **sudah** punya rombel tidak pernah
dipindahkan oleh impor.

> Menambah akun satuan lewat **+ Tambah Manual** juga sudah bisa sekaligus
> memilih rombel, selama role-nya Siswa.

## Langkah 3 — Mata pelajaran

`/admin/mapel` (sama dengan `/admin/subjects`)

Masukkan seluruh mapel. Nama mapel harus unik.

## Langkah 4 — Guru pengampu (relasi guru ↔ rombel ↔ mapel)

`/admin/rombel` → pilih rombel → tetapkan guru pengampu per mapel

Ini kunci kedua. Relasi `guru + rombel + mapel` inilah yang menentukan:

- kelas apa yang muncul di akun guru,
- rombel mana yang boleh ia absen dan nilai,
- jurnal, materi, tugas, dan ujian bisa dibuat untuk rombel mana.

Guru tanpa penugasan akan melihat "Belum Ada Penugasan" di semua menunya —
dan itu memang benar, bukan kerusakan.

## Langkah 5 — Jam pelajaran

`/admin/sesi`

Definisikan jam ke-1, ke-2, istirahat, dan seterusnya, per hari. Ada tombol
**salin ke hari lain** supaya tidak mengetik ulang untuk Senin–Jumat.

Jam pelajaran ini bukan sekadar catatan: di form jadwal ia mengisi hari dan
jam secara otomatis, sehingga jam antar-kelas konsisten.

## Langkah 6 — Jadwal

`/admin/jadwal`, atau guru sendiri lewat `/teacher/schedule`

Isi **hari, jam, rombel, mata pelajaran, guru**, dan ruang bila perlu.

- **Mata pelajaran wajib diisi** untuk jadwal jenis "Pelajaran". Kalau kosong,
  jadwal siswa muncul tanpa nama pelajaran, dan daftar jadwal admin akan
  menampilkan peringatan kuning pada baris tersebut.
- Sistem menolak jadwal yang bentrok untuk rombel, guru, maupun ruang yang
  sama, jadi tabrakan jam ketahuan saat input.
- Tombol **"Izinkan Guru Input Jadwal Mandiri"** di halaman ini sekarang
  benar-benar menegakkan kebijakan: bila dimatikan, guru akan ditolak saat
  mencoba menambah jadwal sendiri.

## Langkah 7 — Titik & radius presensi GPS

`/admin/attendance-settings`

Isi koordinat sekolah, radius (meter), batas jam masuk, dan jam pulang.
Tersedia tombol pengambilan lokasi otomatis — jalankan dari lokasi sekolah.

Selama koordinat belum diisi, presensi siswa tetap tercatat tetapi **tanpa
validasi lokasi**, dan statusnya ditandai untuk ditinjau guru piket.

## Langkah 8 — Token ujian

`/admin/ujian` untuk token cadangan yang berlaku umum.

Untuk tiap ujian, guru mengatur sendiri di `/teacher/exams` → **Kelola**:
token khusus, jadwal buka/tutup, durasi, pengacakan soal, dan status terbit.

> **Ujian hanya tampil ke siswa setelah statusnya "TERBIT".** Ujian yang masih
> "DRAF" tidak akan pernah muncul, walau soalnya sudah lengkap. Ini penyebab
> paling umum "ujian tidak muncul di HP siswa".

## Langkah 9 (opsional) — Perpustakaan, pengumuman, PKL

- `/admin/library` — isi koleksi buku. Halaman perpustakaan siswa membaca
  daftar ini; selama kosong, menu siswa juga kosong.
- `/admin/broadcast` — pengumuman. Target bisa semua pengguna, per peran, atau
  per rombel.
- `/admin/pkl` — daftarkan mitra industri, tetapkan **pembimbing industri**
  (akun ber-peran DUDI), lalu tempatkan siswa. Tanpa pembimbing industri,
  akun DUDI tidak melihat siswa mana pun di dashboard-nya.

---

## Urutan ketergantungan

```
Akun pengguna
   │
   ├─→ Rombel ──→ Penempatan siswa ──┐   (manual, massal, atau impor Excel)
   │      │                          │
   │      └─→ Guru pengampu ─────────┤
   │             (guru+rombel+mapel) │
   ├─→ Mapel ────────────────────────┤
   │                                 │
   └─→ Jam pelajaran ──→ Jadwal ─────┤
                                     │
                                     ├─→ Jadwal siswa
                                     ├─→ Materi & tugas
                                     ├─→ Jurnal mengajar
                                     ├─→ Presensi kelas
                                     └─→ Ujian CBT
```

Aturan singkatnya: **siswa butuh rombel, guru butuh penugasan.** Hampir semua
keluhan "menu kosong" berpangkal pada salah satu dari dua hal itu.

---

## Cara memeriksa hasilnya

1. Buka `/admin` dan pastikan panel **Kesiapan Data & Integrasi** sudah hijau.
2. Login sebagai salah satu guru → menu Kelas, Presensi, dan Penilaian harus
   menampilkan rombel yang diampunya.
3. Login sebagai salah satu siswa → menu Jadwal harus menampilkan mapel dan
   nama guru, bukan sekadar jam.

## Catatan kata sandi

170 akun yang ada masih memakai kata sandi lama (plaintext di basis data).
Kata sandi itu **tetap berfungsi**, dan otomatis di-hash begitu pemiliknya
berhasil login satu kali. Admin dapat menyetel ulang kata sandi siapa pun dari
`/admin/users`; akun yang disetel ulang akan diminta menggantinya.
