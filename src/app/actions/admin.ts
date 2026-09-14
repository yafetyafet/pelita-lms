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

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createUser(data: { username: string, password?: string, name: string, role: string }) {
  try {
    const existing = await prisma.user.findUnique({ where: { username: data.username } })
    if (existing) return { error: "Username sudah terdaftar!" }

    await prisma.user.create({
      data: {
        username: data.username,
        password: data.password || '123456', // default password
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
