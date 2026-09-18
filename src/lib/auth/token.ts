/**
 * Token sesi bertanda tangan (HMAC-SHA256).
 *
 * Modul ini sengaja HANYA memakai Web Crypto supaya bisa dipanggil dari
 * `proxy.ts` yang berjalan di Edge Runtime — Prisma dan `node:crypto`
 * tidak tersedia di sana. Jangan menambah impor Node di file ini.
 *
 * Sebelumnya aplikasi menyimpan `userId` dan `userRole` sebagai cookie
 * mentah. Cookie mentah bisa dipalsukan dari sisi klien (server tidak bisa
 * membedakan cookie httpOnly buatannya sendiri dengan cookie bernama sama
 * yang dibuat lewat `document.cookie`), sehingga siapa pun bisa mengaku
 * sebagai ADMIN. Karena itu isi sesi kini ditandatangani.
 */

export const SESSION_COOKIE = 'pelita_session'

/** Umur sesi: 7 hari. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export type SessionPayload = {
  /** User.id */
  uid: string
  /** User.role */
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'DUDI'
  /** Nama tampilan, supaya header tidak perlu query DB. */
  name: string
  /** Kedaluwarsa, epoch detik. */
  exp: number
}

function secretString(): string {
  const explicit = process.env.SESSION_SECRET
  if (explicit && explicit.length >= 16) return explicit

  // Fallback supaya aplikasi yang sudah ter-deploy tidak langsung mati saat
  // env baru belum diisi. DATABASE_URL memuat kata sandi database sehingga
  // tidak dapat ditebak publik, tapi ini tetap bukan pengganti
  // SESSION_SECRET yang sebenarnya — lihat .env.example.
  const fallback = process.env.DATABASE_URL
  if (fallback) return `pelita-fallback:${fallback}`

  throw new Error(
    'SESSION_SECRET (atau DATABASE_URL) wajib diset untuk menandatangani sesi.'
  )
}

let cachedKey: Promise<CryptoKey> | null = null

function hmacKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secretString()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    )
  }
  return cachedKey
}

function toBase64Url(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/')
  const s = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i)
  return bytes
}

/** Bandingkan dua byte array dalam waktu konstan. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function signSession(
  data: Omit<SessionPayload, 'exp'>,
  maxAgeSeconds = SESSION_MAX_AGE
): Promise<string> {
  const payload: SessionPayload = {
    ...data,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  }
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(),
    new TextEncoder().encode(body)
  )
  return `${body}.${toBase64Url(new Uint8Array(sig))}`
}

/**
 * Verifikasi token. Mengembalikan `null` untuk token rusak, tanda tangan
 * tidak cocok, atau sudah kedaluwarsa — pemanggil memperlakukan `null`
 * sebagai "belum login".
 */
export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null

  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null

  const body = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  try {
    const expected = new Uint8Array(
      await crypto.subtle.sign(
        'HMAC',
        await hmacKey(),
        new TextEncoder().encode(body)
      )
    )
    if (!sameBytes(expected, fromBase64Url(sig))) return null

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body))
    ) as SessionPayload

    if (!payload?.uid || !payload?.role) return null
    if (typeof payload.exp !== 'number') return null
    if (payload.exp * 1000 < Date.now()) return null

    return payload
  } catch {
    return null
  }
}
