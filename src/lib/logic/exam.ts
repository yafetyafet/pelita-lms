/**
 * "PG"          = pilihan ganda, tepat satu jawaban benar.
 * "PG_KOMPLEKS" = pilihan ganda kompleks, jawaban benar bisa lebih dari satu.
 * "BENAR_SALAH" = beberapa pernyataan, tiap pernyataan dinilai Benar/Salah.
 *                 Ini bentuk "Pilihan Ganda Kompleks Kategori" pada TKA
 *                 (Tes Kemampuan Akademik): `options` berisi pernyataannya,
 *                 `correctAnswer` berisi kunci posisional "B,S,B,S".
 * "ESAI"        = uraian, dikoreksi manual oleh guru.
 */
export type TipeSoal = "PG" | "PG_KOMPLEKS" | "BENAR_SALAH" | "ESAI";

/** Nilai yang sah untuk tiap pernyataan Benar/Salah. */
export const NILAI_BS = ["B", "S"] as const;

/**
 * Samakan bentuk jawaban Benar/Salah: "b, s ,B" -> "B,S,B".
 *
 * Berbeda dari normalJawaban(), urutan di sini BERMAKNA - posisi ke-i adalah
 * penilaian untuk pernyataan ke-i - jadi tidak boleh diurutkan maupun
 * dibuang duplikatnya. Pernyataan yang belum dijawab menjadi string kosong
 * di posisinya, sehingga tetap tidak akan cocok dengan kunci.
 */
export function normalBS(nilai: string | null | undefined): string {
  return String(nilai ?? "")
    .split(",")
    .map((x) => x.trim().toUpperCase())
    .map((x) => (x === "BENAR" || x === "TRUE" || x === "1" ? "B" : x))
    .map((x) => (x === "SALAH" || x === "FALSE" || x === "0" ? "S" : x))
    .join(",");
}

export type Soal = {
  id: string;
  type: TipeSoal;
  question: string;
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  imageUrl?: string | null;
};

export type StatusUjian =
  | "belum_dibuka"
  | "berlangsung"
  | "sudah_ditutup"
  | "sudah_dikerjakan";

export type KelayakanUjian =
  | { boleh: true; sisaDetik: number }
  | { boleh: false; status: StatusUjian; pesan: string };

export function kelayakanUjian(args: {
  mulai: string | null | undefined;
  selesai: string | null | undefined;
  durasiMenit: number;
  mulaiServer: string | null;
  sudahDikirim: boolean;
  sekarang: Date;
}): KelayakanUjian {
  const { mulai, selesai, durasiMenit, mulaiServer, sudahDikirim, sekarang } = args;

  if (sudahDikirim) {
    return {
      boleh: false,
      status: "sudah_dikerjakan",
      pesan: "Kamu sudah menyelesaikan ujian ini.",
    };
  }

  const t = sekarang.getTime();
  const buka = mulai ? new Date(mulai).getTime() : null;
  const tutup = selesai ? new Date(selesai).getTime() : null;

  if (buka && Number.isFinite(buka) && t < buka) {
    return {
      boleh: false,
      status: "belum_dibuka",
      pesan: "Ujian belum dibuka.",
    };
  }

  if (tutup && Number.isFinite(tutup) && t > tutup) {
    return {
      boleh: false,
      status: "sudah_ditutup",
      pesan: "Waktu ujian sudah berakhir.",
    };
  }

  const sisaDurasi = mulaiServer
    ? durasiMenit * 60_000 - (t - new Date(mulaiServer).getTime())
    : durasiMenit * 60_000;

  const sisaJendela = tutup && Number.isFinite(tutup) ? tutup - t : Infinity;
  const sisaMs = Math.min(sisaDurasi, sisaJendela);

  if (sisaMs <= 0) {
    return {
      boleh: false,
      status: "sudah_ditutup",
      pesan: "Waktu pengerjaanmu sudah habis.",
    };
  }

  return { boleh: true, sisaDetik: Math.floor(sisaMs / 1000) };
}

export type HasilKoreksi = {
  skorOtomatis: number;
  skorMaksOtomatis: number;
  bobotEsai: number;
  benar: number;
  salah: number;
  kosong: number;
};

/**
 * Samakan bentuk jawaban agar bisa dibandingkan.
 *
 * Jawaban PG kompleks dikirim sebagai daftar indeks dipisah koma ("0,2").
 * Urutan pilihan siswa tidak boleh memengaruhi hasil, jadi daftarnya diurutkan
 * dan spasi/duplikat dibuang. Untuk PG biasa hasilnya sama dengan nilai
 * aslinya, sekaligus membuatnya tahan terhadap spasi berlebih.
 */
function normalJawaban(nilai: string | null | undefined): string {
  return Array.from(
    new Set(
      String(nilai ?? "")
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
    )
  )
    .sort()
    .join(",");
}

export function koreksiOtomatis(
  soal: Soal[],
  jawaban: Map<string, string>
): HasilKoreksi {
  let skorOtomatis = 0;
  let skorMaksOtomatis = 0;
  let bobotEsai = 0;
  let benar = 0;
  let salah = 0;
  let kosong = 0;

  for (const s of soal) {
    if (s.type === "ESAI") {
      bobotEsai += s.points;
      continue;
    }

    skorMaksOtomatis += s.points;
    const j = (jawaban.get(s.id) ?? "").trim();

    if (!j) {
      kosong++;
      continue;
    }

    // PG kompleks dan Benar/Salah dinilai utuh: seluruh bagian harus tepat.
    // Tidak ada nilai sebagian, supaya hasilnya mudah dijelaskan ke siswa
    // dan konsisten antar-tipe. Benar/Salah dibandingkan posisi demi posisi,
    // bukan sebagai himpunan.
    const cocok =
      s.type === "BENAR_SALAH"
        ? normalBS(j) === normalBS(s.correctAnswer)
        : normalJawaban(j) === normalJawaban(s.correctAnswer);
    if (cocok) {
      skorOtomatis += s.points;
      benar++;
    } else {
      salah++;
    }
  }

  return { skorOtomatis, skorMaksOtomatis, bobotEsai, benar, salah, kosong };
}

export function keNilaiAkhir(
  skor: number,
  totalBobot: number,
  nilaiMaks: number
): number {
  if (totalBobot <= 0) return 0;
  return Math.round((skor / totalBobot) * nilaiMaks * 100) / 100;
}

export function acakDeterministik<T>(daftar: T[], benih: string): T[] {
  const hasil = [...daftar];
  let h = 2166136261;
  for (let i = 0; i < benih.length; i++) {
    h ^= benih.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  let state = h >>> 0;
  const acak = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

export function acakPG<T extends { type: string }>(
  daftar: T[],
  benih: string
): T[] {
  // Semua tipe pilihan ganda (termasuk PG kompleks) diacak; esai tetap di
  // belakang agar siswa mengerjakan uraian paling akhir.
  const pg = daftar.filter((s) => s.type !== "ESAI");
  const esai = daftar.filter((s) => s.type === "ESAI");
  return [...acakDeterministik(pg, benih), ...esai];
}

export type SoalUntukSiswa = Omit<Soal, "correctAnswer">;

export function tanpaKunci(soal: Soal[]): SoalUntukSiswa[] {
  return soal.map(({ correctAnswer: _kunci, ...sisa }) => sisa);
}
