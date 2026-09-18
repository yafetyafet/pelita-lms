"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Search, BookMarked, BookOpen, DownloadCloud, Sparkles, ExternalLink, Loader2
} from "lucide-react"
import { getLibraryBooks, recordBookDownload } from "@/app/actions/student"

export default function LibraryPage() {
  const [search, setSearch] = useState("")
  const [books, setBooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [membuka, setMembuka] = useState<string | null>(null)
  const [pesan, setPesan] = useState("")

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const data = await getLibraryBooks()
      setBooks(data)
      setIsLoading(false)
    }
    loadData()
  }, [])

  /**
   * Buka berkas buku dan naikkan penghitung unduhan. Tombol ini sebelumnya
   * tidak melakukan apa pun, dan kolom `downloads` selalu bernilai 0.
   */
  const buka = async (id: string) => {
    setPesan("")
    setMembuka(id)
    const res = await recordBookDownload(id)
    setMembuka(null)

    if (res.error) {
      setPesan(res.error)
      return
    }
    if (!res.fileUrl) {
      setPesan("Buku ini belum dilengkapi berkas digital oleh admin.")
      setTimeout(() => setPesan(""), 4000)
      return
    }

    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, downloads: res.downloads } : b))
    )
    window.open(res.fileUrl, "_blank", "noopener,noreferrer")
  }

  const filtered = books.filter((b) => 
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link 
            href="/student"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Perpustakaan Digital</h2>
            <p className="text-[11px] text-slate-500 font-medium">Buku teks & referensi literasi</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
          <BookMarked className="w-3 h-3" /> {books.length} Buku
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul buku, penulis, atau kategori..."
          className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      {pesan && (
        <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {pesan}
        </p>
      )}

      {/* Book List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
            <span className="text-sm font-bold text-slate-600">Memuat Katalog Buku...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3">
            <BookOpen className="w-12 h-12 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada buku ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-xs">Buku yang kamu cari tidak tersedia di perpustakaan digital ini.</p>
          </div>
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex gap-4 hover:shadow-md transition group">
              {/* Cover Mockup */}
              <div className={`w-20 sm:w-24 shrink-0 rounded-2xl bg-gradient-to-br ${b.coverColor || "from-blue-600 to-indigo-700"} flex flex-col justify-between p-2.5 shadow-inner relative overflow-hidden`}>
                <div className="absolute -right-4 -top-4 w-12 h-12 rounded-full bg-white/10 blur-xl"></div>
                <Sparkles className="w-4 h-4 text-white/50" />
                <div>
                  <h4 className="text-[10px] font-black text-white leading-tight line-clamp-3">{b.title}</h4>
                  <div className="w-full h-0.5 bg-white/20 mt-2 rounded-full"></div>
                </div>
              </div>

              {/* Detail */}
              <div className="flex flex-col justify-between flex-1 py-1">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {b.category}
                    </span>
                    {b.year && (
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded-md">
                        {b.year}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">{b.title}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Oleh: {b.author}</p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {b.pages || "?"} Hlm</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1"><DownloadCloud className="w-3 h-3" /> {b.downloads}x</span>
                  </div>
                  
                  <button
                    onClick={() => buka(b.id)}
                    disabled={membuka === b.id}
                    title={b.fileUrl ? "Buka buku" : "Berkas belum tersedia"}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition border ${
                      b.fileUrl
                        ? "bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 border-slate-100 group-hover:border-blue-100"
                        : "bg-slate-50 text-slate-300 border-slate-100"
                    }`}
                  >
                    {membuka === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
