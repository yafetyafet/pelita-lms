-- =====================================================================
-- PRA-MIGRASI (KONDISIONAL)
-- =====================================================================
-- Saat perubahan ini dibuat, tabel "Attendance" pada basis data produksi
-- masih KOSONG (0 baris) dan tidak ada nama Class/Subject yang ganda, jadi
-- `prisma db push` bisa dijalankan langsung TANPA skrip ini.
--
-- Skrip ini disimpan untuk satu keadaan: bila `db push` baru dijalankan
-- SETELAH aplikasi mulai mengumpulkan presensi. Menambah kolom NOT NULL
-- tanpa default ke tabel yang sudah berisi baris akan gagal, dan indeks
-- UNIQUE baru bisa bentrok dengan data yang sudah ada.
--
-- Cek dulu:
--   SELECT count(*) FROM "Attendance";
-- Kalau hasilnya 0  -> lewati skrip ini, langsung `npx prisma db push`.
-- Kalau lebih dari 0 -> jalankan skrip ini di Supabase SQL Editor dulu.
--
-- Skrip ini idempotent (aman dijalankan berulang).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Tambahkan kolom baru sebagai nullable lebih dulu
-- ---------------------------------------------------------------------
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "dateKey"      text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "slotKey"      text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "subjectId"    text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "kind"         text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "note"         text;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "distance"     double precision;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "recordedById" text;

-- ---------------------------------------------------------------------
-- 2. Isi data lama. Semua presensi lama adalah presensi harian (DAILY).
--    Catatan zona waktu: kolom "date" berisi timestamp UTC, sedangkan hari
--    sekolah memakai WIB (UTC+7). Konversi dulu supaya presensi pagi tidak
--    terhitung ke tanggal sebelumnya.
-- ---------------------------------------------------------------------
UPDATE "Attendance"
SET "dateKey" = to_char(("date" + interval '7 hours'), 'YYYY-MM-DD')
WHERE "dateKey" IS NULL;

UPDATE "Attendance"
SET "slotKey" = "dateKey" || '|DAILY'
WHERE "slotKey" IS NULL;

UPDATE "Attendance" SET "kind" = 'DAILY' WHERE "kind" IS NULL;

-- ---------------------------------------------------------------------
-- 3. Buang duplikat presensi harian agar UNIQUE(userId, slotKey) lolos.
--    Baris tertua dipertahankan; sisanya dihapus.
-- ---------------------------------------------------------------------
DELETE FROM "Attendance" a
USING "Attendance" b
WHERE a."userId"  = b."userId"
  AND a."slotKey" = b."slotKey"
  AND (
        a."createdAt" > b."createdAt"
     OR (a."createdAt" = b."createdAt" AND a."id" > b."id")
  );

-- ---------------------------------------------------------------------
-- 4. Kunci NOT NULL supaya cocok dengan prisma/schema.prisma
-- ---------------------------------------------------------------------
ALTER TABLE "Attendance" ALTER COLUMN "dateKey" SET NOT NULL;
ALTER TABLE "Attendance" ALTER COLUMN "slotKey" SET NOT NULL;
ALTER TABLE "Attendance" ALTER COLUMN "kind"    SET DEFAULT 'DAILY';
ALTER TABLE "Attendance" ALTER COLUMN "kind"    SET NOT NULL;

COMMIT;

-- =====================================================================
-- 5. PEMERIKSAAN — pastikan ketiga kueri ini mengembalikan 0 baris
--    sebelum `db push`. Schema baru memberi UNIQUE pada Class.name,
--    Subject.name, dan ExamSubmission(examId, userId).
-- =====================================================================
-- SELECT name, count(*) FROM "Class"   GROUP BY name HAVING count(*) > 1;
-- SELECT name, count(*) FROM "Subject" GROUP BY name HAVING count(*) > 1;
-- SELECT "examId", "userId", count(*) FROM "ExamSubmission"
--   GROUP BY "examId", "userId" HAVING count(*) > 1;
