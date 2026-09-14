"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  PenTool, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  BookOpen, 
  Send, 
  FileSpreadsheet, 
  Sparkles,
  Users
} from "lucide-react"

export default function TeacherJournalPage() {
  const [journals, setJournals] = useState([
    {
      date: "Senin, 14 Sept 2026",
      class: "XII RPL 1",
      session: "Jam ke 1-3 (07:15 - 09:30)",
      topic: "Menerapkan REST API & State Management pada Frontend",
      summary: "Siswa praktikum membuat custom hook useFetch dan mengintegrasikan koordinat GPS. 34 siswa tuntas, 2 izin.",
      verified: true
    },
    {
      date: "Jumat, 11 Sept 2026",
      class: "XI RPL 2",
      session: "Jam ke 4-6 (10:00 - 11:30)",
      topic: "Desain Relasi Tabel PostgreSQL & Prisma ORM",
      summary: "Pembahasan konsep model User, Class, Attendance. Dilanjutkan uji coba query relasional.",
      verified: true
    }
  ])

  const [formClass, setFormClass] = useState("XII RPL 1")
  const [formTopic, setFormTopic] = useState("")
  const [formSummary, setFormSummary] = useState("")
  const [isSaved, setIsSaved] = useState(false)

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTopic.trim() || !formSummary.trim()) return

    const newEntry = {
      date: "Senin, 14 Sept 2026 (Sesi Baru)",
      class: formClass,
      session: "Jam ke 5-7 (12:30 - 14:45)",
      topic: formTopic,
      summary: formSummary,
      verified: false
    }

    setJournals([newEntry, ...journals])
    setIsSaved(true)
    setTimeout(() => {
      setIsSaved(false)
      setFormTopic("")
      setFormSummary("")
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link 
            href="/teacher"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Jurnal Pembelajaran</h2>
            <p className="text-[11px] text-slate-500 font-medium">Buku Administrasi Mengajar Harian</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          E-Jurnal
        </span>
      </div>

      {/* Form Pengisian Jurnal Cepat */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Form Jurnal Sesi Pembelajaran</h3>
            <p className="text-[10px] text-slate-500">Wajib diisi setiap selesai tatap muka/praktikum</p>
          </div>
        </div>

        <form onSubmit={handleAddJournal} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-600">Rombel / Kelas:</label>
              <select
                value={formClass}
                onChange={(e) => setFormClass(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              >
                <option value="XII RPL 1">XII RPL 1</option>
                <option value="XI RPL 2">XI RPL 2</option>
                <option value="X RPL 1">X RPL 1</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-600">Waktu Pelaksanaan:</label>
              <input
                type="text"
                defaultValue="Hari Ini (Senin, 14 Sept)"
                disabled
                className="px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600">Materi Pokok / KD:</label>
            <input
              type="text"
              value={formTopic}
              onChange={(e) => setFormTopic(e.target.value)}
              placeholder="Contoh: Pembuatan REST API Geotagging Presensi"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600">Ringkasan Kegiatan & Ketercapaian:</label>
            <textarea
              rows={2}
              value={formSummary}
              onChange={(e) => setFormSummary(e.target.value)}
              placeholder="Tuliskan aktivitas praktikum, kendala siswa, dan tindak lanjut..."
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 mt-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simpan Catatan Jurnal</span>
          </button>
        </form>

        {isSaved && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Jurnal mengajar berhasil ditambahkan ke riwayat resmi!</span>
          </div>
        )}
      </div>

      {/* Riwayat Jurnal Terverifikasi */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Riwayat Jurnal Terdata ({journals.length} Sesi)
        </h3>

        <div className="flex flex-col gap-2.5">
          {journals.map((j, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      {j.class}
                    </span>
                    <span className="text-[10px] text-slate-500">{j.session}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1">{j.topic}</h4>
                </div>

                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  {j.verified ? "Terverifikasi Waka" : "Tersimpan Baru"}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/60">
                {j.summary}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span>{j.date}</span>
                <span>Pengampu: Bpk. Kurniawan S, S.Kom</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
