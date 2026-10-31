/**
 * Kaidah pengawasan ujian: mengubah kejadian mentah di peramban menjadi
 * penilaian "ini layar terbagi atau bukan".
 *
 * Sengaja dipisahkan dari komponen supaya bisa diuji tanpa DOM. Semua fungsi
 * di sini murni - masukannya angka, keluarannya keputusan.
 *
 * Batas kemampuan yang perlu disadari: peramban tidak punya API "apakah saya
 * sedang di mode layar terbagi". Yang bisa diamati hanyalah ukuran jendela
 * dibanding ukuran layar. Karena itu deteksinya berbentuk dugaan kuat, bukan
 * bukti, dan hasilnya dicatat untuk pengawas - bukan dipakai menggugurkan
 * ujian secara otomatis.
 */

export type JenisPelanggaran =
  | "pindahTab"
  | "layarTerbagi"
  | "keluarFullscreen"
  | "hilangFokus";

export type RincianPelanggaran = Partial<Record<JenisPelanggaran, number>>;

export const LABEL_PELANGGARAN: Record<JenisPelanggaran, string> = {
  pindahTab: "berpindah tab/aplikasi",
  layarTerbagi: "layar terbagi",
  keluarFullscreen: "keluar mode layar penuh",
  hilangFokus: "jendela kehilangan fokus",
};

/**
 * Ambang rasio luas jendela terhadap luas layar.
 *
 * Di bawah angka ini, jendela ujian dianggap hanya menempati sebagian layar -
 * ciri khas mode layar terbagi Android/iPad. Dipilih 0,62 dari pengamatan
 * bahwa pembagian layar paling longgar di Android memberi sekitar 60% tinggi
 * layar kepada jendela atas, sementara peramban yang normal (dengan bilah
 * alamat dan bilah navigasi sistem) masih di kisaran 80-88%.
 */
export const AMBANG_RASIO = 0.62;

/**
 * Rasio minimum yang dianggap wajar untuk perubahan sesaat, mis. papan ketik
 * virtual muncul. Papan ketik memotong tinggi jauh lebih banyak daripada
 * layar terbagi, jadi perlu dibedakan - lihat `kemungkinanPapanKetik`.
 */
export const AMBANG_PAPAN_KETIK = 0.45;

export type UkuranLayar = {
  /** Lebar area isi jendela, px CSS. */
  lebarJendela: number;
  /** Tinggi area isi jendela, px CSS. */
  tinggiJendela: number;
  /** Lebar layar perangkat, px CSS. */
  lebarLayar: number;
  /** Tinggi layar perangkat, px CSS. */
  tinggiLayar: number;
};

/** Rasio luas jendela terhadap luas layar, 0-1. */
export function rasioLuas(u: UkuranLayar): number {
  const luasLayar = u.lebarLayar * u.tinggiLayar;
  if (luasLayar <= 0) return 1;
  const luasJendela = u.lebarJendela * u.tinggiJendela;
  return Math.min(1, luasJendela / luasLayar);
}

/**
 * Apakah penyusutan ini lebih mirip papan ketik virtual daripada layar
 * terbagi?
 *
 * Papan ketik hanya memotong TINGGI dan tidak menyentuh lebar. Layar terbagi
 * di ponsel juga memotong tinggi, tetapi jendela yang tersisa biasanya masih
 * lebih besar dari sisa ruang di atas papan ketik. Pembeda yang andal:
 * papan ketik hanya muncul saat ada elemen isian yang sedang difokuskan.
 */
export function kemungkinanPapanKetik(args: {
  u: UkuranLayar;
  adaIsianAktif: boolean;
}): boolean {
  const { u, adaIsianAktif } = args;
  if (!adaIsianAktif) return false;
  // Lebar tidak berubah berarti bukan pembagian layar kiri-kanan.
  const lebarUtuh = u.lebarJendela >= u.lebarLayar * 0.92;
  return lebarUtuh;
}

export type PutusanLayar = {
  terbagi: boolean;
  rasio: number;
  alasan: string;
};

/**
 * Keputusan akhir "layar sedang terbagi atau tidak".
 *
 * `adaIsianAktif` dipakai untuk mengampuni penyusutan akibat papan ketik.
 * Tanpa pengampunan ini, setiap siswa yang mengetik jawaban esai akan
 * tercatat melanggar - kesalahan yang jauh lebih merusak daripada
 * meloloskan satu-dua kasus layar terbagi.
 */
export function nilaiLayar(args: {
  u: UkuranLayar;
  adaIsianAktif: boolean;
}): PutusanLayar {
  const { u, adaIsianAktif } = args;
  const rasio = rasioLuas(u);

  if (rasio >= AMBANG_RASIO) {
    return { terbagi: false, rasio, alasan: "" };
  }

  if (kemungkinanPapanKetik({ u, adaIsianAktif }) && rasio >= AMBANG_PAPAN_KETIK) {
    return { terbagi: false, rasio, alasan: "papan ketik" };
  }

  return {
    terbagi: true,
    rasio,
    alasan: `jendela ujian hanya menempati ${Math.round(rasio * 100)}% layar`,
  };
}

/** Jumlahkan seluruh rincian menjadi satu angka untuk `violationCount`. */
export function totalPelanggaran(rincian: RincianPelanggaran): number {
  return Object.values(rincian).reduce<number>((t, n) => t + (n ?? 0), 0);
}

/** Kalimat ringkas untuk pengawas, mis. "3x berpindah tab, 1x layar terbagi". */
export function ringkasPelanggaran(rincian: RincianPelanggaran): string {
  const bagian = (Object.keys(LABEL_PELANGGARAN) as JenisPelanggaran[])
    .filter((k) => (rincian[k] ?? 0) > 0)
    .map((k) => `${rincian[k]}x ${LABEL_PELANGGARAN[k]}`);
  return bagian.join(", ");
}

/** Baca rincian dari kolom JSON, tahan terhadap data rusak. */
export function bacaRincian(json: string | null | undefined): RincianPelanggaran {
  if (!json) return {};
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return {};
    const hasil: RincianPelanggaran = {};
    for (const k of Object.keys(LABEL_PELANGGARAN) as JenisPelanggaran[]) {
      const n = Number((obj as Record<string, unknown>)[k]);
      if (Number.isFinite(n) && n > 0) hasil[k] = Math.floor(n);
    }
    return hasil;
  } catch {
    return {};
  }
}
