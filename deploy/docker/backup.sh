#!/usr/bin/env bash
# Backup harian PELITA (varian Docker). Jalankan lewat crontab pengguna sk:
#   0 22 * * *  /home/sk/pelita/backup.sh >> /home/sk/pelita/backup/backup.log 2>&1
#
# Snapshot Proxmox TIDAK menggantikan ini - tersimpan di mesin yang sama.
# Salin hasilnya keluar server (lihat bagian akhir).
set -euo pipefail
cd "$(dirname "$0")"
STAMP=$(date +%Y%m%d-%H%M%S)
BERKAS="backup/pelita-$STAMP.sql.gz"
docker compose exec -T db pg_dump -U pelita -d pelita --no-owner --no-privileges | gzip -9 > "$BERKAS"
# Backup kosong lebih berbahaya daripada tidak ada: terlihat aman padahal tidak.
TABEL=$(gzip -dc "$BERKAS" | grep -c "^CREATE TABLE" || true)
[[ "$TABEL" -ge 20 ]] || { echo "PERINGATAN: $BERKAS hanya memuat $TABEL tabel. Periksa!"; exit 1; }
find backup -name "pelita-*.sql.gz" -mtime +14 -delete
echo "$(date "+%Y-%m-%d %H:%M") ok $BERKAS ($(du -h "$BERKAS" | cut -f1), $TABEL tabel)"
# --- Salin ke luar server: aktifkan salah satu ---
# scp -q "$BERKAS" petugas@192.100.1.20:/backup/pelita/ || echo "PERINGATAN: salinan keluar GAGAL"
# rclone copy "$BERKAS" gdrive:BackupPELITA/ || echo "PERINGATAN: salinan ke Drive GAGAL"
