/**
 * Helper zona waktu WIB (Asia/Jakarta).
 *
 * Vercel menjalankan fungsi server dengan TZ=UTC, sedangkan seluruh aturan
 * sekolah (jendela presensi 06:00–07:15, jam pulang, tanggal jurnal) memakai
 * waktu setempat. Memanggil `new Date().getHours()` di server karena itu
 * menggeser semuanya 7 jam: presensi pukul 07:00 WIB terbaca 00:00 dan
 * ditolak sebagai "belum dibuka", dan presensi pagi tercatat di tanggal
 * sebelumnya.
 *
 * Semua perhitungan hari/jam di sisi server harus lewat modul ini.
 */

export const ZONA_SEKOLAH = 'Asia/Jakarta'

type BagianWaktu = {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_SEKOLAH,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function bagian(d: Date): BagianWaktu {
  const out = {} as Record<string, string>
  for (const { type, value } of formatter.formatToParts(d)) {
    out[type] = value
  }
  // Sebagian versi ICU memakai "24" untuk tengah malam.
  if (out.hour === '24') out.hour = '00'
  return out as BagianWaktu
}

/** "YYYY-MM-DD" menurut kalender WIB. */
export function dateKeyWIB(d: Date = new Date()): string {
  const p = bagian(d)
  return `${p.year}-${p.month}-${p.day}`
}

/** "HH:MM" menurut jam dinding WIB. */
export function jamWIB(d: Date = new Date()): string {
  const p = bagian(d)
  return `${p.hour}:${p.minute}`
}

/**
 * Tanggal panjang menurut WIB, mis. "Sabtu, 20 September 2026".
 *
 * Dipakai komponen yang dirender di server DAN di peramban. Tanpa zona waktu
 * eksplisit, server Vercel (UTC) dan ponsel siswa (WIB) menghasilkan teks
 * berbeda, sehingga React melaporkan ketidakcocokan hidrasi dan tanggal
 * sempat tampil keliru.
 */
export function tanggalPanjangWIB(
  d: Date = new Date(),
  opsi: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
): string {
  return new Intl.DateTimeFormat('id-ID', { ...opsi, timeZone: ZONA_SEKOLAH }).format(d)
}

/** "HH:MM WIB" - aman dipakai di server maupun peramban. */
export function jamLabelWIB(d: Date | string | number): string {
  return jamWIB(new Date(d)) + ' WIB'
}

/** Menit sejak tengah malam WIB (0–1439). */
export function menitWIB(d: Date = new Date()): number {
  const p = bagian(d)
  return Number(p.hour) * 60 + Number(p.minute)
}

/**
 * `Date` yang `getHours()`/`getMinutes()`-nya mengembalikan jam dinding WIB,
 * apa pun zona waktu server. Dipakai untuk menyuapi fungsi lama yang
 * menerima `Date` dan memanggil `getHours()` sendiri
 * (lihat `tentukanStatus` di `attendance.ts`).
 */
export function jamDindingWIB(d: Date = new Date()): Date {
  const p = bagian(d)
  return new Date(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  )
}

const NAMA_HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const

export type NamaHari = (typeof NAMA_HARI)[number]

/** Nama hari dalam bahasa Indonesia menurut WIB. */
export function hariWIB(d: Date = new Date()): NamaHari {
  return NAMA_HARI[jamDindingWIB(d).getDay()]
}

/**
 * Kunci slot presensi. `null`/kosong berarti presensi harian, sedangkan
 * `subjectId` menandai presensi per mata pelajaran. Dipakai indeks unik
 * `Attendance(userId, slotKey)` untuk mencegah presensi ganda.
 */
export function slotKeyPresensi(
  dateKey: string,
  subjectId?: string | null
): string {
  return `${dateKey}|${subjectId || 'DAILY'}`
}

/** Awal hari WIB sebagai instan UTC — untuk filter `date >= awalHari`. */
export function awalHariWIB(d: Date = new Date()): Date {
  // 00:00 WIB = 17:00 UTC hari sebelumnya (offset tetap +07:00).
  return new Date(`${dateKeyWIB(d)}T00:00:00+07:00`)
}

/** Rentang [mulai, selesai) satu hari WIB. */
export function rentangHariWIB(dateKey: string): { mulai: Date; selesai: Date } {
  const mulai = new Date(`${dateKey}T00:00:00+07:00`)
  return { mulai, selesai: new Date(mulai.getTime() + 24 * 60 * 60 * 1000) }
}
