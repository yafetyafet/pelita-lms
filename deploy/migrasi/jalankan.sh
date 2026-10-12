#!/usr/bin/env bash
#
# Jalankan migrasi basis data PELITA yang belum diterapkan, dengan pengaman.
#
#   bash deploy/migrasi/jalankan.sh
#
# Urutannya: cadangkan -> migrasi 1 -> migrasi 2 -> verifikasi.
# Berhenti pada galat pertama; tiap berkas migrasi sudah dibungkus transaksi
# sendiri, jadi kegagalan di tengah tidak meninggalkan skema separuh jadi.

set -euo pipefail

TUJUAN="sk@100.115.131.69"
biru() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

biru "1/4  Mencadangkan basis data"
ssh "$TUJUAN" 'cd ~/pelita && CAD=~/cadangan-sebelum-migrasi-$(date +%Y%m%d-%H%M).sql.gz \
  && docker compose exec -T db pg_dump -U pelita -d pelita | gzip > "$CAD" \
  && ls -lh "$CAD"'

biru "2/4  Mengirim berkas migrasi"
scp -q deploy/migrasi/2026-09-23-perangkat-dan-antikecurangan.sql \
       deploy/migrasi/2026-09-24-ujian-multikelas-poin-desimal.sql \
       "$TUJUAN:/tmp/"

biru "3/4  Menerapkan migrasi"
ssh "$TUJUAN" 'cd ~/pelita
  docker compose exec -T db psql -U pelita -d pelita -v ON_ERROR_STOP=1 -q \
    < /tmp/2026-09-23-perangkat-dan-antikecurangan.sql && echo "    migrasi 1 (perangkat & anti-kecurangan) OK"
  docker compose exec -T db psql -U pelita -d pelita -v ON_ERROR_STOP=1 -q \
    < /tmp/2026-09-24-ujian-multikelas-poin-desimal.sql && echo "    migrasi 2 (ujian multi-rombel & poin desimal) OK"
  rm -f /tmp/2026-09-*.sql'

biru "4/4  Verifikasi"
ssh "$TUJUAN" 'cd ~/pelita && docker compose exec -T db psql -U pelita -d pelita -c "
SELECT '"'"'ujian tanpa rombel (harus 0)'"'"' AS periksa, COUNT(*)::text AS hasil
FROM \"Exam\" e WHERE NOT EXISTS (SELECT 1 FROM \"ExamClass\" x WHERE x.\"examId\"=e.id)
UNION ALL SELECT '"'"'kolom Exam.classId (harus 0)'"'"', COUNT(*)::text
FROM information_schema.columns WHERE table_name='"'"'Exam'"'"' AND column_name='"'"'classId'"'"'
UNION ALL SELECT '"'"'points bertipe pecahan (harus 1)'"'"', COUNT(*)::text
FROM information_schema.columns WHERE table_name='"'"'ExamQuestion'"'"' AND column_name='"'"'points'"'"' AND data_type='"'"'double precision'"'"'
UNION ALL SELECT '"'"'kolom sesi di User (harus 3)'"'"', COUNT(*)::text
FROM information_schema.columns WHERE table_name='"'"'User'"'"' AND column_name LIKE '"'"'sesi%'"'"'
UNION ALL SELECT '"'"'jumlah ujian'"'"', COUNT(*)::text FROM \"Exam\"
UNION ALL SELECT '"'"'jumlah soal'"'"', COUNT(*)::text FROM \"ExamQuestion\";"'

printf '\n\033[1;32mMigrasi selesai. Lanjutkan dengan:\033[0m\n  bash deploy/docker/kirim.sh --tanpa-build\n\n'
