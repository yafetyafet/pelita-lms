'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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

export async function login(username: string, password?: string): Promise<AksiHasil<{ role: Role; redirectTo: string; mustChangePassword: boolean }>> {
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

    // Akun warisan masih menyimpan kata sandi plaintext — tulis ulang
    // sebagai hash begitu kata sandinya terbukti benar.
    const patch: { lastLoginAt: Date; password?: string } = {
      lastLoginAt: new Date(),
    }
    if (needsUpgrade(user.password)) {
      patch.password = await hashPassword(password)
    }
    await prisma.user.update({ where: { id: user.id }, data: patch })

    await setSessionCookie({
      uid: user.id,
      role: user.role,
      name: user.name,
    })

    return {
      success: true,
      role: user.role,
      redirectTo: homeForRole(user.role),
      mustChangePassword: user.mustChangePassword,
    }
  } catch (err: any) {
    console.error('Login Error:', err)
    return { error: 'Terjadi kesalahan sistem. Coba lagi beberapa saat.' }
  }
}

export async function logout() {
  await clearSessionCookie()
  redirect('/login')
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

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
        waliClasses: {
          select: { id: true, name: true, description: true },
        },
        studentClasses: {
          include: {
            classInfo: {
              include: { wali: { select: { id: true, name: true } } },
            },
          },
        },
        teacherClasses: {
          include: { classInfo: true, subject: true },
        },
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
