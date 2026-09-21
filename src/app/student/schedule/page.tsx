import { getCurrentUser } from "@/app/actions/auth"
import { getStudentSchedule } from "@/app/actions/student"
import { IsiJadwal } from "./IsiJadwal"

/**
 * Dirender di server: datanya ikut terkirim pada HTML pertama.
 *
 * Kedua aksi dijalankan berbarengan di server, bukan dua permintaan HTTP dari
 * peramban seperti sebelumnya.
 */
export default async function Page() {
  const [user, jadwal] = await Promise.all([getCurrentUser(), getStudentSchedule()])
  return <IsiJadwal awal={{ user, jadwal }} />
}
