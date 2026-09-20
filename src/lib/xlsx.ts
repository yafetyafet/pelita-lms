/**
 * Pemuat SheetJS sesuai kebutuhan.
 *
 * `import * as XLSX from "xlsx"` di tingkat berkas menarik pustaka 420 KB ke
 * dalam berkas JavaScript halaman, sehingga SETIAP kunjungan ke Kelola
 * Pengguna dan Kelola Ujian harus mengunduhnya lebih dulu - padahal pustaka
 * itu hanya dipakai saat tombol unduh template ditekan atau berkas Excel
 * dipilih. Di jaringan ponsel sekolah, 420 KB itu terasa sebagai halaman yang
 * lama sekali terbuka.
 *
 * Hasil muatnya disimpan supaya penekanan tombol berikutnya tidak mengunduh
 * ulang.
 */
let cache: Promise<typeof import('xlsx')> | null = null

export function muatXlsx() {
  if (!cache) cache = import('xlsx')
  return cache
}
