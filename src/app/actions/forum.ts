'use server'

/**
 * Forum diskusi — dipakai bersama siswa, guru, dan admin.
 *
 * Sebelumnya action forum tinggal di `teacher.ts` dan memakai helper khusus
 * guru, sehingga siswa tidak bisa membuat topik maupun membalas sama sekali
 * meski model `ForumDiscussion`/`ForumReply` sudah ada.
 */

import { prisma } from '@/lib/prisma'
import type { AksiHasil } from '@/lib/types/aksi'
import { optionalSession, requireSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/logic/rbac'

function gagal(err: unknown) {
  if (err instanceof ForbiddenError) return { error: err.message }
  return { error: err instanceof Error ? err.message : 'Terjadi kesalahan.' }
}

/** Kelas yang boleh dilihat pengguna: rombelnya (siswa) atau yang diampu (guru). */
async function kelasTerkait(session: {
  uid: string
  role: string
}): Promise<string[]> {
  if (session.role === 'STUDENT') {
    const rows = await prisma.classStudent.findMany({
      where: { userId: session.uid },
      select: { classId: true },
    })
    return rows.map((r) => r.classId)
  }
  if (session.role === 'TEACHER') {
    const [ampu, wali] = await Promise.all([
      prisma.classTeacher.findMany({
        where: { userId: session.uid },
        select: { classId: true },
      }),
      prisma.class.findMany({
        where: { waliId: session.uid },
        select: { id: true },
      }),
    ])
    return [...new Set([...ampu.map((a) => a.classId), ...wali.map((w) => w.id)])]
  }
  return []
}

export async function getForumDiscussions() {
  const session = await optionalSession()
  if (!session) return []

  // Admin melihat semuanya; peran lain hanya topik umum (classId null) dan
  // topik kelas yang berkaitan dengan dirinya.
  let where = {}
  if (session.role !== 'ADMIN') {
    const classIds = await kelasTerkait(session)
    where = {
      OR: [{ classId: null }, { classId: { in: classIds } }],
    }
  }

  return await prisma.forumDiscussion.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, role: true } },
      classInfo: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      replies: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  })
}

export async function createForumDiscussion(data: {
  title: string
  content: string
  classId?: string
  subjectId?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession()

    if (!data.title?.trim()) return { error: 'Judul diskusi harus diisi.' }
    if (!data.content?.trim()) return { error: 'Isi diskusi harus diisi.' }

    // Siswa hanya boleh memposting ke kelasnya sendiri, tidak ke kelas lain.
    if (data.classId && session.role !== 'ADMIN') {
      const boleh = await kelasTerkait(session)
      if (!boleh.includes(data.classId)) {
        return { error: 'Kamu tidak terhubung dengan kelas itu.' }
      }
    }

    await prisma.forumDiscussion.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        authorId: session.uid,
        classId: data.classId || null,
        subjectId: data.subjectId || null,
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function addForumReply(discussionId: string, content: string): Promise<AksiHasil> {
  try {
    const session = await requireSession()
    if (!content?.trim()) return { error: 'Balasan tidak boleh kosong.' }

    const diskusi = await prisma.forumDiscussion.findUnique({
      where: { id: discussionId },
      select: { id: true, classId: true, isLocked: true },
    })
    if (!diskusi) return { error: 'Diskusi tidak ditemukan.' }
    if (diskusi.isLocked) return { error: 'Diskusi ini sudah ditutup.' }

    if (diskusi.classId && session.role !== 'ADMIN') {
      const boleh = await kelasTerkait(session)
      if (!boleh.includes(diskusi.classId)) {
        return { error: 'Kamu tidak terhubung dengan kelas itu.' }
      }
    }

    await prisma.forumReply.create({
      data: { discussionId, authorId: session.uid, content: content.trim() },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteForumDiscussion(id: string): Promise<AksiHasil> {
  try {
    const session = await requireSession()
    const item = await prisma.forumDiscussion.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!item) return { error: 'Diskusi tidak ditemukan.' }
    if (session.role !== 'ADMIN' && item.authorId !== session.uid) {
      return { error: 'Hanya penulis atau admin yang boleh menghapus.' }
    }
    await prisma.forumDiscussion.delete({ where: { id } })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteForumReply(id: string): Promise<AksiHasil> {
  try {
    const session = await requireSession()
    const item = await prisma.forumReply.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!item) return { error: 'Balasan tidak ditemukan.' }
    if (session.role !== 'ADMIN' && item.authorId !== session.uid) {
      return { error: 'Hanya penulis atau admin yang boleh menghapus.' }
    }
    await prisma.forumReply.delete({ where: { id } })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

/** Sematkan atau tutup diskusi — hanya guru dan admin. */
export async function moderateForumDiscussion(input: {
  id: string
  isPinned?: boolean
  isLocked?: boolean
}): Promise<AksiHasil> {
  try {
    await requireSession('TEACHER', 'ADMIN')
    await prisma.forumDiscussion.update({
      where: { id: input.id },
      data: {
        ...(input.isPinned !== undefined ? { isPinned: input.isPinned } : {}),
        ...(input.isLocked !== undefined ? { isLocked: input.isLocked } : {}),
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}
