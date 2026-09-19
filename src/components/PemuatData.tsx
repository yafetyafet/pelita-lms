import React from "react"
import Image from "next/image"

/**
 * Penanda "sedang memuat" berlambang PELITA.
 *
 * Sebelumnya tiap halaman menggambar sendiri ikon Loader2 berputar dengan
 * warna yang berbeda-beda per peran - biru di admin, emerald di guru, rose di
 * ujian - sehingga tampilannya tidak pernah sama dan tidak ada kaitannya
 * dengan identitas aplikasi. Komponen ini menyatukannya.
 *
 * Lambangnya diam; yang berputar adalah cincin di sekelilingnya. Lambang yang
 * ikut berputar membuat obornya terbalik dan terbaca aneh.
 */
export function PemuatData({
  pesan = "Memuat data...",
  ukuran = "sedang",
}: {
  pesan?: string
  /** "kecil" untuk di dalam kartu, "sedang" untuk satu halaman penuh. */
  ukuran?: "kecil" | "sedang"
}) {
  const kecil = ukuran === "kecil"
  const sisi = kecil ? 40 : 64
  const cincin = kecil ? "w-14 h-14" : "w-20 h-20"

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-center ${
        kecil ? "py-8" : "py-12"
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Cincin berputar: satu sisi diberi warna agar putarannya terlihat. */}
        <span
          className={`absolute ${cincin} rounded-full border-2 border-slate-200 border-t-blue-600 border-r-amber-500 animate-spin`}
          aria-hidden="true"
        />
        <Image
          src="/logo-pelita.png"
          alt=""
          width={sisi}
          height={sisi}
          priority
          className="relative animate-pulse"
        />
      </div>

      <span className={`${kecil ? "text-[11px]" : "text-xs"} text-slate-500 font-medium`}>
        {pesan}
      </span>
    </div>
  )
}

/**
 * Layar pemuat satu halaman penuh, dipakai saat seluruh isi halaman belum
 * siap - bukan sekadar satu kartu di dalamnya.
 */
export function PemuatHalaman({ pesan = "Memuat data..." }: { pesan?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <PemuatData pesan={pesan} />
    </div>
  )
}
