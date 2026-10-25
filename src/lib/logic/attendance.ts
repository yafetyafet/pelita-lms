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

  if (validasi === null) {
    return {
      diterima: false,
      pesan: "Presensi gagal. GPS harus aktif dan izin lokasi harus diberikan.",
    };
  }

  if (!validasi.ok) {
    return {
      diterima: false,
      pesan: validasi.pesan,
    };
  }

  const sebelumJendela = waktu.getHours() * 60 + waktu.getMinutes() < keMenit(jendela.mulai);
  if (sebelumJendela) {
    return {
      diterima: false,
      pesan: `Presensi ${jenis} baru dibuka pukul ${jendela.mulai}.`,
    };
  }

  const tepatWaktu = dalamJendela(waktu, jendela.mulai, jendela.selesai);

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

/** Jarak haversine antara dua koordinat, dibulatkan ke meter. */
export function jarakMeter(
  lat: number,
  lng: number,
  sLat: number,
  sLng: number
): number {
  const R = 6371e3;
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (sLat * Math.PI) / 180;
  const dPhi = ((sLat - lat) * Math.PI) / 180;
  const dLam = ((sLng - lng) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) * Math.sin(dLam / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/** Satu titik lokasi sekolah beserta radius tolerarnsinya. */
export type LokasiSekolah = {
  nama: string;
  lat: number;
  lng: number;
  radius: number;
};

export type HasilMultiLokasi = {
  validasi: HasilValidasi;
  /** Jarak ke lokasi TERDEKAT, meter. */
  distance: number;
  /** Lokasi terdekat — bukan tentu lokasi yang lolos radius. */
  terdekat: LokasiSekolah;
};

/**
 * Validasi lokasi terhadap beberapa gedung sekolah sekaligus.
 *
 * Sekolah menempati dua gedung yang berjarak sekitar 5 km, sehingga satu
 * titik pusat tidak mungkin mencakup keduanya — radius yang cukup besar untuk
 * menjangkau dua-duanya juga akan meloloskan seluruh permukiman di antaranya.
 * Karena itu presensi dianggap sah bila siswa berada dalam radius SALAH SATU
 * gedung.
 */
export function hitungJarakMultiLokasi(
  lat: number,
  lng: number,
  lokasi: LokasiSekolah[]
): HasilMultiLokasi | null {
  if (lokasi.length === 0) return null;

  const terukur = lokasi
    .map((l) => ({ lokasi: l, jarak: jarakMeter(lat, lng, l.lat, l.lng) }))
    .sort((a, b) => a.jarak - b.jarak);

  const terdekat = terukur[0];
  const lolos = terukur.find((t) => t.jarak <= t.lokasi.radius);

  if (lolos) {
    return { validasi: { ok: true }, distance: lolos.jarak, terdekat: lolos.lokasi };
  }

  const rincian = terukur
    .map((t) => `${t.lokasi.nama} ${t.jarak} m`)
    .join(", ");

  return {
    validasi: {
      ok: false,
      alasan: "di_luar_radius",
      pesan:
        terukur.length === 1
          ? `Gagal presensi. Anda berada di luar zona sekolah (Jarak Anda: ${terdekat.jarak} meter, Maksimal: ${terdekat.lokasi.radius} meter).`
          : `Gagal presensi. Anda berada di luar zona kedua gedung sekolah (${rincian}).`,
    },
    distance: terdekat.jarak,
    terdekat: terdekat.lokasi,
  };
}

export function hitungJarakGeofence(
  lat: number,
  lng: number,
  sLat: number,
  sLng: number,
  radius: number
): HasilValidasi {
  const distance = jarakMeter(lat, lng, sLat, sLng);

  if (distance > radius) {
    return {
      ok: false,
      alasan: "di_luar_radius",
      pesan: `Gagal presensi. Anda berada di luar zona sekolah (Jarak Anda: ${distance} meter, Maksimal: ${radius} meter).`,
    };
  }

  return { ok: true };
}

/**
 * Batas akurasi (meter) agar lokasi dianggap berasal dari GPS yang aktif.
 * Lokasi perkiraan WiFi/IP/menara seluler (saat GPS mati) biasanya
 * berakurasi ratusan hingga ribuan meter, jadi ditolak.
 */
export const AKURASI_GPS_MAKS = 100;
/** Umur maksimal data lokasi agar tidak memakai posisi cache. */
export const UMUR_LOKASI_MAKS_MS = 2 * 60 * 1000;

/**
 * Pastikan koordinat berasal dari GPS yang aktif. Mengembalikan pesan galat
 * atau `null` bila sah.
 */
export function periksaSinyalGps(
  lat: number,
  lng: number,
  sinyal: { accuracy?: number | null; timestamp?: number | null } | undefined,
  label: string
): string | null {
  const pesanGps = `${label} gagal. GPS harus aktif dan izin lokasi harus diberikan.`;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return pesanGps;
  if (lat === 0 && lng === 0) return pesanGps;

  const akurasi = sinyal?.accuracy;
  if (typeof akurasi !== "number" || !Number.isFinite(akurasi) || akurasi <= 0) {
    return pesanGps;
  }
  if (akurasi > AKURASI_GPS_MAKS) {
    return `${label} gagal. Sinyal GPS tidak akurat (±${Math.round(akurasi)} m, maksimal ±${AKURASI_GPS_MAKS} m). Pastikan GPS/Lokasi akurasi tinggi menyala lalu coba lagi di area terbuka.`;
  }

  const ts = sinyal?.timestamp;
  if (typeof ts === "number" && Number.isFinite(ts)) {
    if (Math.abs(Date.now() - ts) > UMUR_LOKASI_MAKS_MS) {
      return `${label} gagal. Data lokasi sudah kedaluwarsa, perbarui lokasi GPS lalu coba lagi.`;
    }
  }
  return null;
}
