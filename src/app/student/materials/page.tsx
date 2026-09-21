import { getStudentMaterials } from "@/app/actions/student"
import { IsiMateri } from "./IsiMateri"

/**
 * Dirender di server: datanya ikut terkirim pada HTML pertama.
 *
 * Versi sebelumnya mengambil data dari peramban setelah hidrasi, sehingga
 * siswa menunggu dua perjalanan berurutan - unduh JavaScript halaman, lalu
 * satu permintaan server action - sebelum melihat isinya.
 */
export default async function Page() {
  const awal = await getStudentMaterials()
  return <IsiMateri awal={awal} />
}
