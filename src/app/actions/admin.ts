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
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
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

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        description: data.description || ""
      }
    })

    if (data.waliKelasId) {
      await prisma.classTeacher.create({
        data: {
          classId: newClass.id,
          userId: data.waliKelasId
        }
      })
    }
    
    revalidatePath('/admin/classes')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteClass(id: string) {
  try {
    await prisma.classTeacher.deleteMany({ where: { classId: id } })
    await prisma.classStudent.deleteMany({ where: { classId: id } })
    await prisma.class.delete({ where: { id } })
    
    revalidatePath('/admin/classes')
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
    
    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({ where: { id } })
    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
