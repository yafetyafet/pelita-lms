import { getSpiritualJournals } from "@/app/actions/student"
import { IsiPembiasaan } from "./IsiPembiasaan"

/**
 * Dirender di server: datanya ikut terkirim pada HTML pertama.
 *
 * Versi sebelumnya mengambil data dari peramban setelah hidrasi, sehingga
 * siswa menunggu dua perjalanan berurutan - unduh JavaScript halaman, lalu
 * satu permintaan server action - sebelum melihat isinya.
 */
export default async function Page() {
  const awal = await getSpiritualJournals()
  return <IsiPembiasaan awal={awal} />
}
