'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hitungJarakGeofence, tentukanStatus, StatusPresensi } from '@/lib/logic/attendance'
import { acakPG, tanpaKunci, kelayakanUjian, koreksiOtomatis } from '@/lib/logic/exam'

export async function submitAttendance(lat: number, lng: number) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return { error: "Belum login" }

  const studentClass = await prisma.classStudent.findFirst({
    where: { userId }
  })

  if (!studentClass) return { error: "Siswa belum memiliki rombel/kelas." }

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

  const [schoolLat, schoolLng, radiusStr, timeLimitStr] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "SCHOOL_LATITUDE" } }),
    prisma.appSetting.findUnique({ where: { key: "SCHOOL_LONGITUDE" } }),
    prisma.appSetting.findUnique({ where: { key: "ATTENDANCE_RADIUS" } }),
    prisma.appSetting.findUnique({ where: { key: "ATTENDANCE_TIME_LIMIT" } })
  ])

  let validasi = null
  if (schoolLat?.value && schoolLng?.value && radiusStr?.value) {
    const sLat = parseFloat(schoolLat.value)
    const sLng = parseFloat(schoolLng.value)
    const maxRadius = parseInt(radiusStr.value, 10)
    
    if (!isNaN(sLat) && !isNaN(sLng) && !isNaN(maxRadius)) {
      validasi = hitungJarakGeofence(lat, lng, sLat, sLng, maxRadius)
    }
  }

  // Waktu
  const waktuPresensi = new Date()
  let limitMulai = "06:00"
  let limitSelesai = timeLimitStr?.value || "07:15"

  const keputusan = tentukanStatus({
    jenis: "datang",
    waktu: waktuPresensi,
    jendela: { mulai: limitMulai, selesai: limitSelesai },
    validasi: validasi as any
  })

  if (!keputusan.diterima) {
    return { error: keputusan.pesan }
  }

  await prisma.attendance.create({
    data: {
      userId: userId,
      classId: studentClass.classId,
      status: keputusan.status,
      lat,
      lng,
    }
  })

  revalidatePath('/', 'layout')
  
  return { success: true, pesan: keputusan.pesan }
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

  const [schoolLat, schoolLng, radiusStr, checkoutTimeStr] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "SCHOOL_LATITUDE" } }),
    prisma.appSetting.findUnique({ where: { key: "SCHOOL_LONGITUDE" } }),
    prisma.appSetting.findUnique({ where: { key: "ATTENDANCE_RADIUS" } }),
    prisma.appSetting.findUnique({ where: { key: "ATTENDANCE_CHECKOUT_TIME" } })
  ])

  let validasi = null
  if (schoolLat?.value && schoolLng?.value && radiusStr?.value) {
    const sLat = parseFloat(schoolLat.value)
    const sLng = parseFloat(schoolLng.value)
    const maxRadius = parseInt(radiusStr.value, 10)
    
    if (!isNaN(sLat) && !isNaN(sLng) && !isNaN(maxRadius)) {
      validasi = hitungJarakGeofence(lat, lng, sLat, sLng, maxRadius)
    }
  }

  const waktuPresensi = new Date()
  let limitMulai = checkoutTimeStr?.value || "14:30"
  let limitSelesai = "16:00"

  const keputusan = tentukanStatus({
    jenis: "pulang",
    waktu: waktuPresensi,
    jendela: { mulai: limitMulai, selesai: limitSelesai },
    validasi: validasi as any
  })

  if (!keputusan.diterima) {
    return { error: keputusan.pesan }
  }

  await prisma.attendance.update({
    where: { id: existing.id },
    data: {
      checkOutTime: new Date(),
      status: (existing.status === "tanpa_lokasi" || keputusan.status === "tanpa_lokasi" ? "tanpa_lokasi" : existing.status) // keep history
    }
  })

  revalidatePath('/', 'layout')
  
  return { success: true, pesan: keputusan.pesan }
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

  const exams = await prisma.exam.findMany({
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
          correctAnswer: true,
          points: true
        }
      },
      submissions: {
        where: { userId }
      }
    }
  })

  // Format and randomize deterministically for this student
  return exams.map(exam => {
    let rawQuestions = exam.questions.map(q => {
      let parsedOptions = null;
      try {
        if (q.options) parsedOptions = JSON.parse(q.options);
      } catch (e) {}
      
      return {
        ...q,
        type: q.type as "PG" | "ESAI",
        options: parsedOptions
      }
    })
    
    // Randomize using userId as seed
    const acak = acakPG(rawQuestions, userId)
    
    // Remove correct answers
    const aman = tanpaKunci(acak)

    return {
      ...exam,
      questions: aman,
      mySubmission: exam.submissions[0] || null
    }
  })
}

export async function submitExam(examId: string, answersJson: string) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return { error: "Not logged in" }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true }
  })

  if (!exam) return { error: "Ujian tidak ditemukan" }

  // Check if already submitted
  const existing = await prisma.examSubmission.findFirst({
    where: { examId, userId }
  })

  let jawabanMap = new Map<string, string>()
  try {
    const parsed = JSON.parse(answersJson)
    Object.keys(parsed).forEach(k => jawabanMap.set(k, parsed[k]))
  } catch(e) {}

  // Auto-grade
  const { skorOtomatis, skorMaksOtomatis, bobotEsai } = koreksiOtomatis(
    exam.questions.map(q => ({
      id: q.id,
      type: q.type as "PG" | "ESAI",
      question: q.question,
      options: null,
      correctAnswer: q.correctAnswer,
      points: q.points
    })),
    jawabanMap
  )

  if (existing) {
    if (existing.status === "FINISHED") {
      return { error: "Sudah dikumpulkan" }
    }
    await prisma.examSubmission.update({
      where: { id: existing.id },
      data: {
        answers: answersJson,
        score: skorOtomatis,
        scoreMax: skorMaksOtomatis,
        submittedAt: new Date(),
        status: "FINISHED"
      }
    })
  } else {
    await prisma.examSubmission.create({
      data: {
        examId,
        userId,
        answers: answersJson,
        score: skorOtomatis,
        scoreMax: skorMaksOtomatis,
        submittedAt: new Date(),
        status: "FINISHED"
      }
    })
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function startExam(examId: string) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value
  if (!userId) return { error: "Not logged in" }

  const existing = await prisma.examSubmission.findFirst({
    where: { examId, userId }
  })

  if (!existing) {
    await prisma.examSubmission.create({
      data: {
        examId,
        userId,
        status: "ONGOING"
      }
    })
  }

  revalidatePath('/', 'layout')
  return { success: true }
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
