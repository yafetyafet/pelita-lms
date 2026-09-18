# Perbaikan Integrasi LMS Pelita

Catatan ini merangkum apa yang diperbaiki, apa yang ditambahkan, dan langkah
rilis yang harus dijalankan. Ditulis untuk dibaca sebelum deploy berikutnya.

---

## 1. Langkah rilis (WAJIB, berurutan)

Aplikasi **tidak akan berjalan** sebelum skema basis data disesuaikan, karena
kode baru memakai kolom dan tabel yang belum ada di Supabase.

```bash
# 1. Periksa dulu SQL yang akan dijalankan
#    (sudah disiapkan, murni penambahan — tanpa DROP/DELETE)
cat prisma/manual/002-perubahan-skema.sql

# 2. Cek apakah tabel presensi sudah berisi data
#    Supabase → SQL Editor:  SELECT count(*) FROM "Attendance";
#    - Hasil 0        → lanjut ke langkah 3
#    - Lebih dari 0   → jalankan dulu prisma/manual/001-pra-migrasi.sql

# 3. Terapkan skema
npx prisma db push
npx prisma generate

# 4. Build untuk memastikan semuanya lolos
npm run build
```

### Variabel lingkungan baru

Tambahkan di Vercel → Settings → Environment Variables:

| Nama             | Keterangan                                                     |
| ---------------- | -------------------------------------------------------------- |
| `SESSION_SECRET` | String acak minimal 32 karakter, untuk menandatangani cookie sesi |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Tanpa variabel ini aplikasi tetap jalan (kunci diturunkan dari
`DATABASE_URL`), tetapi mengganti kata sandi database akan memaksa semua
pengguna login ulang. Sebaiknya diisi.

### Dampak ke pengguna setelah deploy

- **Semua pengguna harus login ulang satu kali.** Format cookie sesi berubah
  dari cookie mentah menjadi cookie bertanda tangan.
- **Kata sandi lama tetap berfungsi.** Basis data saat ini menyimpan 170 akun
  dengan kata sandi plaintext; masing-masing otomatis di-hash (scrypt) pada
  login berhasil pertama. Tidak ada akun yang terkunci.

---

## 2. Bug yang diperbaiki

### Kritis — mematikan hampir seluruh fitur guru

`src/app/actions/teacher.ts` dan `admin.ts` membaca cookie bernama `role`,
sedangkan `login()` menuliskannya sebagai `userRole`. Akibatnya
`getTeacherUserId()` **selalu** mengembalikan `null`, sehingga setiap fitur
guru — daftar kelas, jurnal, materi, tugas, ujian, jadwal, forum, pelanggaran —
mengembalikan array kosong atau pesan "Belum login". Inilah penyebab utama
kesan "menu banyak tapi tidak ada integrasinya".

Sekarang seluruh action mengambil sesi lewat satu sumber:
`src/lib/auth/session.ts`.

### Keamanan

| Masalah                                                                                    | Perbaikan                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Tidak ada proteksi rute sama sekali — `/admin` bisa dibuka siapa pun tanpa login           | `src/proxy.ts` (Next.js 16 mengganti nama `middleware.ts` → `proxy.ts`)  |
| Cookie `userId`/`userRole` mentah bisa dipalsukan dari `document.cookie` → menyamar ADMIN  | Cookie sesi bertanda tangan HMAC-SHA256 (`src/lib/auth/token.ts`)        |
| Kata sandi disimpan dan dibandingkan sebagai plaintext                                     | Hash scrypt + peningkatan otomatis saat login (`src/lib/auth/password.ts`) |
| Server action tidak memeriksa peran — siswa mana pun bisa memanggil action guru            | `requireSession(...roles)` di setiap action                              |
| Guru bisa menilai/mengabsen kelas yang bukan ampuannya dengan mengirim `classId` lain      | `pastikanAksesKelas()` di `teacher.ts`                                   |
| Kunci jawaban ujian terkirim ke browser sebelum token diverifikasi                         | Soal hanya dikirim oleh `getExamPaper()` setelah token benar             |
| Admin bisa menghapus/menonaktifkan akunnya sendiri atau admin terakhir                     | Pemeriksaan di `deleteUser`/`updateUser`                                 |
| Backup mengekspor kolom `password`                                                         | Kolom kata sandi tidak diikutkan                                         |

### Zona waktu

`src/lib/logic/attendance.ts` memakai `getHours()` mentah. Vercel menjalankan
fungsi server dengan `TZ=UTC`, jadi jendela presensi 07:00 WIB dibaca sebagai
00:00 — validasi waktu salah 7 jam di produksi, dan presensi pagi tercatat di
tanggal sebelumnya. Semua perhitungan hari/jam kini lewat
`src/lib/logic/waktu.ts` (Asia/Jakarta).

### Fitur yang tampak berfungsi tetapi tidak menyimpan apa pun

| Lokasi                        | Masalah                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------- |
| Profil siswa                  | Tombol ganti kata sandi hanya memicu animasi; input bahkan tanpa `value`        |
| Dashboard guru                | "Isi Jurnal Cepat" menampilkan "berhasil disimpan" lewat `setTimeout`           |
| Dashboard siswa               | Presensi memakai koordinat mati `-7.34, 109.34` ("Simulate GPS fetch")          |
| Jadwal admin                  | Tombol "Izinkan Guru Input Jadwal Mandiri" hanya state lokal, tidak menegakkan  |
| Perpustakaan siswa            | Tombol unduh tidak melakukan apa pun; `downloads` selalu 0                      |
| Halaman penilaian guru        | "Simpan" mengirim SELURUH peta nilai → menandai semua siswa GRADED dengan nilai 0 |
| Menu "Forum Diskusi" siswa    | Tautan mengarah ke `/student/materials`                                         |

### Kesalahan data

- Kunci jawaban PG disimpan guru sebagai **indeks** (`"0"`–`"3"`). Halaman ujian
  siswa yang baru mengirim dalam format yang sama agar cocok dengan ujian yang
  sudah ada di basis data.
- Impor soal tempel: jawaban di luar A–D menghasilkan `"-1"` sebagai kunci,
  membuat soal mustahil dijawab benar.

### Klaim antarmuka yang tidak sesuai kenyataan

- Halaman backup memajang "Terhubung (Healthy)", host pooler, "Otomatis Tiap
  Hari", dan "Latency ~24 ms" — semuanya ditulis mati di JSX, tidak ada yang
  diukur.
- Halaman token ujian mengklaim sistem "otomatis mengunci layar agar tidak
  dapat berpindah aplikasi". Peramban web tidak mengizinkan itu. Diganti
  penjelasan yang benar: perpindahan tab dicatat dan dilaporkan ke guru.
- Perpustakaan siswa menampilkan rating "4.9" untuk setiap buku.

---

## 3. Fitur yang dilengkapi

### Akademik

- **Pengumpulan tugas oleh siswa** — sebelumnya tidak ada sama sekali; status
  `SUBMITTED` di basis data tak mungkin tercapai. Termasuk penanda terlambat
  dan penguncian setelah dinilai.
- **Lembar pengumpulan untuk guru** (`/teacher/assignments/[id]`) — membaca
  jawaban siswa, memberi nilai dan umpan balik per siswa.
- **Ujian CBT dijaga server** — `kelayakanUjian()` sudah ada di repo tetapi
  tidak pernah dipanggil. Sekarang `Exam` punya `startAt`, `endAt`, `token`,
  `shuffle`, `isPublished`, `showResult`, `passingScore`; sisa waktu dihitung
  dari `startedAt` di server sehingga menyegarkan halaman tidak menambah waktu.
- **Koreksi esai** (`/teacher/exams/[id]`) — kolom `essayScore` sudah ada sejak
  awal tetapi tidak ada action maupun antarmukanya. Termasuk nilai akhir
  gabungan PG + esai dan hitung-ulang skor bila kunci jawaban diperbaiki.
- **Pencatatan perpindahan tab** disimpan bersama jawaban, terlihat oleh guru.

### Presensi & jadwal

- **Input presensi manual guru** (`/teacher/attendance`) — hadir, terlambat,
  sakit, izin, alfa, dengan keterangan; membedakan presensi mandiri GPS dari
  input guru. Sebelumnya satu-satunya sumber presensi adalah check-in GPS
  siswa, sehingga siswa sakit atau izin selamanya tercatat tanpa keterangan.
- **Rekap kehadiran** per kelas dan rentang tanggal.
- **Presensi per mata pelajaran**, bukan hanya harian.
- **Relasi `Schedule`** ke kelas, mapel, guru, dan jam pelajaran — sebelumnya
  hanya string id, sehingga jadwal siswa tidak bisa menampilkan nama mapel.
  Halaman jadwal admin juga belum punya pilihan mata pelajaran sama sekali.
- **`Session` (jam ke-) tersambung ke jadwal** dan mengisi jam otomatis.
- **Deteksi jadwal bentrok** untuk kelas, guru, dan ruang.
- **Indeks unik presensi** `(userId, slotKey)` mencegah presensi ganda.

### Pendukung

- **Forum untuk siswa** (`/student/forum`) — action forum sebelumnya memakai
  helper khusus guru, jadi siswa tidak bisa membuat topik maupun membalas.
  Termasuk moderasi (sematkan/tutup) untuk guru.
- **CRUD perpustakaan di admin** (`/admin/library`) — halaman siswa sudah bisa
  membaca `LibraryBook` sejak awal, tetapi tidak ada jalan untuk mengisinya.
- **Broadcast untuk semua peran** — sebelumnya hanya dibaca beranda siswa,
  disaring di browser dengan daftar target mati. Guru dan mitra DUDI tidak
  pernah melihat pengumuman. Kini disaring di server, bisa ditargetkan ke
  rombel, dan punya penanda sudah-dibaca.
- **Pelanggaran** punya relasi ke siswa dan pelapor (sebelumnya id lepas
  sehingga nama pelapor tak bisa ditampilkan), plus status tindak lanjut.
- **PKL / Prakerin** — dashboard DUDI sebelumnya 100% statis: angka "0 Siswa"
  ditulis langsung di JSX, tanpa model basis data. Sekarang ada `Partner`,
  `PklPlacement`, `PklJournal`, `PklAttendance`; admin menempatkan siswa
  (`/admin/pkl`), siswa mengisi jurnal dan presensi geofence lokasi industri
  (`/student/pkl`), pembimbing industri memverifikasi (`/dudi`).
- **Panel "Kesiapan Data & Integrasi"** di dashboard admin — menjawab langsung
  pertanyaan "kenapa menu ini kosong?" dengan menunjuk penyebabnya (mis. siswa
  belum masuk rombel, ujian belum diterbitkan, geofence belum diisi).

---

## 4. Berkas baru

```
src/lib/auth/token.ts         Token sesi HMAC (edge-safe, dipakai proxy)
src/lib/auth/session.ts       Pembaca sesi & requireSession() untuk server action
src/lib/auth/password.ts      Hash scrypt + kompatibilitas plaintext lama
src/lib/logic/waktu.ts        Helper zona waktu WIB
src/lib/types/aksi.ts         Tipe balikan seragam server action
src/proxy.ts                  Penjaga rute berbasis peran
src/app/actions/forum.ts      Forum (siswa + guru + admin)
src/app/actions/broadcast.ts  Pengumuman lintas peran
src/app/actions/pkl.ts        PKL / Prakerin
src/components/GantiSandiForm.tsx
prisma/manual/                SQL pra-migrasi & diff skema untuk ditinjau
```

---

## 5. Yang belum dikerjakan

- **Unggah berkas.** Materi, lampiran tugas, berkas buku, dan dokumentasi PKL
  masih berupa tautan (Google Drive dan sejenisnya). Supabase Storage sudah
  tersedia di proyek ini (`@supabase/supabase-js` terpasang) tetapi belum
  dipakai; menyambungkannya adalah pekerjaan terpisah.
- **Lint.** `npx eslint src` melaporkan 175 error, hampir seluruhnya
  `@typescript-eslint/no-explicit-any` yang **sudah ada sebelum perubahan ini**
  (mis. `src/app/teacher/schedule/page.tsx` yang tidak disentuh). `next build`
  tidak menjalankan eslint sehingga build tetap lolos. Membersihkannya adalah
  perapian tersendiri, tidak dicampur ke perubahan ini agar diff tetap terbaca.
- **Tahun ajaran & semester.** Belum ada entitas periode akademik, jadi data
  menumpuk tanpa pemisahan tahun ajaran.
- **Notifikasi dorong.** `public/sw.js` dan manifest PWA sudah ada, tetapi
  pengumuman hanya muncul saat aplikasi dibuka.
