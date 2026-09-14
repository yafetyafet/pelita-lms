'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function login(email: string) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return { error: 'Email tidak ditemukan di sistem.' }
  }

  // Set cookies
  const cookieStore = await cookies()
  cookieStore.set('userId', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
  cookieStore.set('userRole', user.role, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })

  // Return success info
  return { success: true, role: user.role }
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

  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentClasses: {
        include: {
          classInfo: true
        }
      }
    }
  })
}
