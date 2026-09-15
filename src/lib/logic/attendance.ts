export type StatusPresensi = "hadir" | "terlambat" | "perlu_verifikasi" | "tanpa_lokasi" | "alpa" | "pulang_tidak_tercatat";

export type Jendela = { mulai: string; selesai: string };

export type HasilValidasi =
  | { ok: true }
  | { ok: false; alasan: "akurasi_buruk" | "di_luar_radius"; pesan: string };

export type KeputusanPresensi =
  | {
      diterima: true;
      status: StatusPresensi;
      pesan: string;
      dalamJendela: boolean;
    }
  | { diterima: false; pesan: string };

export function keMenit(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function dalamJendela(waktu: Date, mulai: string, selesai: string): boolean {
  const menitSekarang = waktu.getHours() * 60 + waktu.getMinutes();
  return menitSekarang >= keMenit(mulai) && menitSekarang <= keMenit(selesai);
}

export function tentukanStatus(args: {
  jenis: "datang" | "pulang";
  waktu: Date;
  jendela: Jendela;
  validasi: HasilValidasi | null; // null = izin lokasi ditolak browser
}): KeputusanPresensi {
  const { jenis, waktu, jendela, validasi } = args;

  if (validasi && !validasi.ok && validasi.alasan === "akurasi_buruk") {
    return { diterima: false, pesan: validasi.pesan };
  }

  const sebelumJendela = waktu.getHours() * 60 + waktu.getMinutes() < keMenit(jendela.mulai);
  if (sebelumJendela) {
    return {
      diterima: false,
      pesan: `Presensi ${jenis} baru dibuka pukul ${jendela.mulai}.`,
    };
  }

  const tepatWaktu = dalamJendela(waktu, jendela.mulai, jendela.selesai);

  if (validasi === null) {
    return {
      diterima: true,
      status: "tanpa_lokasi",
      dalamJendela: tepatWaktu,
      pesan: "Presensi dicatat tanpa data lokasi karena izin lokasi tidak diberikan. Guru piket akan meninjau.",
    };
  }

  if (!validasi.ok) {
    return {
      diterima: true,
      status: "perlu_verifikasi",
      dalamJendela: tepatWaktu,
      pesan: validasi.pesan,
    };
  }

  if (jenis === "pulang") {
    return {
      diterima: true,
      status: "hadir",
      dalamJendela: tepatWaktu,
      pesan: tepatWaktu
        ? "Presensi pulang tercatat. Hati-hati di jalan."
        : "Presensi pulang tercatat di luar jam pulang dan akan ditinjau.",
    };
  }

  return tepatWaktu
    ? {
        diterima: true,
        status: "hadir",
        dalamJendela: true,
        pesan: "Presensi tercatat. Selamat belajar.",
      }
    : {
        diterima: true,
        status: "terlambat",
        dalamJendela: false,
        pesan: `Kamu tercatat terlambat (jendela datang berakhir pukul ${jendela.selesai}).`,
      };
}

export function statusHarian(args: {
  datang?: { status: StatusPresensi };
  pulang?: { status: StatusPresensi };
  jendelaPulangSelesai: string;
  sekarang: Date;
  adaIzinPulang?: boolean;
}): { kehadiran: StatusPresensi; statusPulang: StatusPresensi | null } {
  const { datang, pulang, jendelaPulangSelesai, sekarang, adaIzinPulang } = args;

  const kehadiran: StatusPresensi = datang ? datang.status : "alpa";

  if (pulang) return { kehadiran, statusPulang: pulang.status };

  const jendelaTutup =
    sekarang.getHours() * 60 + sekarang.getMinutes() > keMenit(jendelaPulangSelesai);

  if (!datang || !jendelaTutup || adaIzinPulang) {
    return { kehadiran, statusPulang: null };
  }
  return { kehadiran, statusPulang: "pulang_tidak_tercatat" };
}

export function hitungJarakGeofence(
  lat: number,
  lng: number,
  sLat: number,
  sLng: number,
  radius: number
): HasilValidasi {
  const R = 6371e3;
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (sLat * Math.PI) / 180;
  const dPhi = ((sLat - lat) * Math.PI) / 180;
  const dLam = ((sLng - lng) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) * Math.sin(dLam / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = Math.round(R * c);

  // You can also add accuracy checks if passed from frontend
  if (distance > radius) {
    return {
      ok: false,
      alasan: "di_luar_radius",
      pesan: `Gagal presensi. Anda berada di luar zona sekolah (Jarak Anda: ${distance} meter, Maksimal: ${radius} meter).`,
    };
  }

  return { ok: true };
}
