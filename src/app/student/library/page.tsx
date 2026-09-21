import { getLibraryBooks } from "@/app/actions/student"
import { IsiPerpustakaan } from "./IsiPerpustakaan"

/**
 * Dirender di server: datanya ikut terkirim pada HTML pertama.
 *
 * Versi sebelumnya mengambil data dari peramban setelah hidrasi, sehingga
 * siswa menunggu dua perjalanan berurutan - unduh JavaScript halaman, lalu
 * satu permintaan server action - sebelum melihat isinya.
 */
export default async function Page() {
  const awal = await getLibraryBooks()
  return <IsiPerpustakaan awal={awal} />
}
