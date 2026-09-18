'use server'

/**
 * Pengumuman sekolah.
 *
 * Admin sudah bisa membuat broadcast sejak awal, tapi satu-satunya yang
 * membacanya adalah beranda siswa — dan penyaringannya dilakukan di browser
 * dengan daftar target yang di-hardcode. Guru dan mitra DUDI tidak pernah
 * melihat pengumuman apa pun. Di sini penyaringan dipindah ke server dan
 * ditambah penanda sudah-dibaca.
 */

import { prisma } from '@/lib/prisma'
import type { AksiHasil } from '@/lib/types/aksi'
import { optionalSession, requireSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/logic/rbac'

/** Nilai `target` yang berlaku untuk sebuah role. */
function targetUntukRole(role: string): string[] {
  const umum = ['Semua Pengguna', 'ALL', 'SEMUA']
  switch (role) {
    case 'STUDENT':
      return [...umum, 'Siswa', 'STUDENT']
    case 'TEACHER':
      return [...umum, 'Guru', 'TEACHER']
    case 'DUDI':
      return [...umum, 'Mitra DUDI', 'DUDI', 'Industri']
    case 'ADMIN':
      return [...umum, 'Admin', 'ADMIN']
    default:
      return umum
  }
}

export async function getMyBroadcasts(limit = 30) {
  const session = await optionalSession()
  if (!session) return []

  // Admin melihat seluruh pengumuman agar bisa mengelola; role lain hanya
  // yang ditujukan kepadanya, plus yang ditargetkan ke kelasnya.
  let where: Record<string, unknown> = {}
  if (session.role !== 'ADMIN') {
    const targets = targetUntukRole(session.role)
    const kelas =
      session.role === 'STUDENT'
        ? (
            await prisma.classStudent.findMany({
              where: { userId: session.uid },
              select: { classId: true },
            })
          ).map((c) => c.classId)
        : []
    where = { OR: [{ target: { in: targets } }, { target: { in: kelas } }] }
  }

  const rows = await prisma.broadcast.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      reads: { where: { userId: session.uid }, select: { readAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    message: b.message,
    target: b.target,
    createdAt: b.createdAt,
    author: b.author,
    sudahDibaca: b.reads.length > 0,
    dibacaPada: b.reads[0]?.readAt ?? null,
  }))
}

export async function getUnreadBroadcastCount() {
  const list = await getMyBroadcasts(50)
  return list.filter((b) => !b.sudahDibaca).length
}

export async function markBroadcastRead(broadcastId: string): Promise<AksiHasil> {
  try {
    const session = await requireSession()
    await prisma.broadcastRead.upsert({
      where: { broadcastId_userId: { broadcastId, userId: session.uid } },
      update: {},
      create: { broadcastId, userId: session.uid },
    })
    return { success: true }
  } catch (err) {
    if (err instanceof ForbiddenError) return { error: err.message }
    return { error: 'Gagal menandai pengumuman.' }
  }
}

export async function markAllBroadcastsRead(): Promise<AksiHasil<{ count: number }>> {
  try {
    const session = await requireSession()
    const list = await getMyBroadcasts(50)
    const belum = list.filter((b) => !b.sudahDibaca)
    if (belum.length === 0) return { success: true, count: 0 }

    await prisma.broadcastRead.createMany({
      data: belum.map((b) => ({ broadcastId: b.id, userId: session.uid })),
      skipDuplicates: true,
    })
    return { success: true, count: belum.length }
  } catch {
    return { error: 'Gagal menandai pengumuman.' }
  }
}
