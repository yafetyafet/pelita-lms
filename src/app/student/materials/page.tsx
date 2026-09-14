"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Search, 
  Video, 
  FileText, 
  ExternalLink, 
  Play, 
  MessageSquare, 
  Send, 
  Sparkles,
  BookOpen,
  Share2,
  Clock,
  Eye
} from "lucide-react"

export default function MaterialsPage() {
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>("mat-1")
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<{ author: string; role: string; time: string; text: string }[]>([
    { author: "Bpk. Kurniawan S, S.Kom", role: "Guru", time: "08:30 WIB", text: "Silakan tonton video pengenalan Next.js App Router sebelum memulai praktikum sesi 2." },
    { author: "Fajar Pratama", role: "Siswa", time: "09:05 WIB", text: "Pak, apakah materi deployment Vercel juga akan diujikan pada PTS nanti?" },
    { author: "Bpk. Kurniawan S, S.Kom", role: "Guru", time: "09:12 WIB", text: "Betul Fajar, konsep dasar deployment cloud gratis dan koneksi Supabase akan masuk ujian." }
  ])

  const categories = ["Semua", "Produktif RPL", "Basis Data", "Pendidikan Agama", "Matematika"]

  const materials = [
    {
      id: "mat-1",
      category: "Produktif RPL",
      title: "04. Arsitektur Komponen & State Management Modern",
      subject: "Pemrograman Web & Bergerak",
      teacher: "Bpk. Kurniawan S, S.Kom",
      type: "video_embed",
      embedType: "youtube",
      // Menggunakan link embed resmi Next.js tutorial
      embedUrl: "https://www.youtube.com/embed/Sklc_fQBmcs",
      duration: "18 Menit",
      desc: "Mempelajari pemisahan komponen Server vs Client Component di Next.js 15, pengelolaan hook useState dan useEffect, serta tips optimasi performa web mobile.",
      tags: ["React", "Next.js", "State"]
    },
    {
      id: "mat-2",
      category: "Basis Data",
      title: "03. Desain Skema Relasional PostgreSQL & Supabase",
      subject: "Basis Data Lanjut",
      teacher: "Ibu Nurul Hidayah, S.T",
      type: "drive_embed",
      embedType: "drive",
      embedUrl: "https://drive.google.com/viewerng/viewer?embedded=true&url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      duration: "Modul PDF 12 Hlm",
      desc: "Panduan lengkap mendesain tabel master dan tabel transaksi, foreign key cascade, indexing, serta pengaturan Row Level Security (RLS) di Supabase.",
      tags: ["PostgreSQL", "Supabase", "Prisma"]
    },
    {
      id: "mat-3",
      category: "Pendidikan Agama",
      title: "02. Etika Digital & Kejujuran Akademik dalam Islam",
      subject: "Pendidikan Agama Islam",
      teacher: "Bpk. M. Sholeh, M.Pd.I",
      type: "doc",
      embedType: "article",
      embedUrl: "",
      duration: "Ringkasan Materi",
      desc: "Menjaga integritas diri, menghindari plagiarisme, dan menumbuhkan etika santun dalam berkomunikasi di ruang maya dan platform LMS.",
      tags: ["Karakter", "Iman", "Integritas"]
    }
  ]

  const activeMaterial = materials.find((m) => m.id === activeMaterialId) || materials[0]

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setComments((prev) => [
      ...prev,
      { author: "Fajar Pratama", role: "Siswa", time: "Baru saja", text: commentText }
    ])
    setCommentText("")
  }

  const filteredMaterials = selectedCategory === "Semua" 
    ? materials 
    : materials.filter((m) => m.category === selectedCategory)

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link 
            href="/student"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Materi Pembelajaran</h2>
            <p className="text-[11px] text-slate-500 font-medium">Embed YouTube & Google Drive Terpadu</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-600" />
          Hemat Kuota
        </span>
      </div>

      {/* Filter Kategori Mapel */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Embed Player Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col">
        {/* Video / Document Embed Viewport */}
        <div className="w-full bg-slate-950 relative aspect-video flex items-center justify-center text-white">
          {activeMaterial.embedType === "youtube" ? (
            <iframe
              className="w-full h-full"
              src={activeMaterial.embedUrl}
              title={activeMaterial.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : activeMaterial.embedType === "drive" ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900">
              <FileText className="w-10 h-10 text-blue-400 mb-2" />
              <p className="text-xs font-bold text-white mb-1">Pratinjau Modul Google Drive (PDF)</p>
              <p className="text-[10px] text-slate-400 mb-3 max-w-xs">
                Dokumen tersimpan aman di akun Google Workspace Sekolah tanpa membebani server LMS.
              </p>
              <a
                href={activeMaterial.embedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <span>Buka Dokumen di Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-teal-900 to-slate-900">
              <BookOpen className="w-10 h-10 text-emerald-400 mb-2" />
              <p className="text-xs font-bold text-white mb-1">Ringkasan Artikel & Nilai Karakter</p>
              <p className="text-[11px] text-emerald-200 max-w-xs">
                {activeMaterial.desc}
              </p>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-4 flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-md">
                {activeMaterial.subject}
              </span>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" /> {activeMaterial.duration}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              {activeMaterial.title}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Pengampu: {activeMaterial.teacher}</p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {activeMaterial.desc}
          </p>

          {/* Diskusi Tanya Jawab Materi */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Ruang Diskusi & Tanya Guru ({comments.length})
            </h4>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-[11px]">{c.author}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        c.role === "Guru" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {c.role}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{c.text}</p>
                </div>
              ))}
            </div>

            {/* Input Komentar Baru */}
            <form onSubmit={handleSendComment} className="flex gap-2 mt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Tulis pertanyaan seputar materi..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Daftar Materi Lainnya */}
      <div className="flex flex-col gap-2.5 mt-1">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 px-1">
          Daftar Modul Lainnya
        </h3>

        <div className="flex flex-col gap-2">
          {filteredMaterials.map((mat) => {
            const isCurrent = mat.id === activeMaterialId
            return (
              <button
                key={mat.id}
                onClick={() => setActiveMaterialId(mat.id)}
                className={`p-3 rounded-2xl text-left transition flex items-center justify-between border ${
                  isCurrent
                    ? "bg-blue-50/70 border-blue-400 shadow-sm"
                    : "bg-white border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    mat.embedType === "youtube"
                      ? "bg-red-100 text-red-600"
                      : mat.embedType === "drive"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-emerald-100 text-emerald-600"
                  }`}>
                    {mat.embedType === "youtube" ? <Play className="w-4 h-4 fill-red-600" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{mat.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{mat.subject} • {mat.duration}</p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                    Aktif
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
