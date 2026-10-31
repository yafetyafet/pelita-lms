/**
 * Penilaian keaslian lokasi presensi.
 *
 * Peramban TIDAK menyediakan penanda "lokasi tiruan" seperti Android native
 * (`Location.isFromMockProvider`). Yang sampai ke kita hanyalah angka dari
 * Geolocation API, dan angka itu bisa dipalsukan oleh aplikasi Fake GPS atau
 * oleh DevTools. Jadi modul ini tidak berpura-pura bisa MEMBUKTIKAN pemalsuan;
 * ia mengumpulkan sinyal-sinyal yang secara fisik janggal, lalu menyerahkan
 * keputusan akhir kepada guru.
 *
 * Prinsipnya sengaja dipilih longgar: siswa yang jujur tidak boleh gagal
 * presensi gara-gara ponselnya murah atau sinyalnya buruk. Karena itu skor
 * tinggi hanya menandai presensi sebagai "perlu_verifikasi" — tidak pernah
 * menolaknya. Menolak siswa jujur jauh lebih merugikan daripada meloloskan
 * satu siswa curang yang tetap akan terlihat di daftar tinjauan guru.
 */

export type SinyalLokasi = {
  lat: number;
  lng: number;
  /** Radius akurasi horizontal, meter. Wajib ada dari Geolocation API. */
  accuracy?: number | null;
  /** Ketinggian, meter. null pada banyak aplikasi GPS palsu. */
  altitude?: number | null;
  /** Kecepatan, m/s. null kalau perangkat tidak melaporkannya. */
  speed?: number | null;
  heading?: number | null;
  /** Waktu pengukuran menurut perangkat, epoch ms. */
  timestamp?: number | null;
};

/** Presensi sebelumnya dari siswa yang sama, untuk uji perpindahan. */
export type JejakSebelumnya = {
  lat: number;
  lng: number;
  waktu: Date;
};

export type AlasanCuriga =
  | "akurasi_sempurna"
  | "tanpa_ketinggian"
  | "koordinat_bulat"
  | "perpindahan_mustahil"
  | "koordinat_kembar"
  | "waktu_perangkat_meleset";

export type HasilPeriksa = {
  /** 0-100. Makin tinggi makin janggal. */
  skor: number;
  alasan: AlasanCuriga[];
  /** Kalimat siap tampil untuk guru. Kosong kalau tidak ada yang janggal. */
  keterangan: string;
};

/** Ambang skor yang membuat presensi ditandai untuk ditinjau guru. */
export const AMBANG_CURIGA = 50;

/** Kecepatan perpindahan di atas ini mustahil bagi siswa, km/jam. */
const BATAS_KECEPATAN = 200;

const BOBOT: Record<AlasanCuriga, number> = {
  // Sendirian tidak membuktikan apa-apa - ponsel kelas bawah pun kadang
  // melaporkan akurasi bulat. Bobotnya kecil, baru berarti bila menumpuk.
  akurasi_sempurna: 20,
  tanpa_ketinggian: 15,
  koordinat_bulat: 25,
  // Dua ini sinyal kuat: keduanya membandingkan dengan kenyataan lain yang
  // sudah tercatat, bukan sekadar menebak dari satu angka.
  perpindahan_mustahil: 60,
  koordinat_kembar: 70,
  waktu_perangkat_meleset: 30,
};

const PENJELASAN: Record<AlasanCuriga, string> = {
  akurasi_sempurna: "akurasi GPS terlalu sempurna untuk ponsel",
  tanpa_ketinggian: "perangkat tidak melaporkan ketinggian",
  koordinat_bulat: "koordinat terlalu bulat (tidak ada derau GPS)",
  perpindahan_mustahil: "perpindahan terlalu cepat dari presensi sebelumnya",
  koordinat_kembar: "koordinat persis sama dengan siswa lain",
  waktu_perangkat_meleset: "jam perangkat meleset jauh dari jam server",
};

/** Jarak haversine, meter. Disalin agar modul ini bebas ketergantungan. */
function jarakMeter(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371e3;
  const p1 = (aLat * Math.PI) / 180;
  const p2 = (bLat * Math.PI) / 180;
  const dP = ((bLat - aLat) * Math.PI) / 180;
  const dL = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dP / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dL / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Banyaknya angka di belakang koma yang benar-benar bermakna. */
export function desimalBermakna(n: number): number {
  const s = String(n);
  const titik = s.indexOf(".");
  if (titik < 0) return 0;
  // Buang nol di ekor: 7.120000 sama informatifnya dengan 7.12.
  return s.slice(titik + 1).replace(/0+$/, "").length;
}

/**
 * Nilai satu pengiriman presensi.
 *
 * `kembarDenganLain` diisi pemanggil setelah memeriksa basis data — modul ini
 * tidak menyentuh Prisma supaya tetap bisa diuji tanpa basis data.
 */
export function periksaLokasiPalsu(args: {
  sinyal: SinyalLokasi;
  sebelumnya?: JejakSebelumnya | null;
  kembarDenganLain?: boolean;
  /** Jam server saat presensi diterima. */
  sekarang: Date;
}): HasilPeriksa {
  const { sinyal, sebelumnya, kembarDenganLain, sekarang } = args;
  const alasan: AlasanCuriga[] = [];

  // --- 1. Akurasi yang mustahil ---------------------------------------
  // GPS ponsel di lapangan terbuka realistis di kisaran 3-20 m, dan angkanya
  // pecahan. Nilai 0, atau bilangan bulat rapi seperti tepat 1/5/10 m,
  // adalah ciri khas nilai yang ditulis tangan oleh aplikasi pemalsu.
  const acc = sinyal.accuracy;
  if (acc != null) {
    if (acc <= 0) alasan.push("akurasi_sempurna");
    else if (acc < 3 && Number.isInteger(acc)) alasan.push("akurasi_sempurna");
  }

  // --- 2. Ketinggian hilang -------------------------------------------
  // Presensi dari ponsel ber-GPS hampir selalu membawa altitude. Yang tidak
  // membawanya biasanya berasal dari lokasi hasil suntikan, atau dari laptop
  // yang menebak lokasi lewat Wi-Fi - dua-duanya layak ditinjau.
  if (sinyal.altitude == null) alasan.push("tanpa_ketinggian");

  // --- 3. Koordinat terlalu bulat -------------------------------------
  // Pembacaan GPS asli selalu berderau sampai 6-7 desimal. Koordinat yang
  // hanya punya 4 desimal atau kurang umumnya hasil ketik/tempel di peta.
  if (desimalBermakna(sinyal.lat) <= 4 && desimalBermakna(sinyal.lng) <= 4) {
    alasan.push("koordinat_bulat");
  }

  // --- 4. Perpindahan mustahil ----------------------------------------
  if (sebelumnya) {
    const detik = (sekarang.getTime() - sebelumnya.waktu.getTime()) / 1000;
    if (detik > 0) {
      const meter = jarakMeter(sinyal.lat, sinyal.lng, sebelumnya.lat, sebelumnya.lng);
      const kmJam = (meter / detik) * 3.6;
      // Abaikan jarak sangat pendek: 30 m dalam 2 detik itu derau GPS biasa,
      // bukan siswa yang berteleportasi.
      if (meter > 500 && kmJam > BATAS_KECEPATAN) {
        alasan.push("perpindahan_mustahil");
      }
    }
  }

  // --- 5. Koordinat kembar --------------------------------------------
  if (kembarDenganLain) alasan.push("koordinat_kembar");

  // --- 6. Jam perangkat meleset ---------------------------------------
  // Aplikasi pemalsu kadang membekukan timestamp. Toleransi 10 menit sudah
  // cukup longgar untuk ponsel yang jamnya tidak tersinkron.
  if (sinyal.timestamp != null) {
    const selisih = Math.abs(sekarang.getTime() - sinyal.timestamp) / 60000;
    if (selisih > 10) alasan.push("waktu_perangkat_meleset");
  }

  const skor = Math.min(100, alasan.reduce((t, a) => t + BOBOT[a], 0));

  return {
    skor,
    alasan,
    keterangan: alasan.length
      ? `Lokasi perlu ditinjau (skor ${skor}): ${alasan.map((a) => PENJELASAN[a]).join(", ")}.`
      : "",
  };
}

/** Apakah hasil pemeriksaan cukup janggal untuk ditandai bagi guru? */
export function perluDitinjau(hasil: HasilPeriksa): boolean {
  return hasil.skor >= AMBANG_CURIGA;
}

/**
 * Kunci pembanding koordinat kembar.
 *
 * Dibulatkan ke 5 desimal (~1 meter). Dua ponsel sungguhan yang diletakkan
 * berdampingan pun tidak akan menghasilkan kunci yang sama, sehingga
 * kecocokan di sini benar-benar berarti "angka yang identik", bukan
 * "kebetulan berdekatan".
 */
export function kunciKoordinat(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}
