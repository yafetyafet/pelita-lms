/**
 * Pengenal perangkat dari User-Agent, untuk ditampilkan kepada pengguna.
 *
 * Label ini SEMATA untuk dibaca manusia ("Android - Chrome"), supaya pesan
 * "akunmu sedang dipakai di perangkat lain" bisa menyebutkan perangkat apa.
 * Ia tidak dipakai sebagai kunci keamanan: User-Agent gampang dipalsukan,
 * jadi yang menentukan sah-tidaknya sesi tetap `sesiId` acak di basis data.
 */

export function labelPerangkat(userAgent: string | null | undefined): string {
  const ua = String(userAgent ?? "");
  if (!ua) return "Perangkat tidak dikenal";

  const sistem =
    /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iPod/i.test(ua) ? "iPhone/iPad"
    : /Windows/i.test(ua) ? "Windows"
    : /Mac OS X/i.test(ua) ? "Mac"
    : /Linux/i.test(ua) ? "Linux"
    : "Perangkat lain";

  // Urutan penting: Edge dan Opera menyebut "Chrome" di User-Agent mereka,
  // jadi keduanya harus diuji lebih dulu agar tidak salah dilabeli Chrome.
  const peramban =
    /Edg\//i.test(ua) ? "Edge"
    : /OPR\/|Opera/i.test(ua) ? "Opera"
    : /SamsungBrowser/i.test(ua) ? "Samsung Internet"
    : /Firefox\//i.test(ua) ? "Firefox"
    : /Chrome\//i.test(ua) ? "Chrome"
    : /Safari\//i.test(ua) ? "Safari"
    : "peramban lain";

  return `${sistem} - ${peramban}`;
}
