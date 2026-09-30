"use server"

import { requireSession } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import type { AksiHasil } from "@/lib/types/aksi"

function gagal(err: unknown) {
  const message = err instanceof Error ? err.message : 'Terjadi kesalahan.'
  return { error: message }
}

export async function getMaterialComments(materialId: string) {
  const session = await requireSession()
  return await prisma.materialComment.findMany({
    where: { materialId },
    include: {
      user: { select: { id: true, name: true, role: true, avatarUrl: true } }
    },
    orderBy: { createdAt: "asc" }
  })
}

export async function addMaterialComment(materialId: string, content: string): Promise<AksiHasil> {
  try {
    const session = await requireSession()
    if (!content.trim()) return { error: "Komentar tidak boleh kosong" }
    
    await prisma.materialComment.create({
      data: {
        materialId,
        content: content.trim(),
        userId: session.uid
      }
    })
    return { success: true }
  } catch (err) {
    return gagal(err)
  }
}
