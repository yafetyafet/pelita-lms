-- Migrasi: satu akun satu perangkat, rincian pelanggaran ujian,
--          dan sinyal keaslian lokasi presensi.
--
-- Semua kolom bersifat TAMBAHAN dan NULLABLE, jadi aman dijalankan pada
-- basis data yang sedang dipakai: baris lama tetap sah, aplikasi versi lama
-- pun masih bisa berjalan di atas skema ini bila perlu dikembalikan.
--
-- Jalankan sebelum menaikkan versi aplikasi.

-- 1. Kunci perangkat pada akun -------------------------------------------
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sesiId"        TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sesiPerangkat" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sesiSejak"     TIMESTAMP(3);

-- 2. Rincian pelanggaran ujian -------------------------------------------
ALTER TABLE "ExamSubmission" ADD COLUMN IF NOT EXISTS "violationDetail" TEXT;

-- 3. Sinyal keaslian lokasi presensi --------------------------------------
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "accuracy"    DOUBLE PRECISION;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "altitude"    DOUBLE PRECISION;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "mockScore"   INTEGER;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "mockReasons" TEXT;

-- Catatan: TIDAK ada backfill. Kolom kosong pada baris lama memang benar -
-- presensi yang sudah tercatat sebelum fitur ini tidak pernah dinilai
-- keasliannya, dan mengisinya dengan angka apa pun akan menyesatkan.
