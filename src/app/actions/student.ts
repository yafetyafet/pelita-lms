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

  // Fetch settings
  const [schoolLat, schoolLng, radiusStr, timeLimitStr] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "SCHOOL_LATITUDE" } }),
    prisma.appSetting.findUnique({ where: { key: "SCHOOL_LONGITUDE" } }),
    prisma.appSetting.findUnique({ where: { key: "ATTENDANCE_RADIUS" } }),
    prisma.appSetting.findUnique({ where: { key: "ATTENDANCE_TIME_LIMIT" } })
  ])

  // Verify Geofence
  if (schoolLat?.value && schoolLng?.value && radiusStr?.value) {
    const sLat = parseFloat(schoolLat.value)
    const sLng = parseFloat(schoolLng.value)
    const maxRadius = parseInt(radiusStr.value, 10)
    
    if (!isNaN(sLat) && !isNaN(sLng) && !isNaN(maxRadius)) {
      const R = 6371e3
      const phi1 = lat * Math.PI/180
      const phi2 = sLat * Math.PI/180
      const dPhi = (sLat-lat) * Math.PI/180
      const dLam = (sLng-lng) * Math.PI/180

      const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(dLam/2) * Math.sin(dLam/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c

      if (distance > maxRadius) {
        return { error: `Gagal presensi. Anda berada di luar zona sekolah (Jarak Anda: ${Math.round(distance)} meter, Maksimal: ${maxRadius} meter).` }
      }
    }
  }

  // Verify Time
  let finalStatus = "PRESENT"
  if (timeLimitStr?.value) {
    const now = new Date()
    const currentMins = now.getHours() * 60 + now.getMinutes()
    const [limitHour, limitMin] = timeLimitStr.value.split(':').map(Number)
    const limitMins = limitHour * 60 + limitMin
    
    if (currentMins > limitMins) {
      finalStatus = "LATE"
    }
  }

  // Create attendance record
  await prisma.attendance.create({
    data: {
      userId: userId,
      classId: studentClass.classId,
      status: finalStatus as any,
      lat,
      lng,
    }
  })

  revalidatePath('/', 'layout')
  
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

  revalidatePath('/', 'layout')
  
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

// ==========================================
// CBT EXAMS
// ==========================================
export async function validateCbtToken(token: string) {
  const setting = await prisma.appSetting.findUnique({ where: { key: "CBT_TOKEN" } })
  return setting?.value === token
}

export async function getStudentExams() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return []

  const studentClass = await prisma.classStudent.findFirst({ where: { userId } })
  if (!studentClass) return []

  return await prisma.exam.findMany({
    where: { classId: studentClass.classId },
    include: {
      subject: { select: { name: true } },
      classInfo: { select: { name: true } },
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
          type: true,
          correctAnswer: true
        }
      }
    }
  })
}

export async function submitExam(examId: string, answers: string, score: number) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return { error: "Not logged in" }

  try {
    await prisma.examSubmission.create({
      data: {
        examId,
        userId,
        answers,
        score
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// SPIRITUAL JOURNAL
// ==========================================
export async function getSpiritualJournals() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return []

  return await prisma.spiritualJournal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createSpiritualJournal(data: { activity: string, notes: string }) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return { error: "Not logged in" }

  try {
    await prisma.spiritualJournal.create({
      data: {
        userId,
        activity: data.activity,
        notes: data.notes
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// LIBRARY
// ==========================================
export async function getLibraryBooks() {
  return await prisma.libraryBook.findMany({
    orderBy: { createdAt: 'desc' }
  })
}
