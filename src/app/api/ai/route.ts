import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { optionalSession } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  try {
    const session = await optionalSession('TEACHER', 'ADMIN')
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()
    if (!data.mapel || !data.kelas || !data.topik) {
      return new NextResponse("Semua kolom wajib (Mapel, Kelas, Topik) harus diisi.", { status: 400 })
    }

    // Ambil pengaturan AI dari database (AppSetting)
    const endpointSetting = await prisma.appSetting.findUnique({ where: { key: "AI_ENDPOINT" } })
    const modelSetting = await prisma.appSetting.findUnique({ where: { key: "AI_MODEL" } })
    const apiKeySetting = await prisma.appSetting.findUnique({ where: { key: "AI_API_KEY" } })

    let endpoint = (endpointSetting?.value || "http://192.100.1.10:20128/v1/chat/completions").trim()
    if (endpoint.endsWith('/v1') || endpoint.endsWith('/v1/')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions'
    } else if (!endpoint.endsWith('/chat/completions')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions'
    }

    const modelId = (modelSetting?.value || "oc/muse-spark-1.3-contributor-free").trim()
    const apiKey = (apiKeySetting?.value || "sk-d7c04fe4ad11505d-qhe2co-0cbda760").trim()

    const systemPrompt = `Anda adalah asisten ahli pendidikan di Indonesia (Guru Penggerak). Buatlah Modul Ajar (Perangkat Pembelajaran) sesuai regulasi Kurikulum Merdeka terbaru (Kepmendikbudristek No. 56/M/2022 / BSKAP No. 033/H/KR/2022 atau yang lebih baru).

Wajib mencakup komponen minimum:
1. INFORMASI UMUM (Identitas, Kompetensi Awal, Profil Pelajar Pancasila, Sarpras, Target Peserta Didik, Model Pembelajaran)
2. KOMPONEN INTI (Tujuan Pembelajaran, Pemahaman Bermakna, Pertanyaan Pemantik, Kegiatan Pembelajaran (Pendahuluan, Inti, Penutup), Asesmen, Pengayaan & Remedial)
3. LAMPIRAN (Lembar Kerja Peserta Didik singkat, Bahan Bacaan, Glosarium, Daftar Pustaka).

Berikan output secara langsung dalam format Markdown yang rapi (gunakan heading #, ##, bold, list, dsb). Jangan tambahkan pembukaan/penutup obrolan.`

    const userPrompt = `Tolong buatkan Modul Ajar Kurikulum Merdeka dengan spesifikasi berikut:
- Mata Pelajaran: ${data.mapel}
- Fase/Kelas: ${data.kelas}
- Topik/Materi Pokok: ${data.topik}
- Alokasi Waktu: ${data.alokasi}
${data.catatan ? `- Catatan Tambahan/Fokus: ${data.catatan}` : ''}`

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: true
      })
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error("AI Error:", res.status, errBody)
      return new NextResponse(`Gagal menghubungi AI. Status HTTP ${res.status}. ${errBody.substring(0, 100)}`, { status: 500 })
    }

    // Stream the response back to the client directly
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    })

  } catch (e: any) {
    console.error("AI Fetch error:", e)
    return new NextResponse(e.message || "Gagal menghubungi endpoint AI.", { status: 500 })
  }
}
