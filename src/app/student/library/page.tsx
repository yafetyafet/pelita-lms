"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  BookMarked, 
  BookOpen, 
  DownloadCloud, 
  Sparkles, 
  ExternalLink,
  Star
} from "lucide-react"

export default function LibraryPage() {
  const [search, setSearch] = useState("")

  const books = [
    {
      title: "Panduan Pengembangan Aplikasi Web Modern Fullstack",
      author: "Pusat Kurikulum Vokasi",
      category: "Rekayasa Perangkat Lunak",
      pages: "184 Hlm",
      downloads: "420x",
      coverColor: "from-blue-600 to-indigo-700",
      desc: "Referensi standar kompetensi keahlian RPL: arsitektur REST, basis data PostgreSQL, dan responsive UI."
    },
    {
      title: "Menjadi Insan Berkarakter: Integrasi Iman & Teknologi",
      author: "Drs. H. Miftahudin, M.Ag",
      category: "Iman & Literasi",
      pages: "120 Hlm",
      downloads: "310x",
      coverColor: "from-emerald-600 to-teal-700",
      desc: "Membentuk pribadi pembelajar yang berakhlak mulia, amanah dalam teknologi, dan menjunjung tinggi kejujuran."
    },
    {
      title: "Algoritma Pemrograman Berorientasi Objek Lanjut",
      author: "Tim Guru Produktif SMK",
      category: "Produktif RPL",
      pages: "210 Hlm",
      downloads: "560x",
      coverColor: "from-amber-600 to-orange-700",
      desc: "Latihan praktikum logika algoritma, desain pola (design patterns), dan pemecahan masalah komputasi."
    }
  ]

  const filtered = books.filter((b) => 
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-4 p-4">
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
            <p className="text-[11px] text-slate-500 font-medium">Koleksi E-Book & Referensi Vokasi</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1">
          <BookMarked className="w-3 h-3 text-amber-600" />
          Open Access
        </span>
      </div>

      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul buku, modul, atau penulis..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      {/* Book List */}
      <div className="flex flex-col gap-3">
        {filtered.map((b, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex gap-3">
              <div className={`w-16 h-24 rounded-2xl bg-gradient-to-tr ${b.coverColor} p-2 text-white flex flex-col justify-between shrink-0 shadow-md`}>
                <BookOpen className="w-5 h-5 text-white/80" />
                <span className="text-[9px] font-black uppercase tracking-wider leading-tight">PELITA E-BOOK</span>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {b.category}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 mt-1 leading-snug">{b.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{b.author}</p>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-1">
                  <span>{b.pages}</span>
                  <span>•</span>
                  <span>Diakses {b.downloads}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {b.desc}
            </p>

            <button className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Baca Online di Browser</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
