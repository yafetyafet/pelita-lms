'use server'

import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { labelPerangkat } from '@/lib/logic/perangkat'
import type { AksiHasil } from '@/lib/types/aksi'
import type { Role } from '@prisma/client'
import {
  clearSessionCookie,
  getSession,
  homeForRole,
  requireSession,
  setSessionCookie,
} from '@/lib/auth/session'
import { hashPassword, needsUpgrade, verifyPassword } from '@/lib/auth/password'

export async function login(
  username: string,
  password?: string
): Promise<
  AksiHasil<{
    role: Role
    redirectTo: string
    mustChangePassword: boolean
    perangkatSebelumnya: string | null
  }>
> {
  try {
    const uname = String(username || '').trim()
    if (!uname) return { error: 'Username harus diisi.' }
    if (!password) return { error: 'Password harus diisi.' }

    const user = await prisma.user.findUnique({
      where: { username: uname },
    })

    // Pesan galat digabung supaya tidak membocorkan username mana yang
    // terdaftar (enumerasi akun).
    if (!user) return { error: 'Username atau password salah.' }

    const ok = await verifyPassword(password, user.password)
    if (!ok) return { error: 'Username atau password salah.' }

    if (!user.isActive) {
      return { error: 'Akun ini dinonaktifkan. Hubungi administrator.' }
    }

    // Satu akun = satu perangkat. Login baru SELALU menang: sesi lama
    // langsung batal begitu `sesiId` di sini tertimpa. Dipilih begini - bukan
    // menolak login kedua - supaya tidak ada siswa yang terkunci di luar
    // akunnya sendiri gara-gara ponsel lama hilang atau lupa keluar.
    const sid = randomUUID()
    const perangkat = labelPerangkat((await headers()).get('user-agent'))
    const sesiSebelumnya = user.sesiPerangkat

    // Akun warisan masih menyimpan kata sandi plaintext — tulis ulang
    // sebagai hash begitu kata sandinya terbukti benar.
    const patch: {
      lastLoginAt: Date
      password?: string
      sesiId: string
      sesiPerangkat: string
      sesiSejak: Date
    } = {
      lastLoginAt: new Date(),
      sesiId: sid,
      sesiPerangkat: perangkat,
      sesiSejak: new Date(),
    }
    if (needsUpgrade(user.password)) {
      patch.password = await hashPassword(password)
    }
    await prisma.user.update({ where: { id: user.id }, data: patch })

    await setSessionCookie({
      uid: user.id,
      role: user.role,
      name: user.name,
      sid,
    })

    return {
      success: true,
      role: user.role,
      redirectTo: homeForRole(user.role),
      mustChangePassword: user.mustChangePassword,
      // Diberitahukan supaya pemilik akun sadar kalau akunnya ternyata masih
      // aktif di tempat lain - ini cara paling awal seorang siswa tahu
      // sandinya dipakai orang.
      perangkatSebelumnya:
        user.sesiId && sesiSebelumnya ? sesiSebelumnya : null,
    }
  } catch (err: any) {
    console.error('Login Error:', err)
    return { error: 'Terjadi kesalahan sistem. Coba lagi beberapa saat.' }
  }
}

export async function logout() {
  // Lepaskan juga kunci perangkat, bukan hanya cookie-nya. Kalau `sesiId`
  // dibiarkan, siswa yang keluar dengan benar di lab lalu masuk lagi dari
  // ponselnya akan melihat peringatan "dipakai di perangkat lain" yang
  // sebetulnya menunjuk dirinya sendiri.
  const session = await getSession()
  if (session) {
    await prisma.user
      .updateMany({
        where: { id: session.uid, sesiId: session.sid ?? undefined },
        data: { sesiId: null, sesiPerangkat: null, sesiSejak: null },
      })
      // Keluar tidak boleh gagal gara-gara basis data sedang bermasalah.
      .catch(() => {})
  }
  await clearSessionCookie()
  redirect('/login')
}

/**
 * Lepaskan kunci perangkat sebuah akun (admin).
 *
 * Diperlukan untuk kasus nyata: ponsel siswa hilang/rusak sementara sesinya
 * masih tercatat aktif, atau siswa memakai perangkat pinjaman lalu tidak
 * bisa masuk dari perangkatnya sendiri. Tanpa ini, satu-satunya jalan keluar
 * adalah menunggu sesi 7 hari kedaluwarsa.
 */
export async function resetPerangkat(userId: string): Promise<AksiHasil> {
  try {
    await requireSession('ADMIN')
    await prisma.user.update({
      where: { id: userId },
      data: { sesiId: null, sesiPerangkat: null, sesiSejak: null },
    })
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Gagal melepas perangkat.' }
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  // Relasi diambil sesuai peran. Sebelumnya setiap pemanggilan menarik
  // waliClasses, studentClasses, DAN teacherClasses sekaligus — untuk seorang
  // siswa, dua di antaranya pasti kosong tetapi kuerinya tetap dijalankan.
  // Terukur 9 kueri / ~400ms hanya untuk membaca profil.
  const relasi =
    session.role === 'STUDENT'
      ? {
          studentClasses: {
            include: {
              classInfo: {
                include: { wali: { select: { id: true, name: true } } },
              },
            },
          },
        }
      : session.role === 'TEACHER'
        ? {
            waliClasses: { select: { id: true, name: true, description: true } },
            teacherClasses: {
              select: {
                classId: true,
                subjectId: true,
                classInfo: { select: { id: true, name: true } },
                subject: { select: { id: true, name: true } },
              },
            },
          }
        : {}

  try {
    return await prisma.user.findUnique({
      where: { id: session.uid },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        avatarUrl: true,
        nomorInduk: true,
        email: true,
        phone: true,
        mustChangePassword: true,
        ...relasi,
      },
    })
  } catch (err) {
    console.error('Failed to get current user:', err)
    return null
  }
}

/**
 * Ganti kata sandi sendiri. Sebelumnya tombol di halaman profil hanya
 * memicu animasi sukses tanpa menyimpan apa pun.
 */
export async function changeMyPassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession()

    const newPass = String(input.newPassword || '')
    if (newPass.length < 6) {
      return { error: 'Password baru minimal 6 karakter.' }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { id: true, password: true },
    })
    if (!user) return { error: 'Akun tidak ditemukan.' }

    const ok = await verifyPassword(String(input.currentPassword || ''), user.password)
    if (!ok) return { error: 'Password saat ini salah.' }

    if (await verifyPassword(newPass, user.password)) {
      return { error: 'Password baru harus berbeda dari password lama.' }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(newPass),
        mustChangePassword: false,
      },
    })

    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Gagal mengubah password.' }
  }
}

/** Perbarui data kontak milik sendiri. */
export async function updateMyProfile(input: {
  email?: string
  phone?: string
}): Promise<AksiHasil> {
  try {
    const session = await requireSession()
    await prisma.user.update({
      where: { id: session.uid },
      data: {
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
      },
    })
    return { success: true }
  } catch (err: any) {
    return { error: err?.message || 'Gagal menyimpan profil.' }
  }
}
