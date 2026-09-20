import type { getStudentHome } from '@/app/actions/student'
import type { getTeacherHome } from '@/app/actions/teacher'

/**
 * Bentuk data beranda, diturunkan dari aksi yang menghasilkannya.
 *
 * Diletakkan terpisah karena berkas aksi bertanda `'use server'` dan lebih
 * aman hanya mengekspor fungsi async saja.
 */
export type DataBerandaSiswa = NonNullable<Awaited<ReturnType<typeof getStudentHome>>>
export type DataBerandaGuru = NonNullable<Awaited<ReturnType<typeof getTeacherHome>>>
