# Image runtime PELITA: node:22-slim + OpenSSL.
#
# node:22-slim tidak menyertakan libssl sama sekali, sedangkan engine Prisma
# untuk Linux (debian-openssl-3.0.x) memuat libssl.so.3 saat dijalankan.
# Tanpa ini aplikasi tampak sehat - halaman login terbuka - lalu gagal pada
# kueri basis data pertama, yaitu saat siswa menekan tombol masuk.
#
# Aplikasinya sendiri TIDAK disalin ke image; ia di-bind-mount dari ./app
# supaya rilis baru cukup kirim berkas + restart, tanpa build image ulang.
FROM node:22-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# wget dipakai skrip kirim.sh untuk memeriksa aplikasi dari dalam kontainer;
# busybox-nya tidak ada di image debian, jadi pakai curl.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /app
