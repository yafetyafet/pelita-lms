'use server'

/**
 * Kesiswaan: master jenis pelanggaran dan tindak lanjutnya.
 *
 * Sebelumnya jenis pelanggaran beserta poinnya ditulis mati di DUA tempat
 * terpisah — dropdown pada dashboard guru dan daftar acuan pada halaman
 * disiplin siswa — sehingga keduanya bisa tidak sinkron dan sekolah tidak
 * punya cara mengubahnya sendiri.
 *
 * Daftarnya disimpan di `AppSetting` sebagai JSON, bukan tabel tersendiri.
 * Alasannya: jumlahnya sedikit, sifatnya konfigurasi, dan setiap pelanggaran
 * yang dicatat sudah menyimpan salinan `description` + `points` miliknya
 * sendiri — jadi mengubah poin sebuah jenis TIDAK boleh (dan tidak akan)
 * mengubah catatan yang sudah terjadi.
 */

import { prisma } from '@/lib/prisma'
import type { AksiHasil } from '@/lib/types/aksi'
import { optionalSession, requireSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/logic/rbac'

const KUNCI = 'VIOLATION_CATEGORIES'

export type JenisPelanggaran = {
  nama: string
  poin: number
  /** Kategori pengelompokan, mis. "Kedisiplinan" atau "Akademik". */
  kelompok?: string
}

/**
 * Nilai awal, disamakan dengan daftar yang dulu ditulis mati supaya perilaku
 * lama tidak berubah sebelum sekolah menyesuaikannya.
 */
const BAWAAN: JenisPelanggaran[] = [
  { nama: 'Keterlambatan Hadir', poin: 5, kelompok: 'Kedisiplinan' },
  { nama: 'Ketidaklengkapan Seragam / Atribut', poin: 5, kelompok: 'Kedisiplinan' },
  { nama: 'Meninggalkan Kelas Tanpa Izin', poin: 10, kelompok: 'Kedisiplinan' },
  { nama: 'Kecurangan Akademik / Ujian', poin: 25, kelompok: 'Akademik' },
]

function gagal(err: unknown) {
  if (err instanceof ForbiddenError) return { error: err.message }
  return { error: err instanceof Error ? err.message : 'Terjadi kesalahan.' }
}

function bersihkan(raw: unknown): JenisPelanggaran[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((x) => ({
      nama: String((x as JenisPelanggaran)?.nama ?? '').trim(),
      poin: Number((x as JenisPelanggaran)?.poin),
      kelompok: String((x as JenisPelanggaran)?.kelompok ?? '').trim() || undefined,
    }))
    .filter(
      (x) => x.nama.length > 0 && Number.isFinite(x.poin) && x.poin >= 0 && x.poin <= 100
    )
}

/**
 * Dibaca semua peran yang sudah login: guru butuh untuk dropdown pencatatan,
 * siswa untuk daftar acuan di halaman disiplin.
 */
export async function getViolationCategories(): Promise<JenisPelanggaran[]> {
  const session = await optionalSession()
  if (!session) return []

  const row = await prisma.appSetting.findUnique({ where: { key: KUNCI } })
  if (!row?.value) return BAWAAN

  try {
    const hasil = bersihkan(JSON.parse(row.value))
    return hasil.length > 0 ? hasil : BAWAAN
  } catch {
    // Nilai rusak jangan sampai mengosongkan dropdown guru.
    return BAWAAN
  }
}

export async function setViolationCategories(
  daftar: JenisPelanggaran[]
): Promise<AksiHasil<{ count: number }>> {
  try {
    await requireSession('ADMIN')

    const bersih = bersihkan(daftar)
    if (bersih.length === 0) {
      return { error: 'Minimal satu jenis pelanggaran harus ada, dengan poin 0-100.' }
    }

    // Nama ganda membuat dropdown membingungkan dan rekap sulit dibaca.
    const nama = new Set<string>()
    for (const j of bersih) {
      const k = j.nama.toLowerCase()
      if (nama.has(k)) return { error: `Jenis pelanggaran "${j.nama}" ditulis dua kali.` }
      nama.add(k)
    }

    await prisma.appSetting.upsert({
      where: { key: KUNCI },
      update: { value: JSON.stringify(bersih) },
      create: { key: KUNCI, value: JSON.stringify(bersih) },
    })

    return { success: true, count: bersih.length }
  } catch (err) {
    return gagal(err)
  }
}

/**
 * Seluruh catatan pelanggaran untuk admin, atau catatan milik sendiri untuk
 * guru. Melengkapi `getReportedViolations` yang hanya memuat data ringkas.
 */
export async function getViolationRecords(filter?: {
  status?: string
  classId?: string
}) {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.violation.findMany({
    where: {
      // Guru hanya melihat laporan yang ia buat sendiri; admin melihat semua.
      ...(session.role === 'TEACHER' ? { reporterId: session.uid } : {}),
      ...(filter?.status && filter.status !== 'ALL' ? { status: filter.status } : {}),
      ...(filter?.classId
        ? { student: { studentClasses: { some: { classId: filter.classId } } } }
        : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          username: true,
          studentClasses: {
            select: { classInfo: { select: { id: true, name: true } } },
          },
        },
      },
      reporter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
  })
}

/** Ringkasan poin per siswa, untuk melihat siapa yang perlu ditangani. */
export async function getViolationSummary() {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  const rows = await prisma.violation.groupBy({
    by: ['studentId'],
    where: session.role === 'TEACHER' ? { reporterId: session.uid } : {},
    _sum: { points: true },
    _count: { _all: true },
  })

  if (rows.length === 0) return []

  const siswa = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.studentId) } },
    select: {
      id: true,
      name: true,
      username: true,
      studentClasses: { select: { classInfo: { select: { id: true, name: true } } } },
    },
  })
  const peta = new Map(siswa.map((s) => [s.id, s]))

  return rows
    .map((r) => {
      const s = peta.get(r.studentId)
      const totalPoin = r._sum.points ?? 0
      return {
        student: s ?? null,
        kelas: s?.studentClasses?.[0]?.classInfo?.name ?? null,
        jumlahCatatan: r._count._all,
        totalPoin,
        // Skala sama dengan yang ditampilkan di halaman disiplin siswa.
        sisaPoin: Math.max(0, 100 - totalPoin),
      }
    })
    .filter((x) => x.student !== null)
    .sort((a, b) => b.totalPoin - a.totalPoin)
}

/**
 * Hapus catatan pelanggaran. Guru hanya boleh menghapus laporannya sendiri;
 * admin boleh menghapus apa pun. Diperlukan untuk memperbaiki salah input,
 * karena poin pelanggaran memengaruhi nilai karakter siswa.
 */
export async function deleteViolation(id: string): Promise<AksiHasil> {
  try {
    const session = await requireSession('ADMIN', 'TEACHER')

    const item = await prisma.violation.findUnique({
      where: { id },
      select: { reporterId: true },
    })
    if (!item) return { error: 'Catatan pelanggaran tidak ditemukan.' }
    if (session.role !== 'ADMIN' && item.reporterId !== session.uid) {
      return { error: 'Kamu hanya boleh menghapus catatan yang kamu buat sendiri.' }
    }

    await prisma.violation.delete({ where: { id } })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}
