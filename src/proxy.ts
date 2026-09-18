/**
 * Penjaga rute berbasis role.
 *
 * Di Next.js 16 `middleware.ts` berganti nama menjadi `proxy.ts`
 * (fungsinya sama). Sebelumnya proyek ini sama sekali tidak punya penjaga
 * rute, sehingga `/admin` bisa dibuka siapa pun tanpa login.
 *
 * Ini hanya pemeriksaan optimistis: token diverifikasi tanda tangannya,
 * tanpa menyentuh basis data (Prisma tidak jalan di Edge Runtime).
 * Otorisasi sebenarnya tetap dilakukan tiap server action lewat
 * `requireSession()` — jangan pernah menjadikan file ini satu-satunya
 * lapisan keamanan.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE, verifySession } from '@/lib/auth/token'

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'DUDI'

/** Prefix rute → role yang diizinkan. Urutan terpanjang diuji lebih dulu. */
const GUARDED: Array<{ prefix: string; allow: Role[] }> = [
  { prefix: '/admin', allow: ['ADMIN'] },
  { prefix: '/teacher', allow: ['TEACHER', 'ADMIN'] },
  { prefix: '/student', allow: ['STUDENT', 'ADMIN'] },
  { prefix: '/dudi', allow: ['DUDI', 'ADMIN'] },
]

function homeFor(role: Role): string {
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

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value
  )

  // Sudah login tapi membuka /login → antar ke berandanya.
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL(homeFor(session.role), request.url))
    }
    return NextResponse.next()
  }

  // Akar situs: arahkan sesuai role, atau ke login.
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(session ? homeFor(session.role) : '/login', request.url)
    )
  }

  const guard = GUARDED.find(
    (g) => pathname === g.prefix || pathname.startsWith(`${g.prefix}/`)
  )
  if (!guard) return NextResponse.next()

  if (!session) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(login)
  }

  if (!guard.allow.includes(session.role)) {
    // Role salah bukan "belum login" — jangan kirim ke halaman login,
    // nanti pengguna terjebak di lingkaran redirect.
    return NextResponse.redirect(new URL(homeFor(session.role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Jalankan untuk semua rute halaman, kecuali aset internal Next,
     * berkas statis PWA, dan route handler /api (yang menjaga dirinya
     * sendiri lewat requireSession()).
     */
    '/((?!api/|_next/|sw\\.js|manifest\\.json|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml|webmanifest)$).*)',
  ],
}
