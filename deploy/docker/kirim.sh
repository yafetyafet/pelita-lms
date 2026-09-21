#!/usr/bin/env bash
#
# Build di komputer sekolah, kirim ke VM, muat ulang kontainer aplikasi.
# Varian Docker - tanpa sudo di server.
#
#   bash deploy/docker/kirim.sh                # build lalu kirim
#   bash deploy/docker/kirim.sh --tanpa-build  # kirim hasil build yang ada
#
# Tujuan: sk@100.115.131.69:~/pelita/app  (lewat Tailscale)

set -euo pipefail

TUJUAN="sk@100.115.131.69"
DIR_SERVER="pelita"
BUILD=1
[[ "${1:-}" == "--tanpa-build" ]] && BUILD=0

biru() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

if [[ $BUILD -eq 1 ]]; then
  biru "1/4  Prisma generate (engine Linux) + next build"
  npx prisma generate >/dev/null
  npx next build
fi

[[ -d .next/standalone ]] || { echo "GAGAL: .next/standalone tidak ada."; exit 1; }
[[ -f .next/standalone/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node ]] \
  || { echo "GAGAL: engine Prisma untuk Linux tidak ikut. Periksa binaryTargets di schema.prisma."; exit 1; }

biru "2/4  Menyiapkan paket"
rm -rf .kirim && mkdir -p .kirim
cp -r .next/standalone/. .kirim/
mkdir -p .kirim/.next && cp -r .next/static .kirim/.next/static
[[ -d public ]] && cp -r public .kirim/public
mkdir -p .kirim/prisma .kirim/.next/cache && cp prisma/schema.prisma .kirim/prisma/
echo "    $(du -sh .kirim | cut -f1)"

biru "3/4  Mengirim ke $TUJUAN:~/$DIR_SERVER/app"
# tar lewat ssh, bukan rsync: Git Bash di Windows tidak menyertakan rsync.
# Dibongkar ke folder sementara dulu lalu ditukar, supaya kontainer tidak
# sempat membaca folder yang setengah terisi.
tar czf - -C .kirim . | ssh "$TUJUAN" "
  rm -rf ~/$DIR_SERVER/app.baru && mkdir -p ~/$DIR_SERVER/app.baru &&
  tar xzf - -C ~/$DIR_SERVER/app.baru &&
  rm -rf ~/$DIR_SERVER/app && mv ~/$DIR_SERVER/app.baru ~/$DIR_SERVER/app &&
  echo \"    diterima: \$(du -sh ~/$DIR_SERVER/app | cut -f1)\""
rm -rf .kirim

biru "4/4  Memuat ulang kontainer aplikasi"
ssh "$TUJUAN" "cd ~/$DIR_SERVER && docker compose restart app && sleep 4 && docker compose ps app && \
  docker compose exec -T app sh -c 'wget -qO- http://127.0.0.1:3000/login >/dev/null && echo \"HTTP OK dari dalam kontainer\"'"

echo; echo "Selesai."
