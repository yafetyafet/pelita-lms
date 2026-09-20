/**
 * Kategori jurnal pembiasaan.
 *
 * Diletakkan di sini, bukan di `src/app/actions/student.ts`, karena berkas itu
 * bertanda `'use server'` dan hanya boleh mengekspor fungsi async - daftar
 * konstanta yang diekspor dari sana menggagalkan build begitu ada server
 * component yang mengimpor modulnya.
 */
export const KATEGORI_PEMBIASAAN = [
  'Ibadah',
  'Literasi',
  'Kebersihan',
  'Sosial',
] as const

export type KategoriPembiasaan = (typeof KATEGORI_PEMBIASAAN)[number]
