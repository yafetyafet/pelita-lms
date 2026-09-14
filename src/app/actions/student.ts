'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function submitAttendance(latitude: number, longitude: number) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return { error: "Belum login" }

  // Check if student has a class
  const studentClass = await prisma.classStudent.findFirst({
    where: { userId }
  })

  if (!studentClass) return { error: "Siswa belum memiliki rombel/kelas." }

  // Check if already attended today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const existing = await prisma.attendance.findFirst({
    where: {
      studentId: userId,
      classId: studentClass.classId,
      date: {
        gte: today
      }
    }
  })

  if (existing) {
    return { error: "Anda sudah melakukan presensi hari ini." }
  }

  // Create attendance record
  await prisma.attendance.create({
    data: {
      studentId: userId,
      classId: studentClass.classId,
      status: "PRESENT",
      latitude,
      longitude,
    }
  })

  revalidatePath('/student')
  
  return { success: true }
}

export async function getTodayAttendance() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return await prisma.attendance.findFirst({
    where: {
      studentId: userId,
      date: {
        gte: today
      }
    }
  })
}

export async function getStudentSchedule() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return []

  const studentClass = await prisma.classStudent.findFirst({
    where: { userId }
  })

  if (!studentClass) return []

  // Fetch subjects taught in this class
  const teachers = await prisma.classTeacher.findMany({
    where: { classId: studentClass.classId },
    include: {
      subject: true,
      user: true
    }
  })

  return teachers.map(t => ({
    mapel: t.subject.name,
    guru: t.user.name,
  }))
}
