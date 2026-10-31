'use server'

/**
 * Identitas sekolah untuk kop surat dan blok tanda tangan pada laporan cetak.
 *
 * Sebelumnya nama sekolah ditulis mati di sembilan berkas berbeda dan tidak
 * ada data kepala sekolah sama sekali, sehingga laporan tercetak tidak mungkin
 * memuat kop maupun tanda tangan yang benar.
 *
 * Disimpan di `AppSetting` sebagai pasangan kunci-nilai: isinya sedikit,
 * sifatnya konfigurasi, dan tidak perlu tabel tersendiri.
 */

import { prisma } from '@/lib/prisma'
import type { AksiHasil } from '@/lib/types/aksi'
import { optionalSession, requireSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/logic/rbac'
import { normalisasiUrlGambar } from '@/lib/logic/gambar-url'

export type ProfilSekolah = {
  namaYayasan: string
  namaSekolah: string
  npsn: string
  alamat: string
  telepon: string
  email: string
  website: string
  /** Logo kiri pada kop - lazimnya lambang pemerintah/yayasan. */
  logoUrl: string
  /** Logo kanan pada kop - lazimnya lambang sekolah itu sendiri. */
  logoKananUrl: string
  kepalaSekolah: string
  nipKepalaSekolah: string
  /** Kota yang tercetak sebelum tanggal pada blok tanda tangan. */
  kotaTandaTangan: string
  tahunAjaran: string
  semester: string
}

const BAWAAN: ProfilSekolah = {
  namaYayasan: 'PEMERINTAH PROVINSI JAWA TENGAH',
  namaSekolah: 'SMK NEGERI 1 KEMANGKON',
  npsn: '',
  alamat: '',
  telepon: '',
  email: '',
  website: '',
  logoUrl: '',
  logoKananUrl: '',
  kepalaSekolah: '',
  nipKepalaSekolah: '',
  kotaTandaTangan: 'Purbalingga',
  tahunAjaran: '',
  semester: 'Ganjil',
}

/** Satu kunci AppSetting per field, diberi awalan agar mudah dikenali. */
const PREFIX = 'SCHOOL_'
const kunci = (k: keyof ProfilSekolah) => `${PREFIX}${k.toUpperCase()}`

function gagal(err: unknown) {
  if (err instanceof ForbiddenError) return { error: err.message }
  return { error: err instanceof Error ? err.message : 'Terjadi kesalahan.' }
}

/**
 * Dibaca semua peran yang sudah login — guru butuh untuk kop laporan, dan
 * halaman lain memakainya untuk mengganti nama sekolah yang selama ini
 * ditulis mati.
 */
export async function getSchoolProfile(): Promise<ProfilSekolah> {
  const session = await optionalSession()
  if (!session) return BAWAAN

  const daftar = Object.keys(BAWAAN) as (keyof ProfilSekolah)[]
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: daftar.map(kunci) } },
  })
  const peta = new Map(rows.map((r) => [r.key, r.value]))

  const hasil = { ...BAWAAN }
  for (const k of daftar) {
    const v = peta.get(kunci(k))
    if (typeof v === 'string' && v.trim()) hasil[k] = v.trim()
  }

  // Tautan logo dinormalkan SAAT DIBACA, bukan hanya saat disimpan, supaya
  // tautan yang sudah telanjur tersimpan dalam bentuk halaman penampil
  // Google Drive ikut tampil benar tanpa admin perlu mengisinya ulang.
  hasil.logoUrl = normalisasiUrlGambar(hasil.logoUrl)
  hasil.logoKananUrl = normalisasiUrlGambar(hasil.logoKananUrl)

  return hasil
}

export async function setSchoolProfile(
  data: Partial<ProfilSekolah>
): Promise<AksiHasil<{ count: number }>> {
  try {
    await requireSession('ADMIN')

    const daftar = Object.keys(BAWAAN) as (keyof ProfilSekolah)[]
    const masuk = daftar.filter((k) => data[k] !== undefined)

    if (masuk.length === 0) return { error: 'Tidak ada data yang diubah.' }
    if (!String(data.namaSekolah ?? BAWAAN.namaSekolah).trim()) {
      return { error: 'Nama sekolah tidak boleh kosong.' }
    }

    await prisma.$transaction(
      masuk.map((k) => {
        const mentah = String(data[k] ?? '').trim()
        // Tautan berbagi Drive adalah halaman HTML, bukan gambar; disimpan
        // apa adanya, <img> akan selalu gagal memuatnya.
        const nilai =
          k === 'logoUrl' || k === 'logoKananUrl'
            ? normalisasiUrlGambar(mentah)
            : mentah
        return prisma.appSetting.upsert({
          where: { key: kunci(k) },
          update: { value: nilai },
          create: { key: kunci(k), value: nilai },
        })
      })
    )

    return { success: true, count: masuk.length }
  } catch (err) {
    return gagal(err)
  }
}
