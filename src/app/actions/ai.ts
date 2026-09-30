"use server"

import { requireSession } from "@/lib/auth/session"

export async function generateModulAjar(data: {
  mapel: string
  kelas: string
  topik: string
  alokasi: string
  catatan?: string
  endpoint: string
  modelId: string
  apiKey: string
}) {
  await requireSession('TEACHER', 'ADMIN')
  
  if (!data.mapel || !data.kelas || !data.topik) {
    return { error: "Semua kolom wajib (Mapel, Kelas, Topik) harus diisi." }
  }

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

  try {
    const res = await fetch(data.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${data.apiKey}`
      },
      body: JSON.stringify({
        model: data.modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error("AI Error:", errBody)
      return { error: `Gagal menghubungi AI. Status HTTP ${res.status}` }
    }

    const result = await res.json()
    const content = result.choices?.[0]?.message?.content || ""
    if (!content) {
      return { error: "AI tidak mengembalikan teks konten apa pun." }
    }

    return { content }

  } catch (e: any) {
    console.error("AI Fetch error:", e)
    return { error: e.message || "Gagal menghubungi endpoint AI." }
  }
}
