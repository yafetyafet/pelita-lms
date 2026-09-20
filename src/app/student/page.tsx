import { getStudentHome } from "@/app/actions/student"
import { BerandaSiswa } from "./BerandaSiswa"

/**
 * Beranda siswa, dirender di server.
 *
 * Datanya diambil di sini dan ikut terkirim pada HTML pertama. Versi
 * sebelumnya mengambilnya dari peramban setelah hidrasi, sehingga siswa
 * menunggu tiga perjalanan berturut-turut - HTML, lalu ~590 KB JavaScript,
 * lalu satu permintaan server action - sebelum melihat satu baris pun isi
 * halaman.
 */
export default async function Page() {
  const awal = await getStudentHome()
  return <BerandaSiswa awal={awal} />
}
