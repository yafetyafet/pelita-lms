import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

/**
 * Sajikan gambar soal. Semua peran yang sudah login boleh melihat - siswa
 * memerlukannya saat ujian. Id berupa UUID acak dan isinya tidak pernah
 * berubah, jadi aman di-cache lama oleh peramban.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return new NextResponse("Harus login.", { status: 401 })

  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Id tidak sah.", { status: 400 })

  const g = await prisma.gambarSoal.findUnique({
    where: { id },
    select: { data: true, mime: true, ukuran: true },
  })
  if (!g) return new NextResponse("Gambar tidak ditemukan.", { status: 404 })

  return new NextResponse(new Uint8Array(g.data), {
    headers: {
      "Content-Type": g.mime,
      "Content-Length": String(g.ukuran),
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
