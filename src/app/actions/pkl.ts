'use server'

/**
 * PKL / Prakerin.
 *
 * Dashboard DUDI sebelumnya seluruhnya statis — angka "0 Siswa" dan teks
 * "belum ada siswa PKL" ditulis langsung di JSX, tanpa model basis data
 * maupun action. Modul ini yang menghidupkannya: admin menempatkan siswa ke
 * mitra industri, siswa mengisi jurnal harian dan presensi geotagging di
 * lokasi industri, pembimbing industri memverifikasi.
 */

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/prisma'
import type { AksiHasil } from '@/lib/types/aksi'
import { optionalSession, requireSession } from '@/lib/auth/session'
import { ForbiddenError } from '@/lib/logic/rbac'
import { hitungJarakGeofence, jarakMeter, tentukanStatus } from '@/lib/logic/attendance'
import { dateKeyWIB, jamDindingWIB, rentangHariWIB } from '@/lib/logic/waktu'

function gagal(err: unknown) {
  if (err instanceof ForbiddenError) return { error: err.message }
  return { error: err instanceof Error ? err.message : 'Terjadi kesalahan.' }
}

// ==========================================
// MITRA INDUSTRI (ADMIN)
// ==========================================

export async function getPartners() {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.partner.findMany({
    include: {
      mentor: { select: { id: true, name: true, username: true } },
      _count: { select: { placements: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function createPartner(data: {
  name: string
  address?: string
  contact?: string
  phone?: string
  lat?: number
  lng?: number
  radius?: number
  mentorId?: string
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    if (!data.name?.trim()) return { error: 'Nama industri harus diisi.' }

    await prisma.partner.create({
      data: {
        name: data.name.trim(),
        address: data.address?.trim() || null,
        contact: data.contact?.trim() || null,
        phone: data.phone?.trim() || null,
        lat: Number.isFinite(data.lat) ? data.lat : null,
        lng: Number.isFinite(data.lng) ? data.lng : null,
        radius: data.radius && data.radius > 0 ? data.radius : 150,
        mentorId: data.mentorId || null,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function updatePartner(data: {
  id: string
  name?: string
  address?: string
  contact?: string
  phone?: string
  lat?: number | null
  lng?: number | null
  radius?: number
  mentorId?: string | null
  isActive?: boolean
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.partner.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.address !== undefined
          ? { address: data.address.trim() || null }
          : {}),
        ...(data.contact !== undefined
          ? { contact: data.contact.trim() || null }
          : {}),
        ...(data.phone !== undefined ? { phone: data.phone.trim() || null } : {}),
        ...(data.lat !== undefined ? { lat: data.lat } : {}),
        ...(data.lng !== undefined ? { lng: data.lng } : {}),
        ...(data.radius !== undefined ? { radius: data.radius } : {}),
        ...(data.mentorId !== undefined
          ? { mentorId: data.mentorId || null }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deletePartner(id: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.partner.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function getDudiAccounts() {
  const session = await optionalSession('ADMIN')
  if (!session) return []

  return await prisma.user.findMany({
    where: { role: 'DUDI' },
    select: { id: true, name: true, username: true },
    orderBy: { name: 'asc' },
  })
}

// ==========================================
// PENEMPATAN PKL (ADMIN / GURU PEMBIMBING)
// ==========================================

export async function getPlacements(partnerId?: string) {
  const session = await optionalSession('ADMIN', 'TEACHER')
  if (!session) return []

  return await prisma.pklPlacement.findMany({
    where: {
      ...(partnerId ? { partnerId } : {}),
      // Guru hanya melihat siswa yang ia bimbing.
      ...(session.role === 'TEACHER' ? { supervisorId: session.uid } : {}),
    },
    include: {
      student: { select: { id: true, name: true, username: true } },
      partner: { select: { id: true, name: true } },
      supervisor: { select: { id: true, name: true } },
      _count: { select: { journals: true, attendances: true } },
    },
    orderBy: { startDate: 'desc' },
  })
}

export async function createPlacement(data: {
  studentId: string
  partnerId: string
  supervisorId?: string
  startDate: string
  endDate: string
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')

    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      return { error: 'Tanggal mulai/selesai tidak valid.' }
    }
    if (end <= start) return { error: 'Tanggal selesai harus setelah tanggal mulai.' }

    const siswa = await prisma.user.findFirst({
      where: { id: data.studentId, role: 'STUDENT' },
      select: { id: true },
    })
    if (!siswa) return { error: 'Siswa tidak ditemukan.' }

    // Satu siswa tidak boleh punya dua penempatan aktif sekaligus.
    const aktif = await prisma.pklPlacement.findFirst({
      where: { studentId: data.studentId, status: 'ACTIVE' },
      include: { partner: { select: { name: true } } },
    })
    if (aktif) {
      return {
        error: `Siswa ini masih aktif PKL di ${aktif.partner.name}. Selesaikan dulu penempatan tersebut.`,
      }
    }

    await prisma.pklPlacement.create({
      data: {
        studentId: data.studentId,
        partnerId: data.partnerId,
        supervisorId: data.supervisorId || null,
        startDate: start,
        endDate: end,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function updatePlacement(data: {
  id: string
  status?: string
  supervisorId?: string | null
  finalScore?: number | null
  finalNote?: string
}): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN', 'TEACHER')
    if (data.status && !['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(data.status)) {
      return { error: 'Status penempatan tidak dikenal.' }
    }
    if (
      data.finalScore !== undefined &&
      data.finalScore !== null &&
      (data.finalScore < 0 || data.finalScore > 100)
    ) {
      return { error: 'Nilai akhir harus antara 0 dan 100.' }
    }

    await prisma.pklPlacement.update({
      where: { id: data.id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.supervisorId !== undefined
          ? { supervisorId: data.supervisorId || null }
          : {}),
        ...(data.finalScore !== undefined ? { finalScore: data.finalScore } : {}),
        ...(data.finalNote !== undefined
          ? { finalNote: data.finalNote.trim() || null }
          : {}),
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

export async function deletePlacement(id: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.pklPlacement.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

// ==========================================
// SISI SISWA
// ==========================================

/** Penempatan PKL aktif milik siswa yang sedang login. */
export async function getMyPlacement() {
  const session = await optionalSession('STUDENT')
  if (!session) return null

  return await prisma.pklPlacement.findFirst({
    where: { studentId: session.uid, status: 'ACTIVE' },
    include: {
      partner: true,
      supervisor: { select: { id: true, name: true } },
      journals: { orderBy: { date: 'desc' }, take: 60 },
      attendances: { orderBy: { date: 'desc' }, take: 30 },
    },
  })
}

export async function createPklJournal(data: {
  date?: string
  activity: string
  notes?: string
  fileUrl?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('STUDENT')

    const placement = await prisma.pklPlacement.findFirst({
      where: { studentId: session.uid, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!placement) return { error: 'Kamu belum punya penempatan PKL aktif.' }
    if (!data.activity?.trim()) return { error: 'Uraian kegiatan harus diisi.' }

    await prisma.pklJournal.create({
      data: {
        placementId: placement.id,
        date: data.date ? new Date(data.date) : new Date(),
        activity: data.activity.trim(),
        notes: data.notes?.trim() || null,
        fileUrl: data.fileUrl?.trim() || null,
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}

/**
 * Presensi PKL dengan geofence lokasi industri (bukan lokasi sekolah).
 */
export async function submitPklAttendance(lat: number, lng: number): Promise<AksiHasil<{ pesan: string }>> {
  try {
    const session = await requireSession('STUDENT')

    const placement = await prisma.pklPlacement.findFirst({
      where: { studentId: session.uid, status: 'ACTIVE' },
      include: { partner: true },
    })
    if (!placement) return { error: 'Kamu belum punya penempatan PKL aktif.' }

    const dateKey = dateKeyWIB()
    const existing = await prisma.pklAttendance.findUnique({
      where: { placementId_dateKey: { placementId: placement.id, dateKey } },
    })
    if (existing) return { error: 'Kamu sudah presensi PKL hari ini.' }

    const p = placement.partner
    let validasi = null
    let distance: number | null = null
    const adaKoordinat = Number.isFinite(lat) && Number.isFinite(lng)

    if (p.lat !== null && p.lng !== null && adaKoordinat) {
      distance = jarakMeter(lat, lng, p.lat, p.lng)
      validasi = hitungJarakGeofence(lat, lng, p.lat, p.lng, p.radius)
    }

    const keputusan = tentukanStatus({
      jenis: 'datang',
      waktu: jamDindingWIB(),
      jendela: { mulai: '05:00', selesai: '09:00' },
      validasi,
    })
    if (!keputusan.diterima) return { error: keputusan.pesan }

    await prisma.pklAttendance.create({
      data: {
        placementId: placement.id,
        date: rentangHariWIB(dateKey).mulai,
        dateKey,
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

// ==========================================
// SISI PEMBIMBING INDUSTRI (DUDI)
// ==========================================

/** Ringkasan untuk dashboard mitra DUDI yang sedang login. */
export async function getMentorDashboard() {
  const session = await optionalSession('DUDI', 'ADMIN')
  if (!session) return null

  const partners = await prisma.partner.findMany({
    where: session.role === 'ADMIN' ? {} : { mentorId: session.uid },
    include: {
      placements: {
        where: { status: 'ACTIVE' },
        include: {
          student: { select: { id: true, name: true, username: true } },
          supervisor: { select: { id: true, name: true } },
        },
      },
    },
  })

  const placementIds = partners.flatMap((p) => p.placements.map((pl) => pl.id))
  const dateKey = dateKeyWIB()

  const [presensiHariIni, jurnalMenunggu] = await Promise.all([
    placementIds.length
      ? prisma.pklAttendance.findMany({
          where: { placementId: { in: placementIds }, dateKey },
        })
      : Promise.resolve([]),
    placementIds.length
      ? prisma.pklJournal.findMany({
          where: { placementId: { in: placementIds }, status: 'PENDING' },
          include: {
            placement: {
              include: { student: { select: { id: true, name: true } } },
            },
          },
          orderBy: { date: 'desc' },
          take: 50,
        })
      : Promise.resolve([]),
  ])

  const presensiPerPlacement = new Map(
    presensiHariIni.map((a) => [a.placementId, a])
  )

  return {
    dateKey,
    partners: partners.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      radius: p.radius,
      siswa: p.placements.map((pl) => ({
        placementId: pl.id,
        student: pl.student,
        supervisor: pl.supervisor,
        startDate: pl.startDate,
        endDate: pl.endDate,
        presensiHariIni: presensiPerPlacement.get(pl.id) ?? null,
      })),
    })),
    totalSiswa: placementIds.length,
    hadirHariIni: presensiHariIni.length,
    jurnalMenunggu,
  }
}

/** Verifikasi jurnal harian siswa PKL oleh pembimbing industri. */
export async function verifyPklJournal(input: {
  journalId: string
  status: 'APPROVED' | 'REJECTED'
  mentorNote?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession('DUDI', 'ADMIN', 'TEACHER')

    if (!['APPROVED', 'REJECTED'].includes(input.status)) {
      return { error: 'Status verifikasi tidak dikenal.' }
    }

    const journal = await prisma.pklJournal.findUnique({
      where: { id: input.journalId },
      include: { placement: { include: { partner: true } } },
    })
    if (!journal) return { error: 'Jurnal tidak ditemukan.' }

    // Pembimbing industri hanya boleh memverifikasi jurnal di mitranya,
    // dan guru hanya untuk siswa yang ia bimbing.
    if (session.role === 'DUDI' && journal.placement.partner.mentorId !== session.uid) {
      return { error: 'Jurnal ini bukan dari siswa di industri Anda.' }
    }
    if (
      session.role === 'TEACHER' &&
      journal.placement.supervisorId !== session.uid
    ) {
      return { error: 'Kamu bukan pembimbing sekolah siswa ini.' }
    }

    await prisma.pklJournal.update({
      where: { id: journal.id },
      data: {
        status: input.status,
        mentorNote: input.mentorNote?.trim() || null,
        verifiedById: session.uid,
        verifiedAt: new Date(),
      },
    })
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}
