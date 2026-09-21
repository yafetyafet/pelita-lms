import { getStudentViolations } from "@/app/actions/student"
import { getViolationCategories } from "@/app/actions/kesiswaan"
import { IsiDisiplin } from "./IsiDisiplin"

/**
 * Dirender di server: datanya ikut terkirim pada HTML pertama.
 *
 * Kedua aksi dijalankan berbarengan di server, bukan dua permintaan HTTP dari
 * peramban seperti sebelumnya.
 */
export default async function Page() {
  const [pelanggaran, jenis] = await Promise.all([
    getStudentViolations(),
    getViolationCategories(),
  ])
  return <IsiDisiplin awal={{ pelanggaran, jenis }} />
}
