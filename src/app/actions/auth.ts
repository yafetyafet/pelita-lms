'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function login(username: string, password?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return { error: 'Username tidak ditemukan di sistem.' }
    }

    if (password && user.password !== password) {
      return { error: 'Password salah.' }
    }

    // Set cookies
    const cookieStore = await cookies()
    cookieStore.set('userId', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
    cookieStore.set('userRole', user.role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })

    return { success: true, role: user.role }
  } catch (err: any) {
    console.error("Login Error:", err)
    return { error: `Database Error: ${err.message || 'Terjadi kesalahan sistem'}` }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('userId')
  cookieStore.delete('userRole')
  redirect('/login')
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) return null

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        avatarUrl: true,
        waliClasses: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        studentClasses: {
          include: {
            classInfo: true
          }
        },
        teacherClasses: {
          include: {
            classInfo: true,
            subject: true
          }
        }
      }
    })
  } catch (err) {
    console.error("Failed to get current user:", err)
    return null
  }
}
