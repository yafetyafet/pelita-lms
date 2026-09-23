/**
 * Ubah tautan berbagi menjadi tautan gambar langsung.
 *
 * Masalah yang diselesaikan: guru menyalin tautan dari Google Drive, yang
 * bentuknya https://drive.google.com/file/d/<ID>/view?usp=sharing. Tautan itu
 * adalah HALAMAN PENAMPIL - diuji 23 September 2026, isinya HTML 80 KB, bukan
 * gambar - sehingga <img src="..."> gagal dan siswa hanya melihat teks alt.
 *
 * Bentuk yang benar untuk Drive: drive.google.com/thumbnail?id=<ID>&sz=w1600
 * Diuji pada berkas yang sama: mengembalikan image/jpeg 26 KB.
 *
 * `sz=w1600` sekaligus membatasi lebar di sisi Google. Untuk sekolah yang
 * seluruh lalu lintasnya lewat sambungan 10 Mbps, ini berarti siswa tidak
 * mengunduh foto 4 MB hasil kamera hanya untuk ditampilkan selebar layar HP.
 */

const LEBAR = 1600

/** Ambil id berkas Drive dari berbagai bentuk tautan yang beredar. */
function idDrive(url: string): string | null {
  const pola = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]{10,})/,
    /drive\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]{10,})/,
    /drive\.google\.com\/thumbnail\?[^#]*\bid=([a-zA-Z0-9_-]{10,})/,
    /drive\.usercontent\.google\.com\/[^#]*\bid=([a-zA-Z0-9_-]{10,})/,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/,
    /docs\.google\.com\/uc\?[^#]*\bid=([a-zA-Z0-9_-]{10,})/,
  ]
  for (const p of pola) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

/**
 * Kembalikan tautan yang bisa dipakai langsung pada <img>.
 * Tautan yang sudah benar dibiarkan apa adanya.
 */
export function normalisasiUrlGambar(url: string | null | undefined): string {
  const u = String(url ?? "").trim()
  if (!u) return ""

  const id = idDrive(u)
  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w${LEBAR}`

  // Dropbox: halaman pratinjau -> berkas mentah.
  if (/dropbox\.com\//i.test(u)) {
    return u.replace(/([?&])dl=0\b/, "$1raw=1").replace(/([?&])raw=0\b/, "$1raw=1") +
      (/[?&](raw|dl)=/.test(u) ? "" : (u.includes("?") ? "&raw=1" : "?raw=1"))
  }

  // OneDrive / SharePoint: tambahkan parameter unduh langsung.
  if (/1drv\.ms\/|onedrive\.live\.com\//i.test(u) && !/[?&]download=1/.test(u)) {
    return u + (u.includes("?") ? "&download=1" : "?download=1")
  }

  return u
}

/**
 * Apakah tautan ini hampir pasti TIDAK akan tampil sebagai gambar?
 * Dipakai untuk memperingatkan guru saat menyusun soal, bukan untuk menolak.
 */
export function peringatanUrlGambar(url: string | null | undefined): string | null {
  const u = String(url ?? "").trim()
  if (!u) return null

  if (/^https?:\/\//i.test(u) === false) {
    return "Tautan gambar harus diawali http:// atau https://"
  }
  if (/photos\.app\.goo\.gl|photos\.google\.com/i.test(u)) {
    return "Tautan Google Photos tidak bisa ditampilkan langsung. Unggah gambarnya ke Google Drive, lalu salin tautannya."
  }
  if (/drive\.google\.com|lh3\.googleusercontent/i.test(u) && !idDrive(u)) {
    return "Tautan Drive tidak dikenali. Pakai tautan berkas (bukan folder), lalu pastikan aksesnya \"Siapa saja yang memiliki link\"."
  }
  return null
}
