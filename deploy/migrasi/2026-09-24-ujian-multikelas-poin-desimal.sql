-- Migrasi: ujian bisa dipakai beberapa rombel, dan bobot soal boleh desimal.
--
-- PENTING: migrasi ini MEMINDAHKAN data, bukan hanya menambah kolom.
-- Kolom "Exam"."classId" dihapus di akhir, setelah isinya disalin ke tabel
-- "ExamClass". Urutan di bawah dibuat supaya tidak ada ujian yang kehilangan
-- rombelnya, dan seluruhnya berada dalam satu transaksi: kalau ada satu
-- langkah gagal, tidak ada yang berubah sama sekali.
--
-- Jalankan SETELAH mencadangkan basis data.

BEGIN;

-- 1. Bobot soal jadi pecahan ------------------------------------------------
-- Nilai lama (integer) tetap sah sebagai Float, jadi tidak ada data yang
-- berubah artinya: 10 tetap 10, hanya kini 2.5 ikut bisa disimpan.
ALTER TABLE "ExamQuestion" ALTER COLUMN "points" TYPE DOUBLE PRECISION;

-- 2. Tabel rombel peserta ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "ExamClass" (
  "examId"  TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  CONSTRAINT "ExamClass_pkey" PRIMARY KEY ("examId", "classId")
);

-- 3. Pindahkan rombel yang sudah ada ---------------------------------------
-- Dijalankan SEBELUM kolom lama dihapus. ON CONFLICT membuat langkah ini
-- aman diulang bila migrasi sempat terhenti di tengah.
INSERT INTO "ExamClass" ("examId", "classId")
SELECT id, "classId" FROM "Exam"
ON CONFLICT DO NOTHING;

-- 4. Kunci relasi ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "ExamClass_classId_idx" ON "ExamClass"("classId");

ALTER TABLE "ExamClass"
  ADD CONSTRAINT "ExamClass_examId_fkey"
  FOREIGN KEY ("examId") REFERENCES "Exam"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExamClass"
  ADD CONSTRAINT "ExamClass_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Pemeriksaan sebelum menghapus kolom lama -------------------------------
-- Kalau ada satu saja ujian yang rombelnya belum tersalin, seluruh transaksi
-- dibatalkan dan "classId" tetap utuh. Lebih baik migrasi gagal daripada
-- ujian kehilangan rombelnya tanpa ketahuan.
DO $$
DECLARE tertinggal INT;
BEGIN
  SELECT COUNT(*) INTO tertinggal
  FROM "Exam" e
  WHERE NOT EXISTS (SELECT 1 FROM "ExamClass" ec WHERE ec."examId" = e.id);

  IF tertinggal > 0 THEN
    RAISE EXCEPTION 'Migrasi dibatalkan: % ujian belum punya rombel di ExamClass', tertinggal;
  END IF;
END $$;

-- 6. Baru sekarang kolom lama dilepas ---------------------------------------
DROP INDEX IF EXISTS "Exam_classId_isPublished_idx";
ALTER TABLE "Exam" DROP COLUMN IF EXISTS "classId";
CREATE INDEX IF NOT EXISTS "Exam_subjectId_idx" ON "Exam"("subjectId");

COMMIT;
