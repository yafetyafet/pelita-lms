/**
 * Pembacaan sesi di sisi server (Server Action & Server Component).
 *
 * Semua server action wajib lewat helper di sini, jangan lagi membaca
 * `cookies().get('userId')` langsung. Bug yang membuat seluruh fitur guru
 * mati berasal dari dua nama cookie yang tidak sinkron (`role` vs
 * `userRole`); satu sumber kebenaran mencegah hal itu terulang.
 */

import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { prisma } from '@/lib/prisma'
import { ForbiddenError } from '@/lib/logic/rbac'
import type { Role } from '@prisma/client'

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from './token'

export type { SessionPayload }

/**
 * Galat khusus saat token sah tetapi perangkatnya sudah bukan yang aktif.
 * Dibedakan dari "belum login" supaya antarmuka bisa menjelaskan sebabnya
 * - pengguna yang tiba-tiba terlempar ke halaman masuk tanpa keterangan
 * akan mengira aplikasinya rusak.
 */
export class PerangkatLainError extends ForbiddenError {
  constructor(perangkat?: string | null) {
    super(
      perangkat
        ? `Akun ini sedang dipakai di perangkat lain (${perangkat}). Satu akun hanya boleh aktif di satu perangkat.`
        : 'Akun ini sedang dipakai di perangkat lain. Satu akun hanya boleh aktif di satu perangkat.'
    )
    this.name = 'PerangkatLainError'
  }
}

/**
 * Apakah `sid` pada token masih sama dengan sesi aktif di basis data?
 *
 * Dibungkus `cache()` sehingga satu request hanya menembak basis data sekali
 * walaupun `requireSession()` dipanggil berkali-kali di dalamnya. Kuerinya
 * sendiri adalah lookup kunci primer dengan dua kolom, jadi sangat murah -
 * terukur tidak menambah kueri baru pada halaman yang memang sudah membaca
 * data pengguna.
 */
const sesiAktif = cache(async (uid: string) => {
  return prisma.user.findUnique({
    where: { id: uid },
    select: { sesiId: true, sesiPerangkat: true, isActive: true },
  })
})

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}

/**
 * Sesi yang sudah dipastikan masih milik perangkat ini.
 *
 * Melempar `PerangkatLainError` bila akun sudah dipakai login di tempat lain.
 * Token warisan tanpa `sid` diperlakukan sebagai kedaluwarsa (mengembalikan
 * `null`) supaya penggunanya login ulang sekali dan mendapat sid.
 */
export async function getSessionTerverifikasi(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session) return null

  const user = await sesiAktif(session.uid)
  // Akun terhapus atau dinonaktifkan setelah token terbit.
  if (!user || !user.isActive) return null

  // Belum pernah login sejak fitur ini aktif: belum ada yang bisa dibandingkan,
  // biarkan lewat agar tidak mengeluarkan semua orang sekaligus.
  if (!user.sesiId) return session

  if (!session.sid) return null
  if (session.sid !== user.sesiId) throw new PerangkatLainError(user.sesiPerangkat)

  return session
}

/**
 * Sesi wajib ada dan role-nya termasuk salah satu `roles`.
 * Kalau `roles` kosong, cukup sudah login.
 */
export async function requireSession(
  ...roles: Role[]
): Promise<SessionPayload> {
  const session = await getSessionTerverifikasi()
  if (!session) throw new ForbiddenError('Silakan masuk terlebih dahulu.')
  if (roles.length > 0 && !roles.includes(session.role as Role)) {
    throw new ForbiddenError()
  }
  return session
}

/**
 * Varian yang mengembalikan `null` alih-alih melempar, untuk action
 * pembacaan daftar yang lebih baik menampilkan kondisi kosong daripada
 * memunculkan layar galat.
 */
export async function optionalSession(
  ...roles: Role[]
): Promise<SessionPayload | null> {
  try {
    return await requireSession(...roles)
  } catch {
    return null
  }
}

/**
 * Penjaga untuk dipasang di layout tiap peran.
 *
 * Dipanggil di layout - bukan hanya di dalam action - supaya pengguna yang
 * sesinya tergeser langsung diarahkan ke halaman masuk berikut alasannya,
 * alih-alih menabrak layar galat merah saat membuka halaman biasa.
 */
export async function jagaPerangkat(): Promise<void> {
  let session: SessionPayload | null = null
  try {
    session = await getSessionTerverifikasi()
  } catch (err) {
    if (err instanceof PerangkatLainError) {
      redirect('/login?alasan=perangkat-lain')
    }
    throw err
  }
  if (!session) redirect('/login')
}

export async function setSessionCookie(data: {
  uid: string
  role: Role
  name: string
  /** Wajib diisi pemanggil dan sudah tersimpan di `User.sesiId`. */
  sid: string
}): Promise<void> {
  const token = await signSession({
    uid: data.uid,
    role: data.role as SessionPayload['role'],
    name: data.name,
    sid: data.sid,
  })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  // Bersihkan juga cookie warisan yang tidak bertanda tangan.
  store.delete('userId')
  store.delete('userRole')
}

/** Halaman beranda per role, dipakai login dan proxy. */
export function homeForRole(role: Role | SessionPayload['role']): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'TEACHER':
      return '/teacher'
    case 'DUDI':
      return '/dudi'
    default:
      return '/student'
  }
}
