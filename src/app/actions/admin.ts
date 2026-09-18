'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import type { AksiHasil } from '@/lib/types/aksi'
import { optionalSession, requireSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/logic/rbac'
import { hashPassword } from '@/lib/auth/password'
import { dateKeyWIB } from '@/lib/logic/waktu'
import type { Role } from '@prisma/client'

const PASSWORD_DEFAULT = '123456'

function gagal(err: unknown) {
  if (err instanceof ForbiddenError) return { error: err.message }
  return { error: err instanceof Error ? err.message : 'Terjadi kesalahan.' }
}

// ==========================================
// DASHBOARD
// ==========================================

export async function getDashboardStats() {
  const session = await optionalSession('ADMIN')
  if (!session) {
    return {
      students: 0,
      teachers: 0,
      admins: 0,
      dudi: 0,
      classes: 0,
      subjects: 0,
      schedules: 0,
      exams: 0,
      attendanceToday: 0,
      studentsWithoutClass: 0,
      database: 'Tidak terautentikasi',
    }
  }

  const [
    students,
    teachers,
    admins,
    dudi,
    classes,
    subjects,
    schedules,
    exams,
    attendanceToday,
    assignedStudents,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'DUDI' } }),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.schedule.count(),
    prisma.exam.count(),
    prisma.attendance.count({ where: { dateKey: dateKeyWIB(), kind: 'DAILY' } }),
    prisma.classStudent
      .findMany({ select: { userId: true }, distinct: ['userId'] })
      .then((r) => r.length),
  ])

  return {
    students,
    teachers,
    admins,
    dudi,
    classes,
    subjects,
    schedules,
    exams,
    attendanceToday,
    // Angka ini yang paling sering jadi akar masalah "fitur siswa kosong":
    // siswa tanpa rombel tidak melihat jadwal, tugas, materi, maupun ujian.
    studentsWithoutClass: Math.max(0, students - assignedStudents),
    database: 'Online (Supabase PostgreSQL)',
  }
}

/**
 * Daftar masalah integrasi yang bisa dideteksi otomatis, supaya admin tidak
 * perlu menebak kenapa sebuah menu tampak kosong.
 */
export async function getSystemHealth() {
  await requireSession('ADMIN')

  const [
    siswaTanpaKelas,
    kelasTanpaWali,
    kelasTanpaPengampu,
    mapelTanpaPengampu,
    kelasTanpaJadwal,
    ujianBelumTerbit,
    ujianTanpaSoal,
    geofence,
    tokenCbt,
    guruTanpaKelas,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', studentClasses: { none: {} } } }),
    prisma.class.count({ where: { waliId: null } }),
    prisma.class.count({ where: { teachers: { none: {} } } }),
    prisma.subject.count({ where: { teachers: { none: {} } } }),
    prisma.class.count({ where: { schedules: { none: {} } } }),
    prisma.exam.count({ where: { isPublished: false } }),
    prisma.exam.count({ where: { questions: { none: {} } } }),
    prisma.appSetting.findMany({
      where: {
        key: { in: ['SCHOOL_LATITUDE', 'SCHOOL_LONGITUDE', 'ATTENDANCE_RADIUS'] },
      },
    }),
    prisma.appSetting.findUnique({ where: { key: 'CBT_TOKEN' } }),
    prisma.user.count({ where: { role: 'TEACHER', teacherClasses: { none: {} } } }),
  ])

  const geofenceLengkap = geofence.length === 3 && geofence.every((g) => g.value)

  return [
    {
      key: 'siswa-tanpa-kelas',
      label: 'Siswa belum masuk rombel',
      count: siswaTanpaKelas,
      severity: siswaTanpaKelas > 0 ? 'error' : 'ok',
      hint: 'Tanpa rombel, siswa tidak melihat jadwal, tugas, materi, maupun ujian.',
      href: '/admin/classes',
    },
    {
      key: 'guru-tanpa-kelas',
      label: 'Guru belum diberi kelas & mapel',
      count: guruTanpaKelas,
      severity: guruTanpaKelas > 0 ? 'warn' : 'ok',
      hint: 'Guru tanpa penugasan tidak bisa membuat jurnal, tugas, atau ujian.',
      href: '/admin/classes',
    },
    {
      key: 'kelas-tanpa-pengampu',
      label: 'Rombel belum punya guru pengampu',
      count: kelasTanpaPengampu,
      severity: kelasTanpaPengampu > 0 ? 'error' : 'ok',
      hint: 'Kelas tanpa pengampu tidak akan pernah menerima materi atau tugas.',
      href: '/admin/classes',
    },
    {
      key: 'mapel-tanpa-pengampu',
      label: 'Mapel belum punya pengampu',
      count: mapelTanpaPengampu,
      severity: mapelTanpaPengampu > 0 ? 'warn' : 'ok',
      hint: 'Mapel ini tidak bisa dipakai membuat jadwal atau ujian.',
      href: '/admin/subjects',
    },
    {
      key: 'kelas-tanpa-wali',
      label: 'Rombel belum punya wali kelas',
      count: kelasTanpaWali,
      severity: kelasTanpaWali > 0 ? 'warn' : 'ok',
      hint: 'Wali kelas dibutuhkan untuk tindak lanjut pelanggaran dan presensi.',
      href: '/admin/classes',
    },
    {
      key: 'kelas-tanpa-jadwal',
      label: 'Rombel belum punya jadwal',
      count: kelasTanpaJadwal,
      severity: kelasTanpaJadwal > 0 ? 'warn' : 'ok',
      hint: 'Halaman jadwal siswa akan kosong sampai jadwal diplot.',
      href: '/admin/jadwal',
    },
    {
      key: 'ujian-tanpa-soal',
      label: 'Ujian tanpa soal',
      count: ujianTanpaSoal,
      severity: ujianTanpaSoal > 0 ? 'error' : 'ok',
      hint: 'Ujian tanpa soal tidak bisa dikerjakan siswa.',
      href: '/admin/ujian',
    },
    {
      key: 'ujian-belum-terbit',
      label: 'Ujian belum diterbitkan',
      count: ujianBelumTerbit,
      severity: ujianBelumTerbit > 0 ? 'info' : 'ok',
      hint: 'Ujian hanya tampil ke siswa setelah guru menerbitkannya.',
      href: '/admin/ujian',
    },
    {
      key: 'geofence',
      label: 'Titik & radius presensi GPS',
      count: geofenceLengkap ? 0 : 1,
      severity: geofenceLengkap ? 'ok' : 'error',
      hint: geofenceLengkap
        ? 'Sudah dikonfigurasi.'
        : 'Belum diisi — presensi siswa tercatat tanpa validasi lokasi.',
      href: '/admin/attendance-settings',
    },
    {
      key: 'token-cbt',
      label: 'Token CBT global',
      count: tokenCbt?.value ? 0 : 1,
      severity: tokenCbt?.value ? 'ok' : 'warn',
      hint: tokenCbt?.value
        ? 'Sudah diatur.'
        : 'Belum ada token — ujian tanpa token sendiri tidak bisa dibuka siswa.',
      href: '/admin/ujian',
    },
  ]
}

// ==========================================
// MANAJEMEN PENGGUNA
// ==========================================

export async function getUsers() {
  const session = await optionalSession('ADMIN')
  if (!session) return []

  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      nomorInduk: true,
      isActive: true,
      lastLoginAt: true,
      studentClasses: { select: { classInfo: { select: { id: true, name: true } } } },
    },
  })
}

export async function createUser(data: {
  username: string
  password?: string
  name: string
  role: string
  nomorInduk?: string
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')

    const username = data.username?.trim()
    const name = data.name?.trim()
    if (!username || !name) return { error: 'Username dan nama harus diisi.' }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) return { error: 'Username sudah terdaftar!' }

    const plain = data.password?.trim() || PASSWORD_DEFAULT

    await prisma.user.create({
      data: {
        username,
        password: await hashPassword(plain),
        name,
        role: data.role as Role,
        nomorInduk: data.nomorInduk?.trim() || null,
        // Paksa ganti kata sandi bila masih memakai bawaan.
        mustChangePassword: plain === PASSWORD_DEFAULT,
      },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function updateUser(data: {
  id: string
  name?: string
  role?: string
  nomorInduk?: string
  isActive?: boolean
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('ADMIN')

    // Jangan sampai admin menonaktifkan atau menurunkan akunnya sendiri lalu
    // terkunci di luar sistem.
    if (data.id === session.uid) {
      if (data.isActive === false) {
        return { error: 'Tidak bisa menonaktifkan akun sendiri.' }
      }
      if (data.role && data.role !== 'ADMIN') {
        return { error: 'Tidak bisa menurunkan role akun sendiri.' }
      }
    }

    await prisma.user.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.role !== undefined ? { role: data.role as Role } : {}),
        ...(data.nomorInduk !== undefined
          ? { nomorInduk: data.nomorInduk.trim() || null }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

/** Setel ulang kata sandi pengguna ke bawaan atau nilai tertentu. */
export async function resetUserPassword(id: string, newPassword?: string): Promise<AksiHasil<{ password: string }>> {
  try {
    await requireSession('ADMIN')
    const plain = newPassword?.trim() || PASSWORD_DEFAULT
    if (plain.length < 6) return { error: 'Password minimal 6 karakter.' }

    await prisma.user.update({
      where: { id },
      data: {
        password: await hashPassword(plain),
        mustChangePassword: true,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true, password: plain }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteUser(id: string): Promise<AksiHasil> {
  try {
    const session = await requireSession('ADMIN')
    if (id === session.uid) {
      return { error: 'Tidak bisa menghapus akun sendiri.' }
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    })
    if (!target) return { error: 'Pengguna tidak ditemukan.' }

    // Jangan biarkan admin terakhir terhapus.
    if (target.role === 'ADMIN') {
      const jumlahAdmin = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (jumlahAdmin <= 1) {
        return { error: 'Minimal harus ada satu akun admin.' }
      }
    }

    await prisma.user.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function bulkCreateUsers(
  users: { username: string; password?: string; name: string; role?: string }[]
): Promise<AksiHasil<{ count: number; skipped: number }>> {
  try {
    await requireSession('ADMIN')

    if (!users || users.length === 0) {
      return { error: 'Data kosong atau format tidak sesuai!' }
    }

    const existingUsers = await prisma.user.findMany({
      select: { username: true },
    })
    const existingSet = new Set(existingUsers.map((u) => u.username.toLowerCase()))

    const validRoles = ['STUDENT', 'TEACHER', 'ADMIN', 'DUDI']
    const toInsert: {
      username: string
      password: string
      name: string
      role: Role
      mustChangePassword: boolean
    }[] = []
    let skippedCount = 0
    const seenInBatch = new Set<string>()

    for (const u of users) {
      const username = String(u.username || '').trim()
      const name = String(u.name || '').trim()
      if (!username || !name) {
        skippedCount++
        continue
      }
      const lowerUser = username.toLowerCase()
      if (existingSet.has(lowerUser) || seenInBatch.has(lowerUser)) {
        skippedCount++
        continue
      }
      seenInBatch.add(lowerUser)

      let role = String(u.role || 'STUDENT').toUpperCase().trim()
      if (!validRoles.includes(role)) {
        if (role.includes('GURU')) role = 'TEACHER'
        else if (role.includes('SISWA')) role = 'STUDENT'
        else if (role.includes('INDUSTRI') || role.includes('DUDI')) role = 'DUDI'
        else if (role.includes('ADMIN')) role = 'ADMIN'
        else role = 'STUDENT'
      }

      const plain = String(u.password || PASSWORD_DEFAULT).trim()
      toInsert.push({
        username,
        name,
        // Impor massal pun harus di-hash; sebelumnya kata sandi masuk apa
        // adanya ke basis data.
        password: await hashPassword(plain),
        role: role as Role,
        mustChangePassword: plain === PASSWORD_DEFAULT,
      })
    }

    if (toInsert.length === 0) {
      return {
        error:
          'Tidak ada data baru yang dapat diimpor (semua username sudah terdaftar atau format kosong).',
      }
    }

    await prisma.user.createMany({ data: toInsert, skipDuplicates: true })

    revalidatePath('/', 'layout')
    return { success: true, count: toInsert.length, skipped: skippedCount }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// ROMBEL
// ==========================================

export async function getClasses() {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.class.findMany({
    include: {
      teachers: { include: { user: true, subject: true } },
      students: true,
      wali: { select: { id: true, name: true } },
      _count: { select: { students: true, schedules: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getTeachers() {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.user.findMany({
    where: { role: 'TEACHER' },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export async function createClass(data: {
  name: string
  description?: string
  level?: number
  waliKelasId?: string
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    const name = data.name?.trim()
    if (!name) return { error: 'Nama kelas harus diisi.' }

    const existing = await prisma.class.findFirst({ where: { name } })
    if (existing) return { error: 'Nama kelas sudah ada!' }

    await prisma.class.create({
      data: {
        name,
        description: data.description?.trim() || '',
        level: typeof data.level === 'number' ? data.level : null,
        waliId: data.waliKelasId || null,
      },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function updateClass(data: {
  id: string
  name?: string
  description?: string
  level?: number | null
  waliKelasId?: string | null
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.class.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined
          ? { description: data.description.trim() }
          : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.waliKelasId !== undefined
          ? { waliId: data.waliKelasId || null }
          : {}),
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteClass(id: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    // Relasi sudah onDelete: Cascade, tapi hapus eksplisit agar tetap aman
    // bila kolom di basis data lama belum punya constraint tersebut.
    await prisma.classTeacher.deleteMany({ where: { classId: id } })
    await prisma.classStudent.deleteMany({ where: { classId: id } })
    await prisma.class.delete({ where: { id } })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// MAPEL
// ==========================================

export async function getSubjects() {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.subject.findMany({
    include: {
      teachers: {
        include: {
          user: { select: { id: true, name: true } },
          classInfo: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createSubject(data: {
  name: string
  code?: string
  description?: string
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    const name = data.name?.trim()
    if (!name) return { error: 'Nama mata pelajaran harus diisi.' }

    const existing = await prisma.subject.findFirst({ where: { name } })
    if (existing) return { error: 'Nama mata pelajaran sudah ada!' }

    await prisma.subject.create({
      data: {
        name,
        code: data.code?.trim() || null,
        description: data.description?.trim() || '',
      },
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteSubject(id: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.subject.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// PENEMPATAN SISWA & GURU
// ==========================================

export async function addStudentToClass(userId: string, classId: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    const existing = await prisma.classStudent.findUnique({
      where: { userId_classId: { userId, classId } },
    })
    if (existing) return { error: 'Siswa sudah terdaftar di kelas ini.' }

    await prisma.classStudent.create({ data: { userId, classId } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

/** Tempatkan banyak siswa ke satu rombel sekaligus. */
export async function addStudentsToClass(userIds: string[], classId: string): Promise<AksiHasil<{ count: number }>> {
  try {
    await requireSession('ADMIN')
    if (!userIds?.length) return { error: 'Belum ada siswa yang dipilih.' }

    const siswa = await prisma.user.findMany({
      where: { id: { in: userIds }, role: 'STUDENT' },
      select: { id: true },
    })

    const res = await prisma.classStudent.createMany({
      data: siswa.map((s) => ({ userId: s.id, classId })),
      skipDuplicates: true,
    })

    revalidatePath('/', 'layout')
    return { success: true, count: res.count }
  } catch (err) {
    return gagal(err)
  }
}

export async function removeStudentFromClass(userId: string, classId: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.classStudent.delete({
      where: { userId_classId: { userId, classId } },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function getStudentsWithoutClass() {
  const session = await optionalSession('ADMIN')
  if (!session) return []

  return await prisma.user.findMany({
    where: { role: 'STUDENT', studentClasses: { none: {} } },
    select: { id: true, name: true, username: true, nomorInduk: true },
    orderBy: { name: 'asc' },
  })
}

export async function getAllStudents() {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      username: true,
      studentClasses: { select: { classInfo: { select: { id: true, name: true } } } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getClassStudents(classId: string) {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  const data = await prisma.classStudent.findMany({
    where: { classId },
    include: { user: { select: { id: true, name: true, username: true } } },
    orderBy: { user: { name: 'asc' } },
  })
  return data.map((d) => d.user)
}

export async function assignTeacherToClass(
  userId: string,
  classId: string,
  subjectId: string
): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    const existing = await prisma.classTeacher.findUnique({
      where: { userId_classId_subjectId: { userId, classId, subjectId } },
    })
    if (existing) return { error: 'Guru sudah ditugaskan di kelas dan mapel ini.' }

    await prisma.classTeacher.create({ data: { userId, classId, subjectId } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function removeTeacherFromClass(
  userId: string,
  classId: string,
  subjectId: string
): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.classTeacher.delete({
      where: { userId_classId_subjectId: { userId, classId, subjectId } },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// JADWAL
// ==========================================

export async function getSchedules() {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.schedule.findMany({
    include: {
      classInfo: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      jamPelajaran: { select: { id: true, name: true } },
    },
    orderBy: [{ day: 'asc' }, { sessionStart: 'asc' }],
  })
}

export async function createScheduleAdmin(data: {
  day: string
  sessionStart: string
  sessionEnd: string
  classId: string
  subjectId?: string
  teacherId?: string
  sessionId?: string
  room?: string
  type: string
  label?: string
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')

    if (data.sessionEnd <= data.sessionStart) {
      return { error: 'Jam selesai harus setelah jam mulai.' }
    }

    // Deteksi tabrakan jadwal — sebelumnya jadwal bisa ditumpuk bebas.
    const bentrokKelas = await prisma.schedule.findFirst({
      where: {
        day: data.day,
        classId: data.classId,
        sessionStart: { lt: data.sessionEnd },
        sessionEnd: { gt: data.sessionStart },
      },
      include: { subject: { select: { name: true } } },
    })
    if (bentrokKelas) {
      return {
        error: `Kelas ini sudah terisi jam ${bentrokKelas.sessionStart}-${bentrokKelas.sessionEnd} (${bentrokKelas.subject?.name || bentrokKelas.label || 'lain'}).`,
      }
    }

    if (data.teacherId) {
      const bentrokGuru = await prisma.schedule.findFirst({
        where: {
          day: data.day,
          teacherId: data.teacherId,
          sessionStart: { lt: data.sessionEnd },
          sessionEnd: { gt: data.sessionStart },
        },
        include: { classInfo: { select: { name: true } } },
      })
      if (bentrokGuru) {
        return {
          error: `Guru ini sudah mengajar di kelas ${bentrokGuru.classInfo.name} pada jam tersebut.`,
        }
      }
    }

    if (data.room?.trim()) {
      const bentrokRuang = await prisma.schedule.findFirst({
        where: {
          day: data.day,
          room: data.room.trim(),
          sessionStart: { lt: data.sessionEnd },
          sessionEnd: { gt: data.sessionStart },
        },
        include: { classInfo: { select: { name: true } } },
      })
      if (bentrokRuang) {
        return {
          error: `Ruang ${data.room.trim()} sedang dipakai kelas ${bentrokRuang.classInfo.name} pada jam tersebut.`,
        }
      }
    }

    await prisma.schedule.create({
      data: {
        day: data.day,
        sessionStart: data.sessionStart,
        sessionEnd: data.sessionEnd,
        classId: data.classId,
        subjectId: data.subjectId || null,
        teacherId: data.teacherId || null,
        sessionId: data.sessionId || null,
        room: data.room?.trim() || null,
        type: data.type,
        label: data.label?.trim() || null,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteScheduleAdmin(id: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.schedule.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// JAM PELAJARAN (SESI)
// ==========================================

export async function getSessions() {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.session.findMany({
    orderBy: [{ day: 'asc' }, { order: 'asc' }, { startTime: 'asc' }],
  })
}

export async function createSession(data: {
  day: string
  name: string
  startTime: string
  endTime: string
  type: string
  order?: number
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    if (data.endTime <= data.startTime) {
      return { error: 'Jam selesai harus setelah jam mulai.' }
    }

    await prisma.session.create({
      data: {
        day: data.day,
        name: data.name.trim(),
        startTime: data.startTime,
        endTime: data.endTime,
        type: data.type,
        order: data.order ?? 0,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteSession(id: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.session.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

/** Salin seluruh jam pelajaran satu hari ke hari lain. */
export async function copySessionsToDay(from: string, to: string): Promise<AksiHasil<{ count: number }>> {
  try {
    await requireSession('ADMIN')
    if (from === to) return { error: 'Hari sumber dan tujuan sama.' }

    const sumber = await prisma.session.findMany({ where: { day: from } })
    if (sumber.length === 0) {
      return { error: `Tidak ada jam pelajaran di hari ${from}.` }
    }

    // Ganti isi hari tujuan agar penyalinan berulang tidak menumpuk data.
    await prisma.session.deleteMany({ where: { day: to } })
    await prisma.session.createMany({
      data: sumber.map((s) => ({
        day: to,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        type: s.type,
        order: s.order,
      })),
    })

    revalidatePath('/', 'layout')
    return { success: true, count: sumber.length }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// PENGUMUMAN
// ==========================================

export async function getBroadcasts() {
  const session = await optionalSession('ADMIN')
  if (!session) return []

  return await prisma.broadcast.findMany({
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { reads: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function createBroadcast(data: {
  title: string
  message: string
  target: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('ADMIN')
    if (!data.title?.trim() || !data.message?.trim()) {
      return { error: 'Judul dan isi pengumuman harus diisi.' }
    }

    await prisma.broadcast.create({
      data: {
        title: data.title.trim(),
        message: data.message.trim(),
        target: data.target,
        authorId: session.uid,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteBroadcast(id: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.broadcast.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// PENGATURAN APLIKASI
// ==========================================

export async function getAppSetting(key: string) {
  const session = await optionalSession('ADMIN')
  if (!session) return null

  const setting = await prisma.appSetting.findUnique({ where: { key } })
  return setting ? setting.value : null
}

export async function getAppSettings(keys: string[]) {
  const session = await optionalSession('ADMIN')
  if (!session) return {}

  const rows = await prisma.appSetting.findMany({ where: { key: { in: keys } } })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function setAppSetting(key: string, value: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function setAppSettings(entries: Record<string, string>): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    const pairs = Object.entries(entries)
    if (pairs.length === 0) return { success: true }

    await prisma.$transaction(
      pairs.map(([key, value]) =>
        prisma.appSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    )
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// PERPUSTAKAAN
// ==========================================

export async function getLibraryBooksAdmin() {
  const session = await optionalSession('ADMIN')
  if (!session) return []

  return await prisma.libraryBook.findMany({
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * CRUD buku perpustakaan. Halaman siswa sudah bisa membaca `LibraryBook`
 * sejak awal, tapi tidak ada satu pun jalan untuk mengisinya — jadi menu
 * perpustakaan selalu kosong.
 */
export async function createLibraryBook(data: {
  title: string
  author: string
  category: string
  description?: string
  fileUrl?: string
  pages?: string
  publisher?: string
  year?: number
  isbn?: string
  coverColor?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('ADMIN')
    if (!data.title?.trim()) return { error: 'Judul buku harus diisi.' }
    if (!data.author?.trim()) return { error: 'Penulis harus diisi.' }
    if (!data.category?.trim()) return { error: 'Kategori harus diisi.' }

    await prisma.libraryBook.create({
      data: {
        title: data.title.trim(),
        author: data.author.trim(),
        category: data.category.trim(),
        description: data.description?.trim() || null,
        fileUrl: data.fileUrl?.trim() || null,
        pages: data.pages?.trim() || null,
        publisher: data.publisher?.trim() || null,
        year: typeof data.year === 'number' ? data.year : null,
        isbn: data.isbn?.trim() || null,
        coverColor: data.coverColor?.trim() || null,
        createdById: session.uid,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function updateLibraryBook(data: {
  id: string
  title?: string
  author?: string
  category?: string
  description?: string
  fileUrl?: string
  pages?: string
  publisher?: string
  year?: number | null
  isbn?: string
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.libraryBook.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.author !== undefined ? { author: data.author.trim() } : {}),
        ...(data.category !== undefined ? { category: data.category.trim() } : {}),
        ...(data.description !== undefined
          ? { description: data.description.trim() || null }
          : {}),
        ...(data.fileUrl !== undefined
          ? { fileUrl: data.fileUrl.trim() || null }
          : {}),
        ...(data.pages !== undefined ? { pages: data.pages.trim() || null } : {}),
        ...(data.publisher !== undefined
          ? { publisher: data.publisher.trim() || null }
          : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
        ...(data.isbn !== undefined ? { isbn: data.isbn.trim() || null } : {}),
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deleteLibraryBook(id: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.libraryBook.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// BACKUP
// ==========================================

export async function downloadBackupData(): Promise<AksiHasil<{ data: unknown }>> {
  try {
    await requireSession('ADMIN')

    const [
      users,
      classes,
      subjects,
      classStudents,
      classTeachers,
      sessions,
      schedules,
      materials,
      assignments,
      userAssignments,
      journals,
      attendances,
      violations,
      exams,
      examQuestions,
      examSubmissions,
      libraryBooks,
      broadcasts,
      settings,
      partners,
      pklPlacements,
      pklJournals,
    ] = await Promise.all([
      // Kata sandi (walau sudah hash) tidak perlu ikut keluar dari server.
      prisma.user.findMany({
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          nomorInduk: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.class.findMany(),
      prisma.subject.findMany(),
      prisma.classStudent.findMany(),
      prisma.classTeacher.findMany(),
      prisma.session.findMany(),
      prisma.schedule.findMany(),
      prisma.material.findMany(),
      prisma.assignment.findMany(),
      prisma.userAssignment.findMany(),
      prisma.journal.findMany(),
      prisma.attendance.findMany(),
      prisma.violation.findMany(),
      prisma.exam.findMany(),
      prisma.examQuestion.findMany(),
      prisma.examSubmission.findMany(),
      prisma.libraryBook.findMany(),
      prisma.broadcast.findMany(),
      prisma.appSetting.findMany(),
      prisma.partner.findMany(),
      prisma.pklPlacement.findMany(),
      prisma.pklJournal.findMany(),
    ])

    return {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        schemaVersion: 2,
        users,
        classes,
        subjects,
        classStudents,
        classTeachers,
        sessions,
        schedules,
        materials,
        assignments,
        userAssignments,
        journals,
        attendances,
        violations,
        exams,
        examQuestions,
        examSubmissions,
        libraryBooks,
        broadcasts,
        settings,
        partners,
        pklPlacements,
        pklJournals,
      },
    }
  } catch (err) {
    return gagal(err)
  }
}
