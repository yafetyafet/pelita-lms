'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import type { AksiHasil } from '@/lib/types/aksi'
import { optionalSession, requireSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/logic/rbac'
import {
  hitungJarakGeofence,
  jarakMeter,
  tentukanStatus,
} from '@/lib/logic/attendance'
import {
  acakPG,
  kelayakanUjian,
  keNilaiAkhir,
  koreksiOtomatis,
  tanpaKunci,
} from '@/lib/logic/exam'
import {
  dateKeyWIB,
  jamDindingWIB,
  slotKeyPresensi,
} from '@/lib/logic/waktu'

function gagal(err: unknown) {
  if (err instanceof ForbiddenError) return { error: err.message }
  return { error: err instanceof Error ? err.message : 'Terjadi kesalahan.' }
}

/** Kelas siswa yang sedang login; `null` bila belum ditempatkan di rombel. */
async function kelasSaya(userId: string): Promise<string | null> {
  const row = await prisma.classStudent.findFirst({
    where: { userId },
    select: { classId: true },
  })
  return row?.classId ?? null
}

type PengaturanGeofence = {
  lat: number | null
  lng: number | null
  radius: number | null
  batasMasuk: string
  jamPulang: string
}

async function pengaturanPresensi(): Promise<PengaturanGeofence> {
  const rows = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [
          'SCHOOL_LATITUDE',
          'SCHOOL_LONGITUDE',
          'ATTENDANCE_RADIUS',
          'ATTENDANCE_TIME_LIMIT',
          'ATTENDANCE_CHECKOUT_TIME',
        ],
      },
    },
  })
  const map = new Map(rows.map((r) => [r.key, r.value]))
  const num = (k: string) => {
    const v = Number(map.get(k))
    return Number.isFinite(v) ? v : null
  }
  return {
    lat: num('SCHOOL_LATITUDE'),
    lng: num('SCHOOL_LONGITUDE'),
    radius: num('ATTENDANCE_RADIUS'),
    batasMasuk: map.get('ATTENDANCE_TIME_LIMIT') || '07:15',
    jamPulang: map.get('ATTENDANCE_CHECKOUT_TIME') || '14:30',
  }
}

// ==========================================
// PRESENSI
// ==========================================

export async function submitAttendance(lat: number, lng: number): Promise<AksiHasil<{ pesan: string }>> {
  try {
    const session = await requireSession('STUDENT')

    const classId = await kelasSaya(session.uid)
    if (!classId) return { error: 'Siswa belum memiliki rombel/kelas.' }

    const dateKey = dateKeyWIB()
    const slotKey = slotKeyPresensi(dateKey, null)

    const existing = await prisma.attendance.findUnique({
      where: { userId_slotKey: { userId: session.uid, slotKey } },
    })
    if (existing) {
      return { error: 'Anda sudah melakukan presensi hari ini.' }
    }

    const cfg = await pengaturanPresensi()

    let validasi = null
    let distance: number | null = null
    const adaKoordinat = Number.isFinite(lat) && Number.isFinite(lng)

    if (cfg.lat !== null && cfg.lng !== null && cfg.radius !== null && adaKoordinat) {
      distance = jarakMeter(lat, lng, cfg.lat, cfg.lng)
      validasi = hitungJarakGeofence(lat, lng, cfg.lat, cfg.lng, cfg.radius)
    }

    // `tentukanStatus` memakai getHours() pada Date yang diterimanya, jadi
    // beri jam dinding WIB — bukan waktu server (UTC di Vercel).
    const keputusan = tentukanStatus({
      jenis: 'datang',
      waktu: jamDindingWIB(),
      jendela: { mulai: '06:00', selesai: cfg.batasMasuk },
      validasi,
    })

    if (!keputusan.diterima) return { error: keputusan.pesan }

    await prisma.attendance.create({
      data: {
        userId: session.uid,
        classId,
        date: new Date(),
        dateKey,
        slotKey,
        kind: 'DAILY',
        status: keputusan.status,
        lat: adaKoordinat ? lat : null,
        lng: adaKoordinat ? lng : null,
        distance,
      },
    })

    revalidatePath('/', 'layout')
    return { success: true, pesan: keputusan.pesan }
  } catch (err) {
    return gagal(err)
  }
}

export async function submitCheckOut(lat: number, lng: number): Promise<AksiHasil<{ pesan: string }>> {
  try {
    const session = await requireSession('STUDENT')

    const dateKey = dateKeyWIB()
    const slotKey = slotKeyPresensi(dateKey, null)

    const existing = await prisma.attendance.findUnique({
      where: { userId_slotKey: { userId: session.uid, slotKey } },
    })
    if (!existing) {
      return { error: 'Anda belum melakukan presensi masuk hari ini.' }
    }
    if (existing.checkOutTime) {
      return { error: 'Anda sudah melakukan presensi pulang hari ini.' }
    }

    const cfg = await pengaturanPresensi()

    let validasi = null
    const adaKoordinat = Number.isFinite(lat) && Number.isFinite(lng)
    if (cfg.lat !== null && cfg.lng !== null && cfg.radius !== null && adaKoordinat) {
      validasi = hitungJarakGeofence(lat, lng, cfg.lat, cfg.lng, cfg.radius)
    }

    const keputusan = tentukanStatus({
      jenis: 'pulang',
      waktu: jamDindingWIB(),
      jendela: { mulai: cfg.jamPulang, selesai: '23:59' },
      validasi,
    })

    if (!keputusan.diterima) return { error: keputusan.pesan }

    await prisma.attendance.update({
      where: { id: existing.id },
      // Status presensi masuk tidak diubah — riwayat "terlambat" harus tetap
      // terbaca setelah siswa pulang.
      data: { checkOutTime: new Date() },
    })

    revalidatePath('/', 'layout')
    return { success: true, pesan: keputusan.pesan }
  } catch (err) {
    return gagal(err)
  }
}

export async function getTodayAttendance() {
  const session = await optionalSession('STUDENT')
  if (!session) return null

  return await prisma.attendance.findUnique({
    where: {
      userId_slotKey: {
        userId: session.uid,
        slotKey: slotKeyPresensi(dateKeyWIB(), null),
      },
    },
  })
}

export async function getAttendanceHistory() {
  const session = await optionalSession('STUDENT')
  if (!session) return []

  return await prisma.attendance.findMany({
    where: { userId: session.uid },
    include: { subject: { select: { name: true } } },
    orderBy: { date: 'desc' },
    take: 60,
  })
}

/** Ringkasan kehadiran siswa untuk kartu di beranda. */
export async function getMyAttendanceSummary() {
  const session = await optionalSession('STUDENT')
  if (!session) return null

  const rows = await prisma.attendance.groupBy({
    by: ['status'],
    where: { userId: session.uid, kind: 'DAILY' },
    _count: { _all: true },
  })

  const out = { hadir: 0, terlambat: 0, sakit: 0, izin: 0, alfa: 0, total: 0 }
  for (const r of rows) {
    const n = r._count._all
    out.total += n
    if (r.status in out) out[r.status as keyof typeof out] += n
  }
  const persen = out.total > 0
    ? Math.round(((out.hadir + out.terlambat) / out.total) * 100)
    : 0

  return { ...out, persen }
}

// ==========================================
// JADWAL
// ==========================================

export async function getStudentSchedule() {
  const session = await optionalSession('STUDENT')
  if (!session) return []

  const classId = await kelasSaya(session.uid)
  if (!classId) return []

  // Relasi Prisma baru membuat nama mapel, guru, dan jam pelajaran ikut
  // terbawa; sebelumnya kolom-kolom itu hanya string id sehingga halaman
  // jadwal siswa tidak bisa menampilkan apa pun selain jam.
  const schedules = await prisma.schedule.findMany({
    where: { classId },
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
      jamPelajaran: { select: { id: true, name: true } },
    },
    orderBy: [{ day: 'asc' }, { sessionStart: 'asc' }],
  })

  if (schedules.length > 0) return schedules

  // Cadangan: kalau jadwal belum diplot, tampilkan daftar pengampu saja.
  const teachers = await prisma.classTeacher.findMany({
    where: { classId },
    include: { subject: true, user: true },
  })

  return teachers.map((t) => ({
    mapel: t.subject.name,
    guru: t.user.name,
  }))
}

// ==========================================
// MATERI
// ==========================================

export async function getStudentMaterials() {
  const session = await optionalSession('STUDENT')
  if (!session) return []

  const classId = await kelasSaya(session.uid)
  if (!classId) return []

  return await prisma.material.findMany({
    where: { classId },
    include: {
      author: { select: { name: true } },
      subject: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ==========================================
// TUGAS
// ==========================================

export async function getStudentAssignments() {
  const session = await optionalSession('STUDENT')
  if (!session) return []

  const classId = await kelasSaya(session.uid)
  if (!classId) return []

  const assignments = await prisma.assignment.findMany({
    where: { classId },
    include: {
      subject: { select: { name: true } },
      author: { select: { name: true } },
      submissions: {
        where: { userId: session.uid },
        select: {
          score: true,
          status: true,
          submittedAt: true,
          description: true,
          answerText: true,
          fileUrl: true,
          fileName: true,
          isLate: true,
        },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  return assignments.map((a) => ({
    ...a,
    mySubmission: a.submissions[0] || null,
  }))
}

/**
 * Pengumpulan tugas oleh siswa.
 *
 * Fitur ini sebelumnya tidak ada: halaman tugas siswa hanya bisa membaca,
 * dan status `SUBMITTED` di basis data tidak pernah mungkin tercapai karena
 * satu-satunya penulis `UserAssignment` adalah `saveGrade` milik guru.
 */
export async function submitAssignment(input: {
  assignmentId: string
  answerText?: string
  fileUrl?: string
  fileName?: string
}): Promise<AksiHasil<{ pesan: string }>> {
  try {
    const session = await requireSession('STUDENT')

    const classId = await kelasSaya(session.uid)
    if (!classId) return { error: 'Siswa belum memiliki rombel/kelas.' }

    const assignment = await prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      select: {
        id: true,
        classId: true,
        dueDate: true,
        allowLateSubmission: true,
      },
    })
    if (!assignment) return { error: 'Tugas tidak ditemukan.' }
    if (assignment.classId !== classId) {
      return { error: 'Tugas ini bukan untuk kelasmu.' }
    }

    const jawaban = input.answerText?.trim() || ''
    const lampiran = input.fileUrl?.trim() || ''
    if (!jawaban && !lampiran) {
      return { error: 'Isi jawaban atau lampirkan tautan berkas dulu.' }
    }

    const existing = await prisma.userAssignment.findUnique({
      where: {
        userId_assignmentId: {
          userId: session.uid,
          assignmentId: assignment.id,
        },
      },
      select: { status: true },
    })

    // Setelah dinilai guru, jawaban tidak boleh diubah lagi.
    if (existing?.status === 'GRADED') {
      return { error: 'Tugas sudah dinilai dan tidak dapat diubah lagi.' }
    }

    const sekarang = new Date()
    const terlambat = sekarang > assignment.dueDate
    if (terlambat && !assignment.allowLateSubmission) {
      return { error: 'Tenggat sudah lewat dan tugas ini tidak menerima keterlambatan.' }
    }

    const data = {
      answerText: jawaban || null,
      fileUrl: lampiran || null,
      fileName: input.fileName?.trim() || null,
      submittedAt: sekarang,
      isLate: terlambat,
      status: terlambat ? 'LATE' : 'SUBMITTED',
    }

    await prisma.userAssignment.upsert({
      where: {
        userId_assignmentId: {
          userId: session.uid,
          assignmentId: assignment.id,
        },
      },
      update: data,
      create: {
        userId: session.uid,
        assignmentId: assignment.id,
        ...data,
      },
    })

    revalidatePath('/', 'layout')
    return {
      success: true,
      pesan: terlambat
        ? 'Tugas terkumpul, tetapi tercatat melewati tenggat.'
        : 'Tugas berhasil dikumpulkan.',
    }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// KESISWAAN
// ==========================================

export async function getStudentViolations() {
  const session = await optionalSession('STUDENT')
  if (!session) return []

  return await prisma.violation.findMany({
    where: { studentId: session.uid },
    include: { reporter: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSpiritualJournals() {
  const session = await optionalSession('STUDENT')
  if (!session) return []

  return await prisma.spiritualJournal.findMany({
    where: { userId: session.uid },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createSpiritualJournal(data: {
  activity: string
  notes: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('STUDENT')
    if (!data.activity?.trim()) return { error: 'Kegiatan harus diisi.' }

    await prisma.spiritualJournal.create({
      data: {
        userId: session.uid,
        activity: data.activity.trim(),
        notes: data.notes?.trim() || null,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// UJIAN / CBT
// ==========================================

/**
 * Validasi token ujian. Token per-ujian diprioritaskan; kalau ujian tidak
 * punya token sendiri, dipakai token global `CBT_TOKEN`.
 */
export async function validateCbtToken(token: string, examId?: string) {
  const dikirim = String(token || '').trim().toUpperCase()
  if (!dikirim) return false

  if (examId) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { token: true },
    })
    if (exam?.token) return exam.token.toUpperCase() === dikirim
  }

  const setting = await prisma.appSetting.findUnique({
    where: { key: 'CBT_TOKEN' },
  })
  return (setting?.value || '').trim().toUpperCase() === dikirim
}

export async function getStudentExams() {
  const session = await optionalSession('STUDENT')
  if (!session) return []

  const classId = await kelasSaya(session.uid)
  if (!classId) return []

  const exams = await prisma.exam.findMany({
    // Hanya ujian yang sudah diterbitkan gurunya. Sebelumnya setiap ujian
    // langsung tampil dan bisa dikerjakan begitu dibuat.
    where: { classId, isPublished: true },
    include: {
      subject: { select: { name: true } },
      classInfo: { select: { name: true } },
      _count: { select: { questions: true } },
      submissions: { where: { userId: session.uid } },
    },
    orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
  })

  const sekarang = new Date()

  // Daftar ini sengaja TIDAK memuat soal. Soal baru dikirim oleh
  // `getExamPaper()` setelah token diverifikasi, supaya isi ujian tidak
  // bisa dibaca lewat respons daftar sebelum ujian dibuka.
  return exams.map((exam) => {
    const mySubmission = exam.submissions[0] || null

    const kelayakan = kelayakanUjian({
      mulai: exam.startAt ? exam.startAt.toISOString() : null,
      selesai: exam.endAt ? exam.endAt.toISOString() : null,
      durasiMenit: exam.duration,
      mulaiServer: mySubmission?.startedAt
        ? mySubmission.startedAt.toISOString()
        : null,
      sudahDikirim:
        mySubmission?.status === 'FINISHED' || mySubmission?.status === 'GRADED',
      sekarang,
    })

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      type: exam.type,
      duration: exam.duration,
      startAt: exam.startAt,
      endAt: exam.endAt,
      passingScore: exam.passingScore,
      showResult: exam.showResult,
      subject: exam.subject,
      classInfo: exam.classInfo,
      jumlahSoal: exam._count.questions,
      kelayakan,
      mySubmission: mySubmission
        ? {
            id: mySubmission.id,
            status: mySubmission.status,
            startedAt: mySubmission.startedAt,
            submittedAt: mySubmission.submittedAt,
            // Nilai disembunyikan bila guru mematikan tampilkan hasil.
            score: exam.showResult ? mySubmission.score : null,
            scoreMax: exam.showResult ? mySubmission.scoreMax : null,
            essayScore: exam.showResult ? mySubmission.essayScore : null,
            finalScore: exam.showResult ? mySubmission.finalScore : null,
          }
        : null,
    }
  })
}

/**
 * Ambil naskah soal untuk dikerjakan. Memerlukan token yang benar dan
 * kelayakan waktu; sekaligus mencatat `startedAt` bila belum ada, sehingga
 * sisa waktu selalu dihitung dari jam server.
 */
export async function getExamPaper(
  examId: string,
  token: string
): Promise<AksiHasil<{
  sisaDetik: number
  questions: unknown[]
  exam: { id: string; title: string; duration: number; type: string }
}>> {
  try {
    const session = await requireSession('STUDENT')

    const classId = await kelasSaya(session.uid)
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' } } },
    })
    if (!exam || !exam.isPublished || exam.classId !== classId) {
      return { error: 'Ujian tidak tersedia untuk kelasmu.' }
    }
    if (exam.questions.length === 0) {
      return { error: 'Ujian ini belum memiliki soal. Hubungi gurumu.' }
    }
    if (!(await validateCbtToken(token, examId))) {
      return { error: 'Token ujian salah.' }
    }

    let submission = await prisma.examSubmission.findUnique({
      where: { examId_userId: { examId, userId: session.uid } },
    })

    const kelayakan = kelayakanUjian({
      mulai: exam.startAt ? exam.startAt.toISOString() : null,
      selesai: exam.endAt ? exam.endAt.toISOString() : null,
      durasiMenit: exam.duration,
      mulaiServer: submission?.startedAt
        ? submission.startedAt.toISOString()
        : null,
      sudahDikirim:
        submission?.status === 'FINISHED' || submission?.status === 'GRADED',
      sekarang: new Date(),
    })
    if (!kelayakan.boleh) return { error: kelayakan.pesan }

    if (!submission) {
      submission = await prisma.examSubmission.create({
        data: { examId, userId: session.uid, status: 'ONGOING' },
      })
    }

    const soal = exam.questions.map((q) => ({
      id: q.id,
      question: q.question,
      imageUrl: q.imageUrl,
      type: q.type as 'PG' | 'ESAI',
      points: q.points,
      options: parseOptions(q.options),
      correctAnswer: q.correctAnswer,
    }))

    const urut = exam.shuffle ? acakPG(soal, session.uid) : soal

    return {
      success: true,
      // Kunci jawaban dibuang sebelum dikirim ke browser.
      questions: tanpaKunci(urut),
      sisaDetik: kelayakan.sisaDetik,
      exam: {
        id: exam.id,
        title: exam.title,
        duration: exam.duration,
        type: exam.type,
      },
    }
  } catch (err) {
    return gagal(err)
  }
}

function parseOptions(raw: string | null): string[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map((o) => String(o))
    return null
  } catch {
    // Sebagian soal hasil impor memakai daftar dipisah koma, bukan JSON.
    return raw.includes(',') ? raw.split(',').map((s) => s.trim()) : [raw]
  }
}

export async function submitExam(
  examId: string,
  answersJson: string,
  violationCount = 0
): Promise<AksiHasil<{ score: number | null; scoreMax: number | null; menungguKoreksi: boolean }>> {
  try {
    const session = await requireSession('STUDENT')

    const classId = await kelasSaya(session.uid)
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    })
    if (!exam || !exam.isPublished || exam.classId !== classId) {
      return { error: 'Ujian tidak tersedia untuk kelasmu.' }
    }

    const existing = await prisma.examSubmission.findUnique({
      where: { examId_userId: { examId, userId: session.uid } },
    })
    if (existing?.status === 'FINISHED' || existing?.status === 'GRADED') {
      return { error: 'Ujian ini sudah kamu kumpulkan.' }
    }

    const jawabanMap = new Map<string, string>()
    try {
      const parsed = JSON.parse(answersJson)
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          jawabanMap.set(k, String(v))
        }
      }
    } catch {
      return { error: 'Format jawaban tidak valid.' }
    }

    const { skorOtomatis, skorMaksOtomatis, bobotEsai } = koreksiOtomatis(
      exam.questions.map((q) => ({
        id: q.id,
        type: q.type as 'PG' | 'ESAI',
        question: q.question,
        options: null,
        correctAnswer: q.correctAnswer,
        points: q.points,
      })),
      jawabanMap
    )

    // Kalau tidak ada soal esai, nilai akhir bisa langsung final.
    const finalScore =
      bobotEsai === 0
        ? keNilaiAkhir(skorOtomatis, skorMaksOtomatis, 100)
        : null

    await prisma.examSubmission.upsert({
      where: { examId_userId: { examId, userId: session.uid } },
      update: {
        answers: answersJson,
        score: skorOtomatis,
        scoreMax: skorMaksOtomatis,
        essayMax: bobotEsai,
        finalScore,
        submittedAt: new Date(),
        status: 'FINISHED',
        violationCount,
      },
      create: {
        examId,
        userId: session.uid,
        answers: answersJson,
        score: skorOtomatis,
        scoreMax: skorMaksOtomatis,
        essayMax: bobotEsai,
        finalScore,
        submittedAt: new Date(),
        status: 'FINISHED',
        violationCount,
      },
    })

    revalidatePath('/', 'layout')
    return {
      success: true,
      // Hasil hanya dibocorkan bila guru mengizinkan.
      score: exam.showResult ? skorOtomatis : null,
      scoreMax: exam.showResult ? skorMaksOtomatis : null,
      menungguKoreksi: bobotEsai > 0,
    }
  } catch (err) {
    return gagal(err)
  }
}

/** Rekap nilai ujian siswa. */
export async function getMyExamResults() {
  const session = await optionalSession('STUDENT')
  if (!session) return []

  const rows = await prisma.examSubmission.findMany({
    where: {
      userId: session.uid,
      status: { in: ['FINISHED', 'GRADED'] },
      exam: { showResult: true },
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          passingScore: true,
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  return rows.map((r) => ({
    id: r.id,
    exam: r.exam,
    status: r.status,
    score: r.score,
    scoreMax: r.scoreMax,
    essayScore: r.essayScore,
    finalScore: r.finalScore,
    submittedAt: r.submittedAt,
  }))
}

// ==========================================
// PERPUSTAKAAN
// ==========================================

export async function getLibraryBooks() {
  return await prisma.libraryBook.findMany({ orderBy: { createdAt: 'desc' } })
}

/**
 * Naikkan penghitung unduhan. Kolom `downloads` sudah ada sejak awal tapi
 * nilainya selalu 0 karena tidak ada yang pernah menambahnya.
 */
export async function recordBookDownload(bookId: string): Promise<AksiHasil<{ fileUrl: string | null; downloads: number }>> {
  try {
    await requireSession()
    const book = await prisma.libraryBook.update({
      where: { id: bookId },
      data: { downloads: { increment: 1 } },
      select: { fileUrl: true, downloads: true },
    })
    return { success: true, fileUrl: book.fileUrl, downloads: book.downloads }
  } catch (err) {
    return gagal(err)
  }
}
