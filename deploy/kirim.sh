#!/usr/bin/env bash
#
# Build di komputer sekolah, lalu kirim hasilnya ke server.
#
#   bash deploy/kirim.sh pelita@192.168.1.50
#   bash deploy/kirim.sh pelita@192.168.1.50 --tanpa-build
#
# Build TIDAK dilakukan di server: `next build` butuh memori jauh lebih besar
# daripada menjalankannya, dan node_modules menempati ~920 MB. Di VM kecil itu
# mudah gagal kehabisan memori.
#
# Yang dikirim hanya hasil standalone (~56 MB) beserta berkas statis dan
# public - bukan seluruh node_modules.

set -euo pipefail

TUJUAN="${1:-}"
[[ -z "$TUJUAN" ]] && { echo "Pakai: bash deploy/kirim.sh pengguna@alamat-server"; exit 1; }
BUILD=1
[[ "${2:-}" == "--tanpa-build" ]] && BUILD=0

STAMP=$(date +%Y%m%d-%H%M%S)
RILIS="/opt/pelita/rilis/$STAMP"

biru() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

if [[ $BUILD -eq 1 ]]; then
  biru "1/5  Membangun aplikasi"
  npx next build
fi

[[ -d .next/standalone ]] || {
  echo "GAGAL: .next/standalone tidak ada. Pastikan output: 'standalone' ada di next.config.ts"
  exit 1
}

biru "2/5  Menyiapkan paket kirim"
# Standalone tidak menyertakan berkas statis maupun public; keduanya harus
# disalin masuk agar halaman tidak tampil tanpa gaya dan logo.
rm -rf .kirim && mkdir -p .kirim
cp -r .next/standalone/. .kirim/
mkdir -p .kirim/.next
cp -r .next/static .kirim/.next/static
[[ -d public ]] && cp -r public .kirim/public
# Prisma perlu skemanya untuk menjalankan migrasi di server.
mkdir -p .kirim/prisma && cp prisma/schema.prisma .kirim/prisma/

UKURAN=$(du -sh .kirim 2>/dev/null | cut -f1 || echo '?')
echo "    ukuran paket: $UKURAN"

biru "3/5  Mengirim ke $TUJUAN:$RILIS"
ssh "$TUJUAN" "mkdir -p $RILIS"
rsync -az --delete --info=progress2 .kirim/ "$TUJUAN:$RILIS/"

biru "4/5  Mengalihkan ke rilis baru"
# `current` adalah symlink. Menukarnya bersifat seketika, sehingga jendela
# waktu aplikasi tidak tersedia hanya selama satu kali restart.
ssh "$TUJUAN" "
  set -e
  ln -sfn $RILIS /opt/pelita/current.baru
  mv -Tf /opt/pelita/current.baru /opt/pelita/current
  sudo systemctl restart pelita
  # Simpan 3 rilis terakhir saja; disk VM tidak besar.
  ls -1dt /opt/pelita/rilis/*/ | tail -n +4 | xargs -r rm -rf
"

biru "5/5  Memeriksa hasil"
sleep 3
ssh "$TUJUAN" "systemctl is-active pelita && curl -sS -o /dev/null -w 'HTTP %{http_code} dalam %{time_total}s\n' http://127.0.0.1:3000/login"

rm -rf .kirim
echo
echo "Selesai. Rilis: $STAMP"
echo "Kalau bermasalah, kembalikan ke rilis sebelumnya:"
echo "  ssh $TUJUAN 'ln -sfn \$(ls -1dt /opt/pelita/rilis/*/ | sed -n 2p) /opt/pelita/current && sudo systemctl restart pelita'"
