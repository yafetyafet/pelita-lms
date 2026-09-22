import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth/session"

/**
 * Unggah gambar soal dari papan klip (POST multipart, field "file").
 *
 * Route handler, bukan server action, karena server action dibatasi 1 MB
 * per permintaan - tangkapan layar dari HP sering lebih besar dari itu.
 * Proxy sengaja tidak menjaga /api, jadi pemeriksaan sesi dilakukan di sini.
 */

const MAKS_BYTE = 8 * 1024 * 1024
const MIME_DITERIMA = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])
const LEBAR_MAKS = 1600

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Hanya guru dan admin yang boleh mengunggah gambar." }, { status: 403 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Permintaan tidak berisi berkas." }, { status: 400 })
  }

  const berkas = form.get("file")
  if (!(berkas instanceof File)) {
    return NextResponse.json({ error: "Berkas gambar tidak ditemukan." }, { status: 400 })
  }
  if (!MIME_DITERIMA.has(berkas.type)) {
    return NextResponse.json({ error: `Jenis ${berkas.type || "tidak dikenal"} tidak didukung. Pakai PNG, JPG, WebP, atau GIF.` }, { status: 415 })
  }
  if (berkas.size > MAKS_BYTE) {
    return NextResponse.json({ error: "Gambar terlalu besar (maks 8 MB)." }, { status: 413 })
  }

  const asli = Buffer.from(await berkas.arrayBuffer())

  // Perkecil dan ubah ke WebP supaya basis data tidak membengkak: tangkapan
  // layar 2 MB biasanya menjadi 100-200 KB. Kalau sharp gagal - misalnya
  // binari platform tidak tersedia - simpan apa adanya, jangan gagalkan.
  let data = asli
  let mime = berkas.type
  let lebar: number | null = null
  let tinggi: number | null = null
  try {
    const sharp = (await import("sharp")).default
    const gambar = sharp(asli, { animated: mime === "image/gif" })
    const meta = await gambar.metadata()
    const keluaran =
      mime === "image/gif"
        ? gambar
        : gambar.resize({ width: LEBAR_MAKS, withoutEnlargement: true }).webp({ quality: 82 })
    data = Buffer.from(await keluaran.toBuffer())
    if (mime !== "image/gif") mime = "image/webp"
    const m2 = await sharp(data).metadata()
    lebar = m2.width ?? meta.width ?? null
    tinggi = m2.height ?? meta.height ?? null
  } catch (err) {
    console.warn("[gambar] pemrosesan gagal, simpan asli:", err instanceof Error ? err.message : err)
  }

  const simpan = await prisma.gambarSoal.create({
    data: { data, mime, ukuran: data.length, lebar, tinggi, uploaderId: session.uid },
    select: { id: true, ukuran: true, lebar: true, tinggi: true, mime: true },
  })

  return NextResponse.json({
    url: `/api/gambar/${simpan.id}`,
    ukuran: simpan.ukuran,
    lebar: simpan.lebar,
    tinggi: simpan.tinggi,
    mime: simpan.mime,
  })
}
