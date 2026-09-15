'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function submitAttendance(lat: number, lng: number) {
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
      userId: userId,
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
      userId: userId,
      classId: studentClass.classId,
      status: "PRESENT",
      lat,
      lng,
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
      userId: userId,
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

  // Fetch from Schedule table
  const schedules = await prisma.schedule.findMany({
    where: { classId: studentClass.classId },
    orderBy: [{ day: 'asc' }, { sessionStart: 'asc' }]
  })

  if (schedules.length > 0) {
    return schedules
  }

  // Fallback: fetch from ClassTeacher
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

export async function submitCheckOut(lat: number, lng: number) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return { error: "Belum login" }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const existing = await prisma.attendance.findFirst({
    where: {
      userId: userId,
      date: {
        gte: today
      }
    }
  })

  if (!existing) {
    return { error: "Anda belum melakukan presensi masuk hari ini." }
  }

  if (existing.checkOutTime) {
    return { error: "Anda sudah melakukan presensi pulang hari ini." }
  }

  await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOutTime: new Date()
    }
  })

  revalidatePath('/student')
  
  return { success: true }
}

export async function getStudentMaterials() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return []

  const studentClass = await prisma.classStudent.findFirst({ where: { userId } })
  if (!studentClass) return []

  return await prisma.material.findMany({
    where: { classId: studentClass.classId },
    include: {
      author: { select: { name: true } },
      subject: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getStudentAssignments() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return []

  const studentClass = await prisma.classStudent.findFirst({ where: { userId } })
  if (!studentClass) return []

  const assignments = await prisma.assignment.findMany({
    where: { classId: studentClass.classId },
    include: {
      subject: { select: { name: true } },
      author: { select: { name: true } },
      submissions: {
        where: { userId },
        select: { score: true, status: true, submittedAt: true, description: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return assignments.map(a => ({
    ...a,
    mySubmission: a.submissions[0] || null
  }))
}

export async function getStudentViolations() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return []

  return await prisma.violation.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getAttendanceHistory() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return []

  return await prisma.attendance.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 30
  })
}
