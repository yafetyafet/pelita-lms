/**
 * Jenis pelanggaran: bentuk data dan pembacaannya.
 *
 * Dipisahkan dari `src/app/actions/kesiswaan.ts` karena berkas itu bertanda
 * `'use server'` dan hanya boleh mengekspor fungsi async. Pemanggil yang sudah
 * memegang nilai mentah dari `AppSetting` - misalnya beranda guru yang
 * mengambil semua datanya sekaligus - perlu menguraikannya tanpa membuat satu
 * permintaan HTTP tambahan.
 */

export type JenisPelanggaran = {
  nama: string
  poin: number
  /** Kategori pengelompokan, mis. "Kedisiplinan" atau "Akademik". */
  kelompok?: string
}

/**
 * Nilai awal, disamakan dengan daftar yang dulu ditulis mati supaya perilaku
 * lama tidak berubah sebelum sekolah menyesuaikannya.
 */
export const JENIS_BAWAAN: JenisPelanggaran[] = [
  { nama: 'Keterlambatan Hadir', poin: 5, kelompok: 'Kedisiplinan' },
  { nama: 'Ketidaklengkapan Seragam / Atribut', poin: 5, kelompok: 'Kedisiplinan' },
  { nama: 'Meninggalkan Kelas Tanpa Izin', poin: 10, kelompok: 'Kedisiplinan' },
  { nama: 'Kecurangan Akademik / Ujian', poin: 25, kelompok: 'Akademik' },
]

export function bersihkanJenis(raw: unknown): JenisPelanggaran[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((x) => ({
      nama: String((x as JenisPelanggaran)?.nama ?? '').trim(),
      poin: Number((x as JenisPelanggaran)?.poin),
      kelompok: String((x as JenisPelanggaran)?.kelompok ?? '').trim() || undefined,
    }))
    .filter(
      (x) => x.nama.length > 0 && Number.isFinite(x.poin) && x.poin >= 0 && x.poin <= 100
    )
}

/** Uraikan nilai mentah AppSetting menjadi daftar jenis pelanggaran. */
export function bacaJenisPelanggaran(nilai: string | null): JenisPelanggaran[] {
  if (!nilai) return JENIS_BAWAAN
  try {
    const hasil = bersihkanJenis(JSON.parse(nilai))
    return hasil.length > 0 ? hasil : JENIS_BAWAAN
  } catch {
    // Nilai rusak jangan sampai mengosongkan dropdown guru.
    return JENIS_BAWAAN
  }
}
