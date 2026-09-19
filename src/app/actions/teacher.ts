'use server'

import { prisma } from '@/lib/prisma'
import type { AksiHasil } from '@/lib/types/aksi'
import { optionalSession, requireSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/logic/rbac'
import { keNilaiAkhir, koreksiOtomatis,
  type TipeSoal,
} from '@/lib/logic/exam'
import { dateKeyWIB, rentangHariWIB, slotKeyPresensi } from '@/lib/logic/waktu'

/** Status presensi yang boleh diinput manual oleh guru. */
const STATUS_MANUAL = ['hadir', 'terlambat', 'sakit', 'izin', 'alfa'] as const
type StatusManual = (typeof STATUS_MANUAL)[number]

function gagal(err: unknown) {
  if (err instanceof ForbiddenError) return { error: err.message }
  const message = err instanceof Error ? err.message : 'Terjadi kesalahan.'
  return { error: message }
}

/**
 * Guru hanya boleh menyentuh kelas yang benar-benar diampunya (atau kelas
 * yang ia jadi wali). ADMIN dilewatkan. Tanpa ini, `classId` yang dikirim
 * dari browser bisa dipakai menilai atau mengabsen kelas orang lain.
 */
async function pastikanAksesKelas(
  session: { uid: string; role: string },
  classId: string,
  subjectId?: string | null
): Promise<void> {
  if (session.role === 'ADMIN') return

  const [ampu, wali] = await Promise.all([
    prisma.classTeacher.findFirst({
      where: {
        userId: session.uid,
        classId,
        ...(subjectId ? { subjectId } : {}),
      },
      select: { userId: true },
    }),
    prisma.class.findFirst({
      where: { id: classId, waliId: session.uid },
      select: { id: true },
    }),
  ])

  if (!ampu && !wali) {
    throw new ForbiddenError('Kamu tidak mengampu kelas ini.')
  }
}

// ==========================================
// KELAS YANG DIAMPU
// ==========================================

export async function getTeacherClasses() {
  const session = await optionalSession('TEACHER', 'ADMIN')
  if (!session) return []

  // ADMIN melihat semua penugasan agar bisa memverifikasi data.
  const where = session.role === 'ADMIN' ? {} : { userId: session.uid }

  return await prisma.classTeacher.findMany({
    where,
    include: {
      classInfo: {
        include: {
          students: {
            include: {
              user: { select: { id: true, name: true, username: true } },
            },
          },
          wali: { select: { id: true, name: true } },
        },
      },
      subject: true,
    },
    orderBy: [{ classId: 'asc' }],
  })
}

/**
 * Pilihan rombel dan mapel untuk guru menentukan sendiri apa yang diampunya.
 *
 * Per keputusan sekolah, guru mengambil sendiri kelas + mapel dan langsung
 * berlaku tanpa persetujuan admin. Yang tetap dijaga: guru hanya bisa
 * mengambil untuk DIRINYA SENDIRI — `claimTeaching` selalu memakai id dari
 * sesi, bukan dari parameter, sehingga tidak ada guru yang bisa menugaskan
 * atau melepas guru lain.
 */
export async function getTeachingOptions() {
  const session = await optionalSession('TEACHER', 'ADMIN')
  if (!session) return { classes: [], subjects: [], mine: [] }

  const [classes, subjects, mine] = await Promise.all([
    prisma.class.findMany({
      select: { id: true, name: true, level: true },
      orderBy: { name: 'asc' },
    }),
    prisma.subject.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
    prisma.classTeacher.findMany({
      where: { userId: session.uid },
      select: {
        classId: true,
        subjectId: true,
        classInfo: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    }),
  ])

  return { classes, subjects, mine }
}

/** Guru mengambil satu kombinasi rombel + mapel untuk dirinya sendiri. */
export async function claimTeaching(
  classId: string,
  subjectId: string
): Promise<AksiHasil<{ className: string; subjectName: string }>> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')

    if (!classId || !subjectId) {
      return { error: 'Pilih rombel dan mata pelajaran dulu.' }
    }

    const [kelas, mapel] = await Promise.all([
      prisma.class.findUnique({ where: { id: classId }, select: { name: true } }),
      prisma.subject.findUnique({ where: { id: subjectId }, select: { name: true } }),
    ])
    if (!kelas) return { error: 'Rombel tidak ditemukan.' }
    if (!mapel) return { error: 'Mata pelajaran tidak ditemukan.' }

    const existing = await prisma.classTeacher.findUnique({
      where: {
        userId_classId_subjectId: { userId: session.uid, classId, subjectId },
      },
      select: { userId: true },
    })
    if (existing) {
      return { error: `Kamu sudah mengampu ${mapel.name} di ${kelas.name}.` }
    }

    await prisma.classTeacher.create({
      data: { userId: session.uid, classId, subjectId },
    })

    return { success: true, className: kelas.name, subjectName: mapel.name }
  } catch (err) {
    return gagal(err)
  }
}

/**
 * Guru melepas kombinasi rombel + mapel miliknya sendiri.
 *
 * Jurnal, materi, tugas, dan ujian yang sudah dibuat TIDAK terhapus — hanya
 * hak aksesnya yang hilang, sehingga guru tidak bisa lagi membukanya sampai
 * mengambil kembali kelas tersebut.
 */
export async function releaseTeaching(
  classId: string,
  subjectId: string
): Promise<AksiHasil<{ terkait: number }>> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')

    const existing = await prisma.classTeacher.findUnique({
      where: {
        userId_classId_subjectId: { userId: session.uid, classId, subjectId },
      },
      select: { userId: true },
    })
    if (!existing) return { error: 'Penugasan itu bukan milikmu.' }

    // Hitung data yang akan kehilangan akses, untuk diberitahukan ke guru.
    const [jurnal, materi, tugas, ujian] = await Promise.all([
      prisma.journal.count({ where: { authorId: session.uid, classId, subjectId } }),
      prisma.material.count({ where: { authorId: session.uid, classId, subjectId } }),
      prisma.assignment.count({ where: { authorId: session.uid, classId, subjectId } }),
      prisma.exam.count({ where: { authorId: session.uid, classId, subjectId } }),
    ])

    await prisma.classTeacher.delete({
      where: {
        userId_classId_subjectId: { userId: session.uid, classId, subjectId },
      },
    })

    return { success: true, terkait: jurnal + materi + tugas + ujian }
  } catch (err) {
    return gagal(err)
  }
}

export async function getStudentsByClass(classId: string) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, classId)

    const students = await prisma.classStudent.findMany({
      where: { classId },
      include: { user: { select: { id: true, name: true, username: true } } },
      orderBy: { user: { name: 'asc' } },
    })
    return students.map((s) => s.user)
  } catch {
    return []
  }
}

// ==========================================
// PRESENSI
// ==========================================

export async function getClassAttendanceToday(classId: string) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, classId)

    return await prisma.attendance.findMany({
      where: { classId, dateKey: dateKeyWIB() },
      include: {
        user: { select: { id: true, name: true, username: true } },
        subject: { select: { id: true, name: true } },
      },
    })
  } catch {
    return []
  }
}

/**
 * Daftar siswa kelas beserta presensinya pada satu tanggal — bahan layar
 * input absensi manual. `subjectId` kosong berarti presensi harian.
 */
export async function getAttendanceSheet(input: {
  classId: string
  dateKey?: string
  subjectId?: string | null
}) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, input.classId, input.subjectId)

    const dateKey = input.dateKey || dateKeyWIB()
    const slotKey = slotKeyPresensi(dateKey, input.subjectId)

    const [students, records] = await Promise.all([
      prisma.classStudent.findMany({
        where: { classId: input.classId },
        include: { user: { select: { id: true, name: true, username: true } } },
        orderBy: { user: { name: 'asc' } },
      }),
      prisma.attendance.findMany({
        where: { classId: input.classId, slotKey },
        include: { recordedBy: { select: { id: true, name: true } } },
      }),
    ])

    const byUser = new Map(records.map((r) => [r.userId, r]))

    return {
      dateKey,
      rows: students.map((s) => {
        const rec = byUser.get(s.user.id)
        return {
          student: s.user,
          status: rec?.status ?? null,
          note: rec?.note ?? null,
          lat: rec?.lat ?? null,
          lng: rec?.lng ?? null,
          distance: rec?.distance ?? null,
          checkOutTime: rec?.checkOutTime ?? null,
          // Presensi mandiri siswa (recordedById null) ditandai agar guru
          // tahu mana yang hasil GPS dan mana yang input manual.
          mandiri: rec ? rec.recordedById === null : false,
          recordedBy: rec?.recordedBy?.name ?? null,
        }
      }),
    }
  } catch {
    return { dateKey: input.dateKey || dateKeyWIB(), rows: [] }
  }
}

/**
 * Simpan presensi manual (hadir/terlambat/sakit/izin/alfa) untuk sejumlah
 * siswa sekaligus. Sebelumnya guru sama sekali tidak punya jalan untuk ini —
 * satu-satunya sumber presensi adalah check-in GPS siswa, sehingga siswa
 * sakit atau izin selamanya tercatat tanpa keterangan.
 */
export async function saveManualAttendance(input: {
  classId: string
  dateKey?: string
  subjectId?: string | null
  entries: { userId: string; status: string; note?: string }[]
}): Promise<AksiHasil<{ count: number }>> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, input.classId, input.subjectId)

    if (!input.entries?.length) return { error: 'Tidak ada data presensi.' }

    const dateKey = input.dateKey || dateKeyWIB()
    const slotKey = slotKeyPresensi(dateKey, input.subjectId)
    const tanggal = rentangHariWIB(dateKey).mulai

    // Hanya siswa yang benar-benar anggota kelas ini.
    const anggota = new Set(
      (
        await prisma.classStudent.findMany({
          where: { classId: input.classId },
          select: { userId: true },
        })
      ).map((s) => s.userId)
    )

    const valid = input.entries.filter(
      (e) =>
        anggota.has(e.userId) &&
        STATUS_MANUAL.includes(e.status as StatusManual)
    )

    if (valid.length === 0) {
      return { error: 'Tidak ada entri presensi yang valid.' }
    }

    await prisma.$transaction(
      valid.map((e) =>
        prisma.attendance.upsert({
          where: { userId_slotKey: { userId: e.userId, slotKey } },
          update: {
            status: e.status,
            note: e.note?.trim() || null,
            recordedById: session.uid,
            classId: input.classId,
            subjectId: input.subjectId || null,
          },
          create: {
            userId: e.userId,
            classId: input.classId,
            subjectId: input.subjectId || null,
            date: tanggal,
            dateKey,
            slotKey,
            kind: input.subjectId ? 'SUBJECT' : 'DAILY',
            status: e.status,
            note: e.note?.trim() || null,
            recordedById: session.uid,
          },
        })
      )
    )

    return { success: true, count: valid.length }
  } catch (err) {
    return gagal(err)
  }
}

/** Rekap kehadiran satu kelas dalam rentang tanggal. */
export async function getAttendanceRecap(input: {
  classId: string
  from: string
  to: string
  subjectId?: string | null
}) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, input.classId, input.subjectId)

    const [students, records] = await Promise.all([
      prisma.classStudent.findMany({
        where: { classId: input.classId },
        include: {
          // nomorInduk (NIS) dipakai kolom identitas pada laporan cetak.
          user: { select: { id: true, name: true, username: true, nomorInduk: true } },
        },
        orderBy: { user: { name: 'asc' } },
      }),
      prisma.attendance.findMany({
        where: {
          classId: input.classId,
          dateKey: { gte: input.from, lte: input.to },
          ...(input.subjectId
            ? { subjectId: input.subjectId }
            : { kind: 'DAILY' }),
        },
        select: { userId: true, status: true, dateKey: true },
      }),
    ])

    const kosong = () => ({
      hadir: 0,
      terlambat: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      lain: 0,
      total: 0,
    })
    type Hitung = ReturnType<typeof kosong>

    const per = new Map<string, Hitung>()
    for (const s of students) per.set(s.user.id, kosong())

    for (const r of records) {
      const row = per.get(r.userId)
      if (!row) continue
      const key = r.status as keyof Hitung
      if (key in row && key !== 'total' && key !== 'lain') row[key]++
      else row.lain++
      row.total++
    }

    return {
      rows: students.map((s) => ({
        student: s.user,
        ...(per.get(s.user.id) ?? kosong()),
      })),
    }
  } catch {
    return { rows: [] }
  }
}

// ==========================================
// JURNAL MENGAJAR
// ==========================================

export async function getTeacherJournals() {
  const session = await optionalSession('TEACHER', 'ADMIN')
  if (!session) return []

  return await prisma.journal.findMany({
    where: session.role === 'ADMIN' ? {} : { authorId: session.uid },
    include: {
      classInfo: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

export async function createJournal(data: {
  title: string
  content: string
  classId: string
  subjectId: string
  tanggal?: string
  jamKe?: string
  hadir?: number
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, data.classId, data.subjectId)

    if (!data.title?.trim()) return { error: 'Judul jurnal harus diisi.' }
    if (!data.content?.trim()) return { error: 'Isi jurnal harus diisi.' }

    await prisma.journal.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        authorId: session.uid,
        classId: data.classId,
        subjectId: data.subjectId,
        tanggal: data.tanggal ? new Date(data.tanggal) : new Date(),
        jamKe: data.jamKe?.trim() || null,
        hadir: typeof data.hadir === 'number' ? data.hadir : null,
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteJournal(id: string): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    const journal = await prisma.journal.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!journal) return { error: 'Jurnal tidak ditemukan.' }
    if (session.role !== 'ADMIN' && journal.authorId !== session.uid) {
      return { error: 'Kamu hanya boleh menghapus jurnalmu sendiri.' }
    }
    await prisma.journal.delete({ where: { id } })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// MATERI
// ==========================================

export async function getTeacherMaterials() {
  const session = await optionalSession('TEACHER', 'ADMIN')
  if (!session) return []

  return await prisma.material.findMany({
    where: session.role === 'ADMIN' ? {} : { authorId: session.uid },
    include: {
      classInfo: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createMaterial(data: {
  title: string
  description?: string
  url?: string
  classId: string
  subjectId: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, data.classId, data.subjectId)

    if (!data.title?.trim()) return { error: 'Judul materi harus diisi.' }

    await prisma.material.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        url: data.url?.trim() || '',
        kind: 'LINK',
        authorId: session.uid,
        classId: data.classId,
        subjectId: data.subjectId,
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteMaterial(id: string): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    const material = await prisma.material.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!material) return { error: 'Materi tidak ditemukan.' }
    if (session.role !== 'ADMIN' && material.authorId !== session.uid) {
      return { error: 'Kamu hanya boleh menghapus materimu sendiri.' }
    }
    await prisma.material.delete({ where: { id } })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// TUGAS & PENILAIAN
// ==========================================

export async function getGradesByClass(classId: string, subjectId: string) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, classId, subjectId)

    const [assignments, students] = await Promise.all([
      prisma.assignment.findMany({
        where: { classId, subjectId },
        include: {
          submissions: {
            include: {
              user: { select: { id: true, name: true, username: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.classStudent.findMany({
        where: { classId },
        include: { user: { select: { id: true, name: true, username: true } } },
        orderBy: { user: { name: 'asc' } },
      }),
    ])

    return { assignments, students: students.map((s) => s.user) }
  } catch {
    return { assignments: [], students: [] }
  }
}

export async function createAssignment(data: {
  title: string
  description?: string
  classId: string
  subjectId: string
  dueDate?: string
  maxScore?: number
  allowLateSubmission?: boolean
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, data.classId, data.subjectId)

    if (!data.title?.trim()) return { error: 'Judul tugas harus diisi.' }

    await prisma.assignment.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        dueDate: data.dueDate
          ? new Date(data.dueDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: data.maxScore && data.maxScore > 0 ? data.maxScore : 100,
        allowLateSubmission: data.allowLateSubmission ?? true,
        authorId: session.uid,
        classId: data.classId,
        subjectId: data.subjectId,
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteAssignment(id: string): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    const item = await prisma.assignment.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!item) return { error: 'Tugas tidak ditemukan.' }
    if (session.role !== 'ADMIN' && item.authorId !== session.uid) {
      return { error: 'Kamu hanya boleh menghapus tugasmu sendiri.' }
    }
    await prisma.assignment.delete({ where: { id } })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

/** Daftar pengumpulan satu tugas, lengkap dengan jawaban siswa. */
export async function getAssignmentSubmissions(assignmentId: string) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classInfo: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
    })
    if (!assignment) return null
    await pastikanAksesKelas(session, assignment.classId, assignment.subjectId)

    const [students, submissions] = await Promise.all([
      prisma.classStudent.findMany({
        where: { classId: assignment.classId },
        include: { user: { select: { id: true, name: true, username: true } } },
        orderBy: { user: { name: 'asc' } },
      }),
      prisma.userAssignment.findMany({ where: { assignmentId } }),
    ])

    const byUser = new Map(submissions.map((s) => [s.userId, s]))

    return {
      assignment,
      rows: students.map((s) => ({
        student: s.user,
        submission: byUser.get(s.user.id) ?? null,
      })),
    }
  } catch {
    return null
  }
}

export async function saveGrade(data: {
  userId: string
  assignmentId: string
  score: number
  description?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')

    const assignment = await prisma.assignment.findUnique({
      where: { id: data.assignmentId },
      select: { classId: true, subjectId: true, maxScore: true },
    })
    if (!assignment) return { error: 'Tugas tidak ditemukan.' }
    await pastikanAksesKelas(session, assignment.classId, assignment.subjectId)

    const score = Number(data.score)
    if (!Number.isFinite(score) || score < 0 || score > assignment.maxScore) {
      return { error: `Nilai harus antara 0 dan ${assignment.maxScore}.` }
    }

    await prisma.userAssignment.upsert({
      where: {
        userId_assignmentId: {
          userId: data.userId,
          assignmentId: data.assignmentId,
        },
      },
      update: {
        score,
        description: data.description?.trim() || null,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedById: session.uid,
      },
      create: {
        userId: data.userId,
        assignmentId: data.assignmentId,
        score,
        description: data.description?.trim() || null,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedById: session.uid,
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// LAPORAN CETAK
// ==========================================

/**
 * Jurnal mengajar satu kelas+mapel pada rentang tanggal, untuk dicetak.
 *
 * `getTeacherJournals()` yang sudah ada mengambil seluruh jurnal guru tanpa
 * penyaringan kelas maupun tanggal, sehingga tidak bisa dipakai membuat
 * laporan per rombel.
 */
export async function getLaporanJurnal(input: {
  classId: string
  subjectId: string
  from: string
  to: string
}) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, input.classId, input.subjectId)

    const { mulai } = rentangHariWIB(input.from)
    const { selesai } = rentangHariWIB(input.to)

    const [jurnal, kelas, mapel, guru] = await Promise.all([
      prisma.journal.findMany({
        where: {
          classId: input.classId,
          subjectId: input.subjectId,
          ...(session.role === 'ADMIN' ? {} : { authorId: session.uid }),
          tanggal: { gte: mulai, lt: selesai },
        },
        select: {
          id: true,
          title: true,
          content: true,
          tanggal: true,
          jamKe: true,
          hadir: true,
          author: { select: { name: true } },
        },
        orderBy: { tanggal: 'asc' },
      }),
      prisma.class.findUnique({
        where: { id: input.classId },
        select: { name: true, _count: { select: { students: true } } },
      }),
      prisma.subject.findUnique({
        where: { id: input.subjectId },
        select: { name: true },
      }),
      prisma.user.findUnique({
        where: { id: session.uid },
        select: { name: true, nomorInduk: true },
      }),
    ])

    return { jurnal, kelas, mapel, guru }
  } catch {
    return null
  }
}

/**
 * Daftar nilai satu kelas+mapel siap cetak: matriks siswa x penilaian,
 * lengkap dengan rata-rata per siswa.
 */
export async function getLaporanNilai(input: {
  classId: string
  subjectId: string
}) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, input.classId, input.subjectId)

    const [tugas, siswa, kelas, mapel, guru] = await Promise.all([
      prisma.assignment.findMany({
        where: { classId: input.classId, subjectId: input.subjectId },
        select: {
          id: true,
          title: true,
          maxScore: true,
          submissions: { select: { userId: true, score: true, status: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.classStudent.findMany({
        where: { classId: input.classId },
        select: { user: { select: { id: true, name: true, nomorInduk: true, username: true } } },
        orderBy: { user: { name: 'asc' } },
      }),
      prisma.class.findUnique({ where: { id: input.classId }, select: { name: true } }),
      prisma.subject.findUnique({ where: { id: input.subjectId }, select: { name: true } }),
      prisma.user.findUnique({
        where: { id: session.uid },
        select: { name: true, nomorInduk: true },
      }),
    ])

    // Susun matriks di server agar komponen cetak tinggal menampilkan.
    const rows = siswa.map((s) => {
      const nilai = tugas.map((t) => {
        const sub = t.submissions.find((x) => x.userId === s.user.id)
        return sub?.status === 'GRADED' && sub.score !== null ? sub.score : null
      })
      const terisi = nilai.filter((n): n is number => n !== null)
      const rata =
        terisi.length > 0
          ? Math.round((terisi.reduce((a, b) => a + b, 0) / terisi.length) * 100) / 100
          : null
      return { siswa: s.user, nilai, rata }
    })

    return {
      tugas: tugas.map((t) => ({ id: t.id, title: t.title, maxScore: t.maxScore })),
      rows,
      kelas,
      mapel,
      guru,
    }
  } catch {
    return null
  }
}

/**
 * Rekap kehadiran siap cetak. Berbeda dari `getAttendanceRecap()` yang dipakai
 * layar: di sini ikut dibawa identitas kelas, mapel, dan guru untuk kop.
 */
export async function getLaporanKehadiran(input: {
  classId: string
  subjectId?: string | null
  from: string
  to: string
}) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, input.classId, input.subjectId)

    const [rekap, kelas, mapel, guru] = await Promise.all([
      getAttendanceRecap({
        classId: input.classId,
        from: input.from,
        to: input.to,
        subjectId: input.subjectId ?? null,
      }),
      prisma.class.findUnique({
        where: { id: input.classId },
        select: { name: true, wali: { select: { name: true } } },
      }),
      input.subjectId
        ? prisma.subject.findUnique({
            where: { id: input.subjectId },
            select: { name: true },
          })
        : Promise.resolve(null),
      prisma.user.findUnique({
        where: { id: session.uid },
        select: { name: true, nomorInduk: true },
      }),
    ])

    return { rows: rekap.rows, kelas, mapel, guru }
  } catch {
    return null
  }
}

// ==========================================
// PELANGGARAN / KESISWAAN
// ==========================================

export async function createViolation(data: {
  studentId: string
  description: string
  points: number
  category?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')

    if (!data.description?.trim()) {
      return { error: 'Keterangan pelanggaran harus diisi.' }
    }
    const points = Number(data.points)
    if (!Number.isFinite(points) || points < 0 || points > 100) {
      return { error: 'Poin pelanggaran harus antara 0 dan 100.' }
    }

    const siswa = await prisma.user.findFirst({
      where: { id: data.studentId, role: 'STUDENT' },
      select: { id: true },
    })
    if (!siswa) return { error: 'Siswa tidak ditemukan.' }

    await prisma.violation.create({
      data: {
        studentId: data.studentId,
        reporterId: session.uid,
        description: data.description.trim(),
        category: data.category?.trim() || null,
        points,
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function getReportedViolations() {
  const session = await optionalSession('TEACHER', 'ADMIN')
  if (!session) return []

  return await prisma.violation.findMany({
    where: session.role === 'ADMIN' ? {} : { reporterId: session.uid },
    include: {
      student: { select: { id: true, name: true, username: true } },
      reporter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

export async function updateViolationStatus(input: {
  id: string
  status: string
  followUp?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    if (!['OPEN', 'FOLLOW_UP', 'CLOSED'].includes(input.status)) {
      return { error: 'Status tidak dikenal.' }
    }
    const item = await prisma.violation.findUnique({
      where: { id: input.id },
      select: { reporterId: true },
    })
    if (!item) return { error: 'Data pelanggaran tidak ditemukan.' }
    if (session.role !== 'ADMIN' && item.reporterId !== session.uid) {
      return { error: 'Hanya pelapor atau admin yang boleh menindaklanjuti.' }
    }

    await prisma.violation.update({
      where: { id: input.id },
      data: {
        status: input.status,
        followUp: input.followUp?.trim() || null,
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// UJIAN / CBT
// ==========================================

export async function getTeacherExams() {
  const session = await optionalSession('TEACHER', 'ADMIN')
  if (!session) return []

  return await prisma.exam.findMany({
    where: session.role === 'ADMIN' ? {} : { authorId: session.uid },
    include: {
      questions: { orderBy: { order: 'asc' } },
      classInfo: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      submissions: {
        select: {
          id: true,
          userId: true,
          status: true,
          score: true,
          scoreMax: true,
          essayScore: true,
          finalScore: true,
          submittedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createExam(data: {
  title: string
  description?: string
  type: string
  classId: string
  subjectId: string
  duration: number
  startAt?: string
  endAt?: string
  token?: string
  shuffle?: boolean
  isPublished?: boolean
  passingScore?: number
  questions: {
    question: string
    imageUrl?: string
    type: string
    options?: string
    correctAnswer?: string
    points: number
  }[]
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, data.classId, data.subjectId)

    if (!data.title?.trim()) return { error: 'Judul ujian harus diisi.' }
    if (!data.questions?.length) return { error: 'Ujian minimal punya 1 soal.' }

    const duration = Number(data.duration)
    if (!Number.isFinite(duration) || duration < 1) {
      return { error: 'Durasi ujian tidak valid.' }
    }

    const startAt = data.startAt ? new Date(data.startAt) : null
    const endAt = data.endAt ? new Date(data.endAt) : null
    if (startAt && endAt && endAt <= startAt) {
      return { error: 'Waktu selesai harus setelah waktu mulai.' }
    }

    await prisma.exam.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        type: data.type,
        classId: data.classId,
        subjectId: data.subjectId,
        authorId: session.uid,
        duration,
        startAt,
        endAt,
        token: data.token?.trim().toUpperCase() || null,
        shuffle: data.shuffle ?? true,
        isPublished: data.isPublished ?? false,
        passingScore:
          typeof data.passingScore === 'number' ? data.passingScore : null,
        questions: {
          create: data.questions.map((q, i) => ({
            question: q.question,
            imageUrl: q.imageUrl || null,
            type: q.type,
            options: q.options || null,
            correctAnswer: q.correctAnswer || null,
            points: q.points,
            order: i,
          })),
        },
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

async function examMilikSaya(session: { uid: string; role: string }, examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { id: true, authorId: true, classId: true, subjectId: true, token: true },
  })
  if (!exam) throw new ForbiddenError('Ujian tidak ditemukan.')
  if (session.role !== 'ADMIN' && exam.authorId !== session.uid) {
    throw new ForbiddenError('Kamu hanya boleh mengubah ujian buatanmu.')
  }
  return exam
}

/**
 * Atur jendela pelaksanaan, token, dan status terbit ujian. Tanpa ini semua
 * ujian selalu terbuka untuk siswa begitu dibuat.
 */
export async function updateExamSettings(input: {
  examId: string
  startAt?: string | null
  endAt?: string | null
  token?: string | null
  duration?: number
  shuffle?: boolean
  isPublished?: boolean
  showResult?: boolean
  passingScore?: number | null
}): Promise<AksiHasil<{ peringatan: string }>> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    const exam = await examMilikSaya(session, input.examId)

    // Menerbitkan ujian tanpa soal membuatnya tampil ke siswa tetapi mustahil
    // dikerjakan — ditolak di sini daripada baru ketahuan saat ujian mulai.
    let peringatan = ''
    if (input.isPublished === true) {
      const jumlahSoal = await prisma.examQuestion.count({
        where: { examId: input.examId },
      })
      if (jumlahSoal === 0) {
        return { error: 'Ujian belum punya soal, jadi belum bisa diterbitkan.' }
      }

      // Tanpa token khusus DAN tanpa token global, siswa tidak akan pernah
      // bisa membuka ujian ini. Bukan galat — tapi wajib diberitahukan.
      const tokenBaru =
        input.token !== undefined ? input.token?.trim() : exam.token?.trim()
      if (!tokenBaru) {
        const global = await prisma.appSetting.findUnique({
          where: { key: 'CBT_TOKEN' },
        })
        if (!global?.value?.trim()) {
          peringatan =
            'Ujian terbit, tetapi belum ada token — baik token khusus ujian ini maupun token CBT global. Siswa belum bisa masuk sampai salah satunya diisi.'
        }
      }
    }

    const startAt = input.startAt ? new Date(input.startAt) : null
    const endAt = input.endAt ? new Date(input.endAt) : null
    if (startAt && endAt && endAt <= startAt) {
      return { error: 'Waktu selesai harus setelah waktu mulai.' }
    }
    if (
      input.duration !== undefined &&
      (!Number.isFinite(input.duration) || input.duration < 1)
    ) {
      return { error: 'Durasi ujian tidak valid.' }
    }

    await prisma.exam.update({
      where: { id: input.examId },
      data: {
        ...(input.startAt !== undefined ? { startAt } : {}),
        ...(input.endAt !== undefined ? { endAt } : {}),
        ...(input.token !== undefined
          ? { token: input.token?.trim().toUpperCase() || null }
          : {}),
        ...(input.duration !== undefined ? { duration: input.duration } : {}),
        ...(input.shuffle !== undefined ? { shuffle: input.shuffle } : {}),
        ...(input.isPublished !== undefined
          ? { isPublished: input.isPublished }
          : {}),
        ...(input.showResult !== undefined
          ? { showResult: input.showResult }
          : {}),
        ...(input.passingScore !== undefined
          ? { passingScore: input.passingScore }
          : {}),
      },
    })
    return peringatan ? { success: true, peringatan } : { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteExam(examId: string): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await examMilikSaya(session, examId)
    await prisma.exam.delete({ where: { id: examId } })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

/**
 * Lembar koreksi: peserta, jawabannya, dan soal esai yang menunggu nilai.
 * Field `essayScore` sudah ada di basis data sejak awal tapi belum pernah
 * bisa diisi karena tidak ada action maupun antarmukanya.
 */
export async function getExamSubmissions(examId: string) {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await examMilikSaya(session, examId)

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: { orderBy: { order: 'asc' } },
        classInfo: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        submissions: {
          include: {
            user: { select: { id: true, name: true, username: true } },
            gradedBy: { select: { id: true, name: true } },
          },
          orderBy: { user: { name: 'asc' } },
        },
      },
    })
    if (!exam) return null

    const bobotEsai = exam.questions
      .filter((q) => q.type === 'ESAI')
      .reduce((n, q) => n + q.points, 0)

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        duration: exam.duration,
        startAt: exam.startAt,
        endAt: exam.endAt,
        token: exam.token,
        shuffle: exam.shuffle,
        isPublished: exam.isPublished,
        showResult: exam.showResult,
        passingScore: exam.passingScore,
        classInfo: exam.classInfo,
        subject: exam.subject,
      },
      questions: exam.questions,
      bobotEsai,
      submissions: exam.submissions.map((s) => ({
        ...s,
        // Jawaban disimpan sebagai JSON string; parse di server agar
        // komponen klien tidak perlu tahu formatnya.
        parsedAnswers: parseJawaban(s.answers),
      })),
    }
  } catch {
    return null
  }
}

function parseJawaban(raw: string | null): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) out[k] = String(v)
    return out
  } catch {
    return {}
  }
}

/**
 * Isi nilai esai lalu hitung nilai akhir 0–100 dari gabungan bobot PG dan
 * esai.
 */
export async function saveEssayScore(input: {
  submissionId: string
  essayScore: number
}): Promise<AksiHasil<{ finalScore: number }>> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')

    const submission = await prisma.examSubmission.findUnique({
      where: { id: input.submissionId },
      include: { exam: { include: { questions: true } } },
    })
    if (!submission) return { error: 'Data pengerjaan tidak ditemukan.' }
    await examMilikSaya(session, submission.examId)

    const bobotEsai = submission.exam.questions
      .filter((q) => q.type === 'ESAI')
      .reduce((n, q) => n + q.points, 0)

    const essayScore = Number(input.essayScore)
    if (!Number.isFinite(essayScore) || essayScore < 0 || essayScore > bobotEsai) {
      return { error: `Nilai esai harus antara 0 dan ${bobotEsai}.` }
    }

    const skorPg = submission.score ?? 0
    const bobotPg = submission.scoreMax ?? 0
    const finalScore = keNilaiAkhir(skorPg + essayScore, bobotPg + bobotEsai, 100)

    await prisma.examSubmission.update({
      where: { id: submission.id },
      data: {
        essayScore,
        essayMax: bobotEsai,
        finalScore,
        status: 'GRADED',
        gradedById: session.uid,
        gradedAt: new Date(),
      },
    })
    return { success: true, finalScore }
  } catch (err) {
    return gagal(err)
  }
}

/**
 * Hitung ulang skor otomatis seluruh peserta — dipakai bila guru membetulkan
 * kunci jawaban setelah ujian berjalan.
 */
export async function recomputeExamScores(examId: string): Promise<AksiHasil<{ count: number }>> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await examMilikSaya(session, examId)

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true, submissions: true },
    })
    if (!exam) return { error: 'Ujian tidak ditemukan.' }

    const soal = exam.questions.map((q) => ({
      id: q.id,
      type: q.type as TipeSoal,
      question: q.question,
      options: null,
      correctAnswer: q.correctAnswer,
      points: q.points,
    }))

    let diperbarui = 0
    for (const sub of exam.submissions) {
      if (sub.status === 'ONGOING') continue
      const jawaban = new Map(Object.entries(parseJawaban(sub.answers)))
      const { skorOtomatis, skorMaksOtomatis, bobotEsai } = koreksiOtomatis(
        soal,
        jawaban
      )
      const finalScore = keNilaiAkhir(
        skorOtomatis + (sub.essayScore ?? 0),
        skorMaksOtomatis + bobotEsai,
        100
      )
      await prisma.examSubmission.update({
        where: { id: sub.id },
        data: {
          score: skorOtomatis,
          scoreMax: skorMaksOtomatis,
          essayMax: bobotEsai,
          finalScore,
        },
      })
      diperbarui++
    }

    return { success: true, count: diperbarui }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// JADWAL
// ==========================================

export async function getTeacherSchedules() {
  const session = await optionalSession('TEACHER', 'ADMIN')
  if (!session) return []

  return await prisma.schedule.findMany({
    where: session.role === 'ADMIN' ? {} : { teacherId: session.uid },
    include: {
      classInfo: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      jamPelajaran: { select: { id: true, name: true } },
    },
    orderBy: [{ day: 'asc' }, { sessionStart: 'asc' }],
  })
}

export async function createSchedule(data: {
  day: string
  sessionStart: string
  sessionEnd: string
  classId: string
  subjectId?: string
  sessionId?: string
  room?: string
  type?: string
  label?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    await pastikanAksesKelas(session, data.classId, data.subjectId)

    // Kebijakan "guru input jadwal mandiri" di menu admin sebelumnya hanya
    // tombol di layar tanpa efek apa pun. Sekarang benar-benar ditegakkan.
    if (session.role === 'TEACHER') {
      const kebijakan = await prisma.appSetting.findUnique({
        where: { key: 'TEACHER_SELF_SCHEDULE' },
      })
      if (kebijakan?.value === '0') {
        return {
          error:
            'Penjadwalan mandiri oleh guru sedang dikunci admin. Hubungi admin untuk memplot jadwalmu.',
        }
      }
    }

    if (data.sessionEnd <= data.sessionStart) {
      return { error: 'Jam selesai harus setelah jam mulai.' }
    }

    // Cegah dua jadwal saling tumpang tindih di kelas yang sama.
    const bentrok = await prisma.schedule.findFirst({
      where: {
        day: data.day,
        classId: data.classId,
        sessionStart: { lt: data.sessionEnd },
        sessionEnd: { gt: data.sessionStart },
      },
      include: { subject: { select: { name: true } } },
    })
    if (bentrok) {
      return {
        error: `Bentrok dengan jadwal ${bentrok.sessionStart}-${bentrok.sessionEnd} (${bentrok.subject?.name || bentrok.label || 'lain'}) di kelas ini.`,
      }
    }

    // Guru yang sama tidak bisa mengajar dua kelas sekaligus.
    const bentrokGuru = await prisma.schedule.findFirst({
      where: {
        day: data.day,
        teacherId: session.uid,
        sessionStart: { lt: data.sessionEnd },
        sessionEnd: { gt: data.sessionStart },
      },
      include: { classInfo: { select: { name: true } } },
    })
    if (bentrokGuru) {
      return {
        error: `Kamu sudah punya jadwal jam ${bentrokGuru.sessionStart}-${bentrokGuru.sessionEnd} di kelas ${bentrokGuru.classInfo.name}.`,
      }
    }

    await prisma.schedule.create({
      data: {
        day: data.day,
        sessionStart: data.sessionStart,
        sessionEnd: data.sessionEnd,
        classId: data.classId,
        subjectId: data.subjectId || null,
        sessionId: data.sessionId || null,
        teacherId: session.uid,
        room: data.room?.trim() || null,
        type: data.type || 'REGULAR',
        label: data.label?.trim() || null,
      },
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteSchedule(scheduleId: string): Promise<AksiHasil> {
  try {
    const session = await requireSession('TEACHER', 'ADMIN')
    const item = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { teacherId: true },
    })
    if (!item) return { error: 'Jadwal tidak ditemukan.' }
    if (session.role !== 'ADMIN' && item.teacherId !== session.uid) {
      return { error: 'Kamu hanya boleh menghapus jadwalmu sendiri.' }
    }
    await prisma.schedule.delete({ where: { id: scheduleId } })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}
