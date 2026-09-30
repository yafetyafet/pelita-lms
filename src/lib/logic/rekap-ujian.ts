/**
 * Penyusun lembar rekap hasil ujian.
 *
 * Modul ini hanya menyusun MATRIKS SEL — tidak menyentuh SheetJS sama sekali.
 * Dipisah begitu supaya susunan kolom, rumus ringkasan, dan penulisan status
 * bisa diuji tanpa membuka berkas Excel, dan supaya pustaka 420 KB itu tetap
 * dimuat hanya saat tombol ekspor ditekan.
 */

export type StatusSiswa = "belum" | "mengerjakan" | "menunggu" | "selesai";

export type BarisSiswa = {
  /** Hanya dipakai sebagai kunci React; tidak ikut ke berkas Excel. */
  id?: string;
  nama: string;
  nomorInduk: string;
  status: StatusSiswa;
  skorPG: number | null;
  skorMaksPG: number | null;
  skorEsai: number | null;
  nilaiAkhir: number | null;
  kumpul: Date | string | null;
  pelanggaran: number;
};

export type RingkasanRombel = {
  jumlahSiswa: number;
  sudahMenilai: number;
  belumMengerjakan: number;
  menungguKoreksi: number;
  rata: number | null;
  tertinggi: number | null;
  terendah: number | null;
  tuntas: number | null;
};

export type RombelHasil = {
  id?: string;
  nama: string;
  siswa: BarisSiswa[];
  ringkasan: RingkasanRombel;
};

export type InfoUjian = {
  title: string;
  mapel: string;
  guru: string;
  startAt: Date | string | null;
  passingScore: number | null;
  jumlahSoal: number;
  bobotPG: number;
  bobotEsai: number;
};

/** Satu sel bisa berupa teks, angka, atau kosong. */
export type Sel = string | number | null;

export const LABEL_STATUS: Record<StatusSiswa, string> = {
  belum: "Belum mengerjakan",
  mengerjakan: "Sedang mengerjakan",
  menunggu: "Menunggu koreksi esai",
  selesai: "Selesai",
};

const JUDUL_KOLOM = [
  "No",
  "NIS",
  "Nama Siswa",
  "Skor PG",
  "Skor Esai",
  "Nilai Akhir",
  "Keterangan",
  "Status",
  "Waktu Kumpul",
  "Catatan Pengawas",
];

/** Tanggal-jam WIB yang terbaca manusia, mis. "24/09/2026 10:15". */
export function waktuWIB(nilai: Date | string | null): string {
  if (!nilai) return "";
  const d = nilai instanceof Date ? nilai : new Date(nilai);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(/\./g, ":");
}

/** Tanggal saja, mis. "24 September 2026". */
export function tanggalWIB(nilai: Date | string | null): string {
  if (!nilai) return "";
  const d = nilai instanceof Date ? nilai : new Date(nilai);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Keterangan ketuntasan.
 *
 * Kosong bila guru tidak menetapkan KKM — menuliskan "Tidak Tuntas" padahal
 * tidak ada ambangnya akan menuduh siswa berdasarkan angka yang tidak pernah
 * ditetapkan siapa pun.
 */
export function keterangan(nilai: number | null, kkm: number | null): string {
  if (nilai === null) return "";
  if (kkm === null) return "";
  return nilai >= kkm ? "Tuntas" : "Belum Tuntas";
}

/** Lembar untuk satu rombel: kop, tabel siswa, lalu ringkasan. */
export function lembarRombel(info: InfoUjian, rombel: RombelHasil): Sel[][] {
  const baris: Sel[][] = [];

  // --- kop ---
  baris.push(["REKAP HASIL UJIAN"]);
  baris.push([]);
  baris.push(["Ujian", info.title]);
  baris.push(["Mata Pelajaran", info.mapel]);
  baris.push(["Rombel", rombel.nama]);
  baris.push(["Tanggal", tanggalWIB(info.startAt)]);
  baris.push(["Guru Pengampu", info.guru]);
  baris.push([
    "Bobot",
    `${info.jumlahSoal} soal — PG ${info.bobotPG}, Esai ${info.bobotEsai}`,
  ]);
  baris.push(["KKM", info.passingScore ?? "tidak ditetapkan"]);
  baris.push([]);

  // --- tabel ---
  baris.push(JUDUL_KOLOM);
  rombel.siswa.forEach((s, i) => {
    baris.push([
      i + 1,
      s.nomorInduk,
      s.nama,
      s.skorPG,
      s.skorEsai,
      s.nilaiAkhir,
      keterangan(s.nilaiAkhir, info.passingScore),
      LABEL_STATUS[s.status],
      waktuWIB(s.kumpul),
      s.pelanggaran > 0 ? `${s.pelanggaran}x terdeteksi` : "",
    ]);
  });

  // --- ringkasan ---
  const r = rombel.ringkasan;
  baris.push([]);
  baris.push(["RINGKASAN"]);
  baris.push(["Jumlah siswa", r.jumlahSiswa]);
  baris.push(["Sudah dinilai", r.sudahMenilai]);
  baris.push(["Belum mengerjakan", r.belumMengerjakan]);
  baris.push(["Menunggu koreksi esai", r.menungguKoreksi]);
  baris.push(["Nilai rata-rata", r.rata]);
  baris.push(["Nilai tertinggi", r.tertinggi]);
  baris.push(["Nilai terendah", r.terendah]);
  if (r.tuntas !== null) {
    baris.push(["Tuntas", r.tuntas]);
    baris.push(["Belum tuntas", Math.max(0, r.sudahMenilai - r.tuntas)]);
  }

  return baris;
}

/** Lembar ringkasan lintas rombel, ditaruh paling depan. */
export function lembarRingkasan(info: InfoUjian, daftar: RombelHasil[]): Sel[][] {
  const baris: Sel[][] = [];

  baris.push(["REKAP HASIL UJIAN — RINGKASAN"]);
  baris.push([]);
  baris.push(["Ujian", info.title]);
  baris.push(["Mata Pelajaran", info.mapel]);
  baris.push(["Tanggal", tanggalWIB(info.startAt)]);
  baris.push(["Guru Pengampu", info.guru]);
  baris.push(["KKM", info.passingScore ?? "tidak ditetapkan"]);
  baris.push([]);

  baris.push([
    "Rombel",
    "Jumlah Siswa",
    "Sudah Dinilai",
    "Belum Mengerjakan",
    "Menunggu Koreksi",
    "Rata-rata",
    "Tertinggi",
    "Terendah",
    "Tuntas",
  ]);

  for (const r of daftar) {
    baris.push([
      r.nama,
      r.ringkasan.jumlahSiswa,
      r.ringkasan.sudahMenilai,
      r.ringkasan.belumMengerjakan,
      r.ringkasan.menungguKoreksi,
      r.ringkasan.rata,
      r.ringkasan.tertinggi,
      r.ringkasan.terendah,
      r.ringkasan.tuntas,
    ]);
  }

  // Baris total lintas rombel. Rata-ratanya dihitung ulang dari seluruh
  // nilai siswa, BUKAN dirata-rata dari rata-rata tiap rombel - rombel
  // berisi 20 dan 35 siswa tidak boleh berbobot sama.
  const semuaNilai = daftar.flatMap((r) =>
    r.siswa.map((s) => s.nilaiAkhir).filter((n): n is number => typeof n === "number")
  );
  const total = (ambil: (r: RombelHasil) => number) =>
    daftar.reduce((n, r) => n + ambil(r), 0);

  baris.push([
    "SELURUHNYA",
    total((r) => r.ringkasan.jumlahSiswa),
    total((r) => r.ringkasan.sudahMenilai),
    total((r) => r.ringkasan.belumMengerjakan),
    total((r) => r.ringkasan.menungguKoreksi),
    semuaNilai.length
      ? Math.round((semuaNilai.reduce((a, b) => a + b, 0) / semuaNilai.length) * 100) / 100
      : null,
    semuaNilai.length ? Math.max(...semuaNilai) : null,
    semuaNilai.length ? Math.min(...semuaNilai) : null,
    info.passingScore !== null
      ? semuaNilai.filter((n) => n >= info.passingScore!).length
      : null,
  ]);

  return baris;
}

/**
 * Nama lembar yang aman untuk Excel.
 *
 * Excel menolak nama lembar yang memuat : \\ / ? * [ ] atau lebih dari 31
 * karakter. Berkas yang lolos dibuat tapi gagal dibuka jauh lebih
 * membingungkan daripada nama rombel yang terpotong.
 */
export function namaLembarAman(nama: string, dipakai: Set<string>): string {
  let bersih = nama.replace(/[:\\/?*[\]]/g, "-").trim().slice(0, 31) || "Rombel";
  if (!dipakai.has(bersih)) {
    dipakai.add(bersih);
    return bersih;
  }
  // Bentrok: tambahkan angka sambil menjaga batas 31 karakter.
  for (let i = 2; i < 100; i++) {
    const akhiran = ` (${i})`;
    const kandidat = bersih.slice(0, 31 - akhiran.length) + akhiran;
    if (!dipakai.has(kandidat)) {
      dipakai.add(kandidat);
      return kandidat;
    }
  }
  dipakai.add(bersih);
  return bersih;
}

/** Nama berkas unduhan, tanpa karakter yang bermasalah di Windows. */
export function namaBerkas(info: InfoUjian, rombel?: string): string {
  const bagian = ["Hasil Ujian", info.title, rombel, info.mapel]
    .filter(Boolean)
    .join(" - ");
  return `${bagian.replace(/[\\/:*?"<>|]/g, "-").slice(0, 120)}.xlsx`;
}

/** Lebar kolom (karakter) agar tabelnya terbaca tanpa perlu diatur ulang. */
export const LEBAR_KOLOM_ROMBEL = [5, 14, 30, 10, 10, 11, 14, 22, 18, 18];
export const LEBAR_KOLOM_RINGKASAN = [22, 13, 14, 18, 17, 11, 11, 11, 9];
