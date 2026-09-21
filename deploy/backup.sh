#!/usr/bin/env bash
#
# Backup harian basis data PELITA.
# Pasang di /opt/pelita/backup.sh, jalankan lewat cron:
#
#   0 22 * * *  /opt/pelita/backup.sh
#
# Snapshot Proxmox TIDAK menggantikan ini: snapshot tersimpan di mesin yang
# sama, jadi ikut hilang kalau disknya rusak. Salinan di bawah harus disalin
# keluar dari server - ke Google Drive, komputer sekolah, atau hard disk luar.

set -euo pipefail

TUJUAN=/opt/pelita/backup
SIMPAN_HARI=14
STAMP=$(date +%Y%m%d-%H%M%S)
BERKAS="$TUJUAN/pelita-$STAMP.sql.gz"

mkdir -p "$TUJUAN"

# Kredensial dibaca dari berkas layanan supaya tidak ditulis dua kali.
set -a
# shellcheck disable=SC1091
source /opt/pelita/pelita.env
set +a

# Parameter ?connection_limit=... tidak dipahami pg_dump, jadi dibuang.
URL="${DATABASE_URL%%\?*}"
URL="${URL%\"}"
URL="${URL#\"}"

pg_dump "$URL" --no-owner --no-privileges | gzip -9 > "$BERKAS"

UKURAN=$(du -h "$BERKAS" | cut -f1)

# Backup kosong lebih berbahaya daripada tidak ada backup: ia terlihat aman
# padahal tidak. Periksa hasilnya benar-benar berisi.
BARIS=$(gzip -dc "$BERKAS" | head -100 | grep -c 'CREATE TABLE' || true)
if [[ "$BARIS" -eq 0 ]]; then
  echo "PERINGATAN: $BERKAS tidak memuat satu pun CREATE TABLE. Periksa segera." >&2
  exit 1
fi

find "$TUJUAN" -name 'pelita-*.sql.gz' -mtime +$SIMPAN_HARI -delete

echo "$(date '+%Y-%m-%d %H:%M') backup selesai: $BERKAS ($UKURAN)"

# ---------------------------------------------------------------------------
# Salin ke luar server.
#
# Backup yang hanya ada di server yang sama tidak menolong kalau servernya
# yang rusak. Aktifkan salah satu di bawah sesuai yang tersedia di sekolah.
# ---------------------------------------------------------------------------

# Contoh 1 - salin ke komputer sekolah lewat SSH:
# scp -q "$BERKAS" petugas@192.168.1.10:/backup/pelita/ || \
#   echo "PERINGATAN: salinan ke luar server GAGAL" >&2

# Contoh 2 - Google Drive lewat rclone (perlu `rclone config` sekali):
# rclone copy "$BERKAS" gdrive:BackupPELITA/ || \
#   echo "PERINGATAN: salinan ke Google Drive GAGAL" >&2
