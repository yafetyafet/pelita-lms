import { getAttendanceConfig, getTodayAttendance } from "@/app/actions/student"
import { IsiPresensi } from "./IsiPresensi"

/**
 * Dirender di server: pengaturan geofence dan presensi hari ini ikut terkirim
 * bersama HTML.
 *
 * Sebelumnya halaman ini menembak dua server action berurutan setelah
 * hidrasi - dan deteksi GPS baru dimulai SETELAH pengaturannya tiba, sehingga
 * siswa menunggu dua perjalanan jaringan sebelum GPS-nya bahkan mulai
 * mencari sinyal.
 */
export default async function Page() {
  const [geo, presensi] = await Promise.all([
    getAttendanceConfig(),
    getTodayAttendance(),
  ])
  return <IsiPresensi awal={{ geo, presensi }} />
}
