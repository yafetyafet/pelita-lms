export type TipePenugasan = "tugas" | "kuis" | "dokumen" | "proyek"

export function deteksiTipeTugas(title: string, description?: string | null): {
  tipe: TipePenugasan
  label: string
  badgeColor: string
} {
  const combined = `${title || ""} ${description || ""}`.toLowerCase()

  if (
    combined.includes("kuis") ||
    combined.includes("quiz") ||
    combined.includes("google.com/forms") ||
    combined.includes("quizizz.com")
  ) {
    return {
      tipe: "kuis",
      label: "Kuis / Latihan Soal",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    }
  }

  if (
    combined.includes("proyek") ||
    combined.includes("project") ||
    combined.includes("praktik") ||
    combined.includes("praktikum")
  ) {
    return {
      tipe: "proyek",
      label: "Tugas Proyek / Praktik",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    }
  }

  if (
    combined.includes("drive.google.com") ||
    combined.includes("docs.google.com") ||
    combined.includes("pdf") ||
    combined.includes("berkas") ||
    combined.includes("makalah") ||
    combined.includes("laporan")
  ) {
    return {
      tipe: "dokumen",
      label: "Tugas Berkas / Dokumen",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
    }
  }

  return {
    tipe: "tugas",
    label: "Tugas Mandiri",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }
}

export function hitungSisaWaktu(dueDateStr: string | Date | null | undefined): {
  status: "aman" | "mendesak" | "lewat" | "tanpa_batas"
  teks: string
  badgeColor: string
} {
  if (!dueDateStr) {
    return {
      status: "tanpa_batas",
      teks: "Tanpa batas waktu",
      badgeColor: "bg-slate-100 text-slate-600",
    }
  }

  const target = new Date(dueDateStr).getTime()
  const sekarang = Date.now()
  const selisih = target - sekarang

  if (selisih <= 0) {
    return {
      status: "lewat",
      teks: "Batas waktu terlewat",
      badgeColor: "bg-red-100 text-red-700 border-red-200",
    }
  }

  const jam = Math.floor(selisih / (1000 * 60 * 60))
  const hari = Math.floor(jam / 24)

  if (hari > 1) {
    return {
      status: "aman",
      teks: `Tersisa ${hari} hari lagi`,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    }
  }

  if (hari === 1) {
    return {
      status: "mendesak",
      teks: "Tersisa 1 hari lagi",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    }
  }

  if (jam >= 1) {
    return {
      status: "mendesak",
      teks: `Tersisa ${jam} jam lagi!`,
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200 font-bold animate-pulse",
    }
  }

  const menit = Math.floor(selisih / (1000 * 60))
  return {
    status: "mendesak",
    teks: `Tersisa ${Math.max(1, menit)} menit lagi!`,
    badgeColor: "bg-red-100 text-red-700 border-red-200 font-bold animate-pulse",
  }
}
