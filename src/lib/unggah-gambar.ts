/**
 * Pembantu sisi klien untuk mengunggah gambar dari papan klip / berkas.
 * Mengembalikan URL yang bisa langsung dipakai sebagai `imageUrl` soal.
 */
export async function unggahGambar(berkas: File): Promise<string> {
  const form = new FormData()
  form.append("file", berkas, berkas.name || "gambar.png")
  const res = await fetch("/api/gambar", { method: "POST", body: form })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.url) {
    throw new Error(json.error || `Unggah gagal (HTTP ${res.status}).`)
  }
  return json.url as string
}

/** Ambil berkas gambar pertama dari peristiwa tempel, kalau ada. */
export function gambarDariTempel(e: { clipboardData: DataTransfer | null }): File | null {
  const data = e.clipboardData
  if (!data) return null
  for (const item of Array.from(data.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const f = item.getAsFile()
      if (f) return f
    }
  }
  return null
}
