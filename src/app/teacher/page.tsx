import { getTeacherHome } from "@/app/actions/teacher"
import { BerandaGuru } from "./BerandaGuru"

/**
 * Beranda guru, dirender di server.
 *
 * Datanya ikut terkirim pada HTML pertama, bukan diambil dari peramban
 * setelah hidrasi. Lihat catatan pada beranda siswa untuk alasannya.
 */
export default async function Page() {
  const awal = await getTeacherHome()
  return <BerandaGuru awal={awal} />
}
