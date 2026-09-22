"use client"

import React, { useRef, useState } from "react"
import { Image as ImageIcon, Upload, Loader2, X, ClipboardPaste } from "lucide-react"
import { unggahGambar, gambarDariTempel } from "@/lib/unggah-gambar"

/**
 * Kolom gambar soal yang menerima tiga cara: tempel dari papan klip
 * (Ctrl+V di kolom ini), pilih berkas, atau ketik/tempel tautan.
 *
 * Sebelumnya hanya tautan yang diterima; guru harus mengunggah gambar ke
 * Drive dulu, membuatnya publik, lalu menyalin tautannya - dan tautan Drive
 * sering tidak bisa ditampilkan sebagai <img>. Sekarang tangkapan layar
 * bisa langsung ditempel.
 */
export function KolomGambar({
  nilai,
  onUbah,
  kecil,
}: {
  nilai: string
  onUbah: (url: string) => void
  /** Varian ringkas untuk editor soal yang rapat. */
  kecil?: boolean
}) {
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState("")
  const berkasRef = useRef<HTMLInputElement>(null)

  const unggah = async (f: File) => {
    setGalat("")
    setSibuk(true)
    try {
      onUbah(await unggahGambar(f))
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Unggah gagal.")
    } finally {
      setSibuk(false)
    }
  }

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const f = gambarDariTempel(e)
    if (!f) return // biarkan tempel teks (tautan) berjalan normal
    e.preventDefault()
    void unggah(f)
  }

  const teks = kecil ? "text-[10px]" : "text-[11px]"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          value={nilai}
          onChange={(e) => onUbah(e.target.value)}
          onPaste={onPaste}
          disabled={sibuk}
          placeholder="Tempel gambar (Ctrl+V) di sini, atau tautan gambar"
          className={`flex-1 min-w-0 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg ${teks} disabled:opacity-60`}
        />
        <button
          type="button"
          onClick={() => berkasRef.current?.click()}
          disabled={sibuk}
          title="Pilih berkas gambar"
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50 shrink-0"
        >
          {sibuk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        </button>
        {nilai && !sibuk && (
          <button
            type="button"
            onClick={() => onUbah("")}
            title="Hapus gambar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <input
          ref={berkasRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void unggah(f)
            e.target.value = ""
          }}
        />
      </div>

      {sibuk && (
        <p className={`${teks} text-slate-500 flex items-center gap-1`}>
          <ClipboardPaste className="w-3 h-3" /> Mengunggah gambar...
        </p>
      )}
      {galat && <p className={`${teks} text-red-600 font-semibold`}>{galat}</p>}

      {nilai && !sibuk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nilai}
          alt="Pratinjau gambar soal"
          className="max-h-32 rounded-xl border border-slate-200 object-contain self-start bg-white"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = "none"
          }}
        />
      )}
    </div>
  )
}
