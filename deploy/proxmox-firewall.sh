#!/usr/bin/env bash
#
# Menutup layanan yang tidak seharusnya terbuka ke internet di Proxmox host.
# Dijalankan SEKALI, sebagai root, DI PROXMOX HOST (bukan di VM).
#
#   bash proxmox-firewall.sh
#
# Temuan 22 September 2026, diperiksa dari internet ke 36.93.120.47:
#   port 3306  MariaDB 10.11 menjawab langsung  -> basis data terbuka ke dunia
#   port 9005  MinIO                            -> penyimpanan berkas terbuka
#   port 8006  halaman login Proxmox            -> kendali seluruh server
#   port 22    SSH Proxmox
#
# Yang dilakukan:
#   1. Menghapus aturan DNAT 3306 dan 9005 dari /etc/network/interfaces
#      (dengan cadangan), lalu mencabutnya dari iptables yang sedang jalan.
#   2. Menolak 22 dan 8006 yang datang dari WAN (vmbr0). Akses lewat Tailscale
#      (tailscale0) dan jaringan internal (vmbr1) TIDAK terpengaruh.
#
# ---------------------------------------------------------------------------
# SEBELUM MENJALANKAN - supaya tidak mengunci diri sendiri:
#
#   Pastikan Anda bisa masuk ke Proxmox lewat jalur SELAIN IP publik:
#     ssh root@100.94.249.96        (Tailscale Proxmox)
#   atau lewat konsol fisik/IPMI. Kalau jalur itu terbukti jalan, aman.
#
#   Jalankan skrip ini DARI jalur itu, bukan dari sesi SSH ke IP publik -
#   sesi ke IP publik akan terputus di tengah jalan.
# ---------------------------------------------------------------------------

set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Jalankan sebagai root di Proxmox host."; exit 1; }
[[ -f /etc/pve/.version ]] || { echo "Ini bukan Proxmox host. Berhenti."; exit 1; }

IFACE=/etc/network/interfaces
CADANGAN="$IFACE.sebelum-firewall.$(date +%Y%m%d-%H%M%S)"

biru() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

biru "Cadangan $IFACE -> $CADANGAN"
cp "$IFACE" "$CADANGAN"

biru "1/3  Mencabut penerusan 3306 (MariaDB) dan 9005 (MinIO)"
# Cabut dari iptables yang sedang berjalan. `|| true` karena aturan mungkin
# sudah tidak ada; itu bukan kegagalan.
iptables -t nat -D PREROUTING -p tcp -d 36.93.120.47 --dport 3306 -j DNAT --to-destination 192.100.1.10:3306 2>/dev/null || true
iptables -t nat -D PREROUTING -p tcp --dport 9005 -j DNAT --to-destination 192.100.1.10:9005 2>/dev/null || true

# Hapus dari berkas supaya tidak hidup lagi saat boot. Baris komentar
# penjelasnya ikut dihapus agar tidak menyesatkan.
sed -i \
  -e '/Port Forwarding MariaDB ke VM Next.js/d' \
  -e '/--dport 3306 -j DNAT/d' \
  -e '/# Forwarding MinIO/d' \
  -e '/--dport 9005 -j DNAT/d' \
  "$IFACE"

biru "2/3  Menolak 22 dan 8006 dari WAN"
# Hanya paket yang MASUK lewat vmbr0 (WAN). Tailscale masuk lewat tailscale0
# dan jaringan internal lewat vmbr1 - keduanya tidak tersentuh aturan ini.
if ! iptables -C INPUT -i vmbr0 -p tcp -m multiport --dports 22,8006 -j DROP 2>/dev/null; then
  iptables -I INPUT 1 -i vmbr0 -p tcp -m multiport --dports 22,8006 -j DROP
fi

# Jadikan permanen: disisipkan tepat sesudah baris MASQUERADE di vmbr0.
if ! grep -q 'dports 22,8006 -j DROP' "$IFACE"; then
  sed -i '/post-down iptables -t nat -D POSTROUTING -s .192.100.1.1\/24. -o vmbr0 -j MASQUERADE/a\
        # Tutup SSH dan panel Proxmox dari internet. Akses admin lewat Tailscale.\
        post-up iptables -I INPUT 1 -i vmbr0 -p tcp -m multiport --dports 22,8006 -j DROP\
        post-down iptables -D INPUT -i vmbr0 -p tcp -m multiport --dports 22,8006 -j DROP' "$IFACE"
fi

biru "3/3  Memeriksa"
echo "Aturan NAT yang tersisa (harus tinggal 80,443 dan 7821):"
iptables -t nat -S PREROUTING | grep -v '^-P' || echo "  (tidak ada)"
echo
echo "Aturan INPUT teratas:"
iptables -S INPUT | head -3
echo
echo "Berkas interfaces masih valid?"
ifquery --list >/dev/null && echo "  ya"

cat <<'AKHIR'

Selesai. Periksa dari HP dengan data seluler (bukan wifi sekolah):
  https://36.93.120.47:8006   -> harus TIDAK bisa dibuka
  ssh root@36.93.120.47       -> harus tidak tersambung

Kalau ada yang salah, kembalikan:
  cp /etc/network/interfaces.sebelum-firewall.* /etc/network/interfaces
  iptables -D INPUT -i vmbr0 -p tcp -m multiport --dports 22,8006 -j DROP

Kata sandi root MariaDB di VM sebaiknya DIGANTI - port itu sudah lama
terbuka dan tidak ada cara tahu siapa yang sudah mencoba.
AKHIR
