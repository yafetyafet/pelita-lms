#!/usr/bin/env bash
#
# Pemasangan awal PELITA LMS di VM Ubuntu Server.
# Dijalankan SEKALI, sebagai pengguna yang punya sudo.
#
#   bash pasang-server.sh
#
# Yang dipasang: Node.js 22, PostgreSQL, Caddy, pengguna layanan, swap,
# rotasi log, dan basis data kosong. Aplikasinya sendiri dikirim belakangan
# lewat kirim.sh dari komputer sekolah.

set -euo pipefail

DOMAIN="${DOMAIN:-}"
DB_NAME=pelita
DB_USER=pelita

biru() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
galat() { printf '\033[1;31mGAGAL: %s\033[0m\n' "$1" >&2; exit 1; }

[[ $EUID -eq 0 ]] && galat "Jangan jalankan sebagai root. Pakai pengguna biasa yang punya sudo."
command -v sudo >/dev/null || galat "sudo tidak tersedia."

biru "1/9  Memperbarui daftar paket"
sudo apt-get update -qq

biru "2/9  Swap 2 GB"
# Tanpa swap, lonjakan memori saat ujian bisa memicu OOM killer dan
# mematikan Postgres atau Node di tengah ujian.
if ! swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-pelita.conf >/dev/null
  sudo sysctl -q -w vm.swappiness=10
  echo "   swap 2 GB aktif"
else
  echo "   swap sudah ada, dilewati"
fi

biru "3/9  Node.js 22"
# Next.js 16 mensyaratkan Node >= 20.9. Repositori bawaan Ubuntu sering
# tertinggal, jadi dipasang dari NodeSource.
if ! command -v node >/dev/null || [[ $(node -v | cut -c2- | cut -d. -f1) -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "   node $(node -v)"

biru "4/9  PostgreSQL"
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

biru "5/9  Setelan PostgreSQL untuk RAM kecil"
# Nilai bawaan mengasumsikan mesin besar. Basis data ini hanya belasan MB,
# jadi shared_buffers kecil pun seluruh isinya tetap muat di memori.
PGCONF=$(sudo -u postgres psql -tAc 'SHOW config_file')
PGDIR=$(dirname "$PGCONF")
sudo tee "$PGDIR/conf.d/pelita.conf" >/dev/null <<'PGC'
shared_buffers = 256MB
effective_cache_size = 768MB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 50
PGC
sudo grep -q "include_dir" "$PGCONF" || echo "include_dir = 'conf.d'" | sudo tee -a "$PGCONF" >/dev/null
sudo mkdir -p "$PGDIR/conf.d"
sudo systemctl restart postgresql

biru "6/9  Basis data dan penggunanya"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
  DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  sudo -u postgres psql -qc "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
  sudo -u postgres psql -qc "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
  echo "   basis data dibuat"
  SIMPAN_PASS="$DB_PASS"
else
  echo "   pengguna basis data sudah ada, kata sandinya tidak diubah"
  SIMPAN_PASS=""
fi

biru "7/9  Pengguna layanan dan folder"
id pelita >/dev/null 2>&1 || sudo useradd --system --create-home --home-dir /opt/pelita --shell /usr/sbin/nologin pelita
sudo mkdir -p /opt/pelita/{current,rilis,backup}
sudo chown -R pelita:pelita /opt/pelita

biru "8/9  Berkas rahasia"
if [[ ! -f /opt/pelita/pelita.env ]]; then
  SESSION_SECRET=$(openssl rand -hex 32)
  [[ -z "$SIMPAN_PASS" ]] && galat "Basis data sudah ada tapi kata sandinya tidak diketahui. Isi /opt/pelita/pelita.env secara manual."
  sudo tee /opt/pelita/pelita.env >/dev/null <<ENV
# Dibuat oleh pasang-server.sh. JANGAN dibagikan.
DATABASE_URL="postgresql://$DB_USER:$SIMPAN_PASS@127.0.0.1:5432/$DB_NAME?connection_limit=8&pool_timeout=20"
SESSION_SECRET="$SESSION_SECRET"
ENV
  sudo chown root:pelita /opt/pelita/pelita.env
  sudo chmod 640 /opt/pelita/pelita.env
  echo "   /opt/pelita/pelita.env dibuat"
  echo
  echo "   PENTING: SESSION_SECRET baru dibuat. Semua pengguna harus login"
  echo "   ulang setelah pindah. Itu wajar - jangan sampai terjadi di hari-H."
else
  echo "   pelita.env sudah ada, tidak ditimpa"
fi

biru "9/9  Caddy dan rotasi log"
if ! command -v caddy >/dev/null; then
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -qq && sudo apt-get install -y caddy
fi
sudo mkdir -p /etc/systemd/journald.conf.d
echo -e '[Journal]\nSystemMaxUse=500M' | sudo tee /etc/systemd/journald.conf.d/pelita.conf >/dev/null
sudo systemctl restart systemd-journald

biru "Selesai"
cat <<'AKHIR'

Langkah berikutnya, berurutan:

  1. Salin berkas layanan dan Caddy:
       sudo cp deploy/pelita.service /etc/systemd/system/
       sudo cp deploy/Caddyfile      /etc/caddy/Caddyfile
     Sunting /etc/caddy/Caddyfile, ganti lms.sekolah.sch.id dengan domain asli.

  2. Pindahkan data dari Supabase (lihat deploy/README.md bagian 4).

  3. Dari komputer sekolah, kirim aplikasinya:
       bash deploy/kirim.sh pelita@IP_SERVER

  4. Nyalakan:
       sudo systemctl daemon-reload
       sudo systemctl enable --now pelita
       sudo systemctl reload caddy

  5. Pasang backup harian:
       sudo cp deploy/backup.sh /opt/pelita/backup.sh
       sudo chmod +x /opt/pelita/backup.sh
       sudo crontab -e
       # tambahkan:  0 22 * * *  /opt/pelita/backup.sh

AKHIR
