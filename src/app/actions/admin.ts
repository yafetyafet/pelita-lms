'use server'

import { prisma } from '@/lib/prisma'

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
