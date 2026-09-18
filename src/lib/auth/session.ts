/**
 * Pembacaan sesi di sisi server (Server Action & Server Component).
 *
 * Semua server action wajib lewat helper di sini, jangan lagi membaca
 * `cookies().get('userId')` langsung. Bug yang membuat seluruh fitur guru
 * mati berasal dari dua nama cookie yang tidak sinkron (`role` vs
 * `userRole`); satu sumber kebenaran mencegah hal itu terulang.
 */

import 'server-only'

import { cookies } from 'next/headers'

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

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}

/**
 * Sesi wajib ada dan role-nya termasuk salah satu `roles`.
 * Kalau `roles` kosong, cukup sudah login.
 */
export async function requireSession(
  ...roles: Role[]
): Promise<SessionPayload> {
  const session = await getSession()
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

export async function setSessionCookie(data: {
  uid: string
  role: Role
  name: string
}): Promise<void> {
  const token = await signSession({
    uid: data.uid,
    role: data.role as SessionPayload['role'],
    name: data.name,
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
