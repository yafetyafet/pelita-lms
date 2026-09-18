/**
 * Hashing kata sandi dengan scrypt dari `node:crypto`.
 *
 * Basis data lama menyimpan kata sandi apa adanya (plaintext) dan
 * membandingkannya dengan `===`. Agar akun yang sudah ada tidak terkunci,
 * `verifyPassword` masih menerima nilai plaintext lama, tetapi
 * `needsUpgrade` menandainya supaya `login()` langsung menuliskan ulang
 * kata sandi dalam bentuk hash pada login berikutnya yang berhasil.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>

const PREFIX = 'scrypt$'
const KEYLEN = 64

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(plain, salt, KEYLEN)
  return `${PREFIX}${salt.toString('hex')}$${key.toString('hex')}`
}

export function isHashed(stored: string): boolean {
  return stored.startsWith(PREFIX)
}

/**
 * Kata sandi yang masih plaintext harus di-hash ulang setelah login
 * berhasil.
 */
export function needsUpgrade(stored: string): boolean {
  return !isHashed(stored)
}

export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  if (!stored) return false

  if (!isHashed(stored)) {
    // Akun warisan: bandingkan plaintext, tapi tetap waktu-konstan.
    const a = Buffer.from(plain)
    const b = Buffer.from(stored)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  const [, saltHex, keyHex] = stored.split('$')
  if (!saltHex || !keyHex) return false

  try {
    const expected = Buffer.from(keyHex, 'hex')
    const actual = await scrypt(plain, Buffer.from(saltHex, 'hex'), expected.length)
    return timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}
