'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getDashboardStats() {
  const [totalStudents, totalTeachers, totalAdmins, totalClasses, totalSubjects] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TEACHER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.class.count(),
    prisma.subject.count()
  ])

  return {
    students: totalStudents,
    teachers: totalTeachers,
    admins: totalAdmins,
    classes: totalClasses,
    subjects: totalSubjects,
    database: "Online (Supabase PostgreSQL)"
  }
}

// ==========================================
// USER MANAGEMENT
// ==========================================
export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, username: true, role: true }
  })
}

export async function createUser(data: { username: string, password?: string, name: string, role: string }) {
  try {
    const existing = await prisma.user.findUnique({ where: { username: data.username } })
    if (existing) return { error: "Username sudah terdaftar!" }

    await prisma.user.create({
      data: {
        username: data.username,
        password: data.password || '123456',
        name: data.name,
        role: data.role as any
      }
    })
    
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function bulkCreateUsers(users: { username: string, password?: string, name: string, role?: string }[]) {
  try {
    if (!users || users.length === 0) {
      return { error: "Data kosong atau format tidak sesuai!" }
    }

    const existingUsers = await prisma.user.findMany({
      select: { username: true }
    })
    const existingSet = new Set(existingUsers.map(u => u.username.toLowerCase()))

    const validRoles = ['STUDENT', 'TEACHER', 'ADMIN', 'DUDI']
    const toInsert: { username: string, password: string, name: string, role: any }[] = []
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

      toInsert.push({
        username,
        name,
        password: String(u.password || '123456').trim(),
        role: role as any
      })
    }

    if (toInsert.length === 0) {
      return { 
        error: "Tidak ada data baru yang dapat diimpor (semua username sudah terdaftar atau format kosong)." 
      }
    }

    await prisma.user.createMany({
      data: toInsert,
      skipDuplicates: true
    })

    revalidatePath('/', 'layout')
    revalidatePath('/', 'layout')

    return { 
      success: true, 
      count: toInsert.length, 
      skipped: skippedCount 
    }
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan saat impor massal." }
  }
}

// ==========================================
// CLASS (ROMBEL) MANAGEMENT
// ==========================================
export async function getClasses() {
  return await prisma.class.findMany({
    include: {
      teachers: {
        include: { user: true }
      },
      students: true
    },
    orderBy: { name: 'asc' }
  })
}

export async function getTeachers() {
  return await prisma.user.findMany({
    where: { role: 'TEACHER' },
    select: { id: true, name: true }
  })
}

export async function createClass(data: { name: string, description?: string, waliKelasId?: string }) {
  try {
    const existing = await prisma.class.findFirst({ where: { name: data.name } })
    if (existing) return { error: "Nama kelas sudah ada!" }

    await prisma.class.create({
      data: {
        name: data.name,
        description: data.description || "",
        waliId: data.waliKelasId || null
      }
    })
    
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}export async function deleteClass(id: string) {
  try {
    await prisma.classTeacher.deleteMany({ where: { classId: id } })
    await prisma.classStudent.deleteMany({ where: { classId: id } })
    await prisma.class.delete({ where: { id } })
    
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// SUBJECT (MAPEL) MANAGEMENT
// ==========================================
export async function getSubjects() {
  return await prisma.subject.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createSubject(data: { name: string, description?: string }) {
  try {
    const existing = await prisma.subject.findFirst({ where: { name: data.name } })
    if (existing) return { error: "Nama mata pelajaran sudah ada!" }

    await prisma.subject.create({
      data: {
        name: data.name,
        description: data.description || ""
      }
    })
    
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// CLASS-STUDENT ASSIGNMENT
// ==========================================
export async function addStudentToClass(userId: string, classId: string) {
  try {
    const existing = await prisma.classStudent.findUnique({
      where: { userId_classId: { userId, classId } }
    })
    if (existing) return { error: 'Siswa sudah terdaftar di kelas ini.' }

    await prisma.classStudent.create({
      data: { userId, classId }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function removeStudentFromClass(userId: string, classId: string) {
  try {
    await prisma.classStudent.delete({
      where: { userId_classId: { userId, classId } }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function getStudentsWithoutClass() {
  const studentsWithClass = await prisma.classStudent.findMany({
    select: { userId: true }
  })
  const assignedIds = studentsWithClass.map(s => s.userId)

  return await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      id: { notIn: assignedIds.length > 0 ? assignedIds : ['__none__'] }
    },
    select: { id: true, name: true, username: true }
  })
}

export async function getAllStudents() {
  return await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, username: true },
    orderBy: { name: 'asc' }
  })
}

export async function getClassStudents(classId: string) {
  const data = await prisma.classStudent.findMany({
    where: { classId },
    include: {
      user: { select: { id: true, name: true, username: true } }
    }
  })
  return data.map(d => d.user)
}

// ==========================================
// CLASS-TEACHER ASSIGNMENT
// ==========================================
export async function assignTeacherToClass(userId: string, classId: string, subjectId: string) {
  try {
    const existing = await prisma.classTeacher.findUnique({
      where: { userId_classId_subjectId: { userId, classId, subjectId } }
    })
    if (existing) return { error: 'Guru sudah ditugaskan di kelas dan mapel ini.' }

    await prisma.classTeacher.create({
      data: { userId, classId, subjectId }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function removeTeacherFromClass(userId: string, classId: string, subjectId: string) {
  try {
    await prisma.classTeacher.delete({
      where: { userId_classId_subjectId: { userId, classId, subjectId } }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// SCHEDULE MANAGEMENT (ADMIN)
// ==========================================
export async function getSchedules() {
  return await prisma.schedule.findMany({
    orderBy: [{ day: 'asc' }, { sessionStart: 'asc' }]
  })
}

export async function createScheduleAdmin(data: {
  day: string;
  sessionStart: string;
  sessionEnd: string;
  classId: string;
  subjectId?: string;
  teacherId?: string;
  room?: string;
  type: string;
  label?: string;
}) {
  try {
    await prisma.schedule.create({
      data: {
        day: data.day,
        sessionStart: data.sessionStart,
        sessionEnd: data.sessionEnd,
        classId: data.classId,
        subjectId: data.subjectId || null,
        teacherId: data.teacherId || null,
        room: data.room || null,
        type: data.type,
        label: data.label || null
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteScheduleAdmin(id: string) {
  try {
    await prisma.schedule.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
