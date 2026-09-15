'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getTeacherUserId() {
  const cookieStore = await cookies()
  return cookieStore.get('userId')?.value || null
}

// ==========================================
// TEACHER CLASSES
// ==========================================
export async function getTeacherClasses() {
  const userId = await getTeacherUserId()
  if (!userId) return []

  const teacherClasses = await prisma.classTeacher.findMany({
    where: { userId },
    include: {
      classInfo: {
        include: {
          students: {
            include: { user: { select: { id: true, name: true, username: true } } }
          },
          wali: { select: { id: true, name: true } }
        }
      },
      subject: true
    }
  })

  return teacherClasses
}

export async function getStudentsByClass(classId: string) {
  const students = await prisma.classStudent.findMany({
    where: { classId },
    include: {
      user: { select: { id: true, name: true, username: true } }
    }
  })
  return students.map(s => s.user)
}

export async function getClassAttendanceToday(classId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const attendances = await prisma.attendance.findMany({
    where: {
      classId,
      date: { gte: today }
    },
    include: {
      user: { select: { id: true, name: true, username: true } }
    }
  })

  return attendances
}

// ==========================================
// TEACHER JOURNALS
// ==========================================
export async function getTeacherJournals() {
  const userId = await getTeacherUserId()
  if (!userId) return []

  return await prisma.journal.findMany({
    where: { authorId: userId },
    include: {
      classInfo: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createJournal(data: { title: string; content: string; classId: string; subjectId: string }) {
  const userId = await getTeacherUserId()
  if (!userId) return { error: 'Belum login' }

  try {
    await prisma.journal.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: userId,
        classId: data.classId,
        subjectId: data.subjectId
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// TEACHER MATERIALS
// ==========================================
export async function getTeacherMaterials() {
  const userId = await getTeacherUserId()
  if (!userId) return []

  return await prisma.material.findMany({
    where: { authorId: userId },
    include: {
      classInfo: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createMaterial(data: { title: string; description?: string; url?: string; classId: string; subjectId: string }) {
  const userId = await getTeacherUserId()
  if (!userId) return { error: 'Belum login' }

  try {
    await prisma.material.create({
      data: {
        title: data.title,
        description: data.description || '',
        url: data.url || '',
        authorId: userId,
        classId: data.classId,
        subjectId: data.subjectId
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// TEACHER GRADES
// ==========================================
export async function getGradesByClass(classId: string, subjectId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { classId, subjectId },
    include: {
      submissions: {
        include: {
          user: { select: { id: true, name: true, username: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  const students = await prisma.classStudent.findMany({
    where: { classId },
    include: {
      user: { select: { id: true, name: true, username: true } }
    }
  })

  return { assignments, students: students.map(s => s.user) }
}

export async function createAssignment(data: { title: string; description?: string; classId: string; subjectId: string; dueDate?: string }) {
  const userId = await getTeacherUserId()
  if (!userId) return { error: 'Belum login' }

  try {
    await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description || '',
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        authorId: userId,
        classId: data.classId,
        subjectId: data.subjectId
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function saveGrade(data: { userId: string; assignmentId: string; score: number; description?: string }) {
  try {
    await prisma.userAssignment.upsert({
      where: {
        userId_assignmentId: {
          userId: data.userId,
          assignmentId: data.assignmentId
        }
      },
      update: {
        score: data.score,
        description: data.description || null,
        status: 'GRADED'
      },
      create: {
        userId: data.userId,
        assignmentId: data.assignmentId,
        score: data.score,
        description: data.description || null,
        status: 'GRADED'
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// VIOLATIONS
// ==========================================
export async function createViolation(data: { studentId: string; description: string; points: number }) {
  const userId = await getTeacherUserId()
  if (!userId) return { error: 'Belum login' }

  try {
    await prisma.violation.create({
      data: {
        studentId: data.studentId,
        reporterId: userId,
        description: data.description,
        points: data.points
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// EXAMS
// ==========================================
export async function getTeacherExams() {
  const userId = await getTeacherUserId()
  if (!userId) return []

  return await prisma.exam.findMany({
    where: { authorId: userId },
    include: {
      questions: true,
      submissions: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createExam(data: {
  title: string;
  type: string;
  classId: string;
  subjectId: string;
  duration: number;
  questions: { question: string; imageUrl?: string; type: string; options?: string; correctAnswer?: string; points: number }[]
}) {
  const userId = await getTeacherUserId()
  if (!userId) return { error: 'Belum login' }

  try {
    await prisma.exam.create({
      data: {
        title: data.title,
        type: data.type,
        classId: data.classId,
        subjectId: data.subjectId,
        authorId: userId,
        duration: data.duration,
        questions: {
          create: data.questions.map(q => ({
            question: q.question,
            imageUrl: q.imageUrl || null,
            type: q.type,
            options: q.options || null,
            correctAnswer: q.correctAnswer || null,
            points: q.points
          }))
        }
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteExam(examId: string) {
  try {
    await prisma.exam.delete({ where: { id: examId } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// SCHEDULE
// ==========================================
export async function getTeacherSchedules() {
  const userId = await getTeacherUserId()
  if (!userId) return []

  return await prisma.schedule.findMany({
    where: { teacherId: userId },
    orderBy: [{ day: 'asc' }, { sessionStart: 'asc' }]
  })
}

export async function createSchedule(data: {
  day: string;
  sessionStart: string;
  sessionEnd: string;
  classId: string;
  subjectId?: string;
  room?: string;
  type?: string;
  label?: string;
}) {
  const userId = await getTeacherUserId()
  if (!userId) return { error: 'Belum login' }

  try {
    await prisma.schedule.create({
      data: {
        day: data.day,
        sessionStart: data.sessionStart,
        sessionEnd: data.sessionEnd,
        classId: data.classId,
        subjectId: data.subjectId || null,
        teacherId: userId,
        room: data.room || null,
        type: data.type || 'REGULAR',
        label: data.label || null
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    await prisma.schedule.delete({ where: { id: scheduleId } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

// ==========================================
// FORUM DISCUSSIONS
// ==========================================
export async function getForumDiscussions() {
  return await prisma.forumDiscussion.findMany({
    include: {
      author: { select: { name: true, role: true } },
      classInfo: { select: { name: true } },
      subject: { select: { name: true } },
      replies: {
        include: {
          author: { select: { name: true, role: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createForumDiscussion(data: { title: string, content: string, classId?: string, subjectId?: string }) {
  const userId = await getTeacherUserId()
  if (!userId) return { error: 'Belum login' }

  try {
    await prisma.forumDiscussion.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: userId,
        classId: data.classId || null,
        subjectId: data.subjectId || null
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function addForumReply(discussionId: string, content: string) {
  const userId = await getTeacherUserId()
  if (!userId) return { error: 'Belum login' }

  try {
    await prisma.forumReply.create({
      data: {
        discussionId,
        authorId: userId,
        content
      }
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
