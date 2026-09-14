"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Award, 
  Save, 
  CheckCircle2, 
  DownloadCloud, 
  Search, 
  Filter,
  Sparkles
} from "lucide-react"

export default function TeacherGradesPage() {
  const [grades, setGrades] = useState([
    { id: 1, name: "Fajar Pratama", nisn: "0067821943", t1: 90, t2: 95, kuis: 100, pts: 92 },
    { id: 2, name: "Citra Lestari", nisn: "0067821944", t1: 85, t2: 88, kuis: 85, pts: 86 },
    { id: 3, name: "Rafi Ahmad", nisn: "0067821945", t1: 82, t2: 80, kuis: 90, pts: 84 },
    { id: 4, name: "Dimas Anggara", nisn: "0067821946", t1: 88, t2: 92, kuis: 95, pts: 90 },
    { id: 5, name: "Siti Rahmawati", nisn: "0067821947", t1: 94, t2: 90, kuis: 90, pts: 93 },
  ])

  const [saved, setSaved] = useState(false)

  const handleScoreChange = (id: number, field: "t1" | "t2" | "kuis" | "pts", val: string) => {
    const num = parseInt(val) || 0
    setGrades((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: Math.min(100, Math.max(0, num)) } : g))
    )
  }

  const handleSaveAll = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Rekap Penilaian Siswa</h2>
            <p className="text-[11px] text-slate-500 font-medium">XII RPL 1 • Pemrograman Web</p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Simpan</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Seluruh perubahan nilai berhasil disimpan dan disinkronkan ke e-Rapor!</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-800 to-slate-900 p-4 text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-emerald-200 uppercase">Standar Ketuntasan (KKTP)</span>
          <h3 className="text-base font-black text-white mt-0.5">Nilai Minimum: 75</h3>
          <p className="text-[11px] text-emerald-100/80 mt-0.5">100% Siswa Tuntas Semester Ganjil</p>
        </div>
        <Award className="w-10 h-10 text-emerald-300/80 shrink-0" />
      </div>

      {/* Tabel Penilaian Interaktif */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
            Daftar Nilai Formatif & Sumatif
          </h3>
          <span className="text-[10px] font-semibold text-slate-400">Edit nilai langsung di kolom</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {grades.map((item) => {
            // Hitung rata-rata: (t1 + t2 + kuis + pts) / 4
            const avg = Math.round((item.t1 + item.t2 + item.kuis + item.pts) / 4)

            return (
              <div 
                key={item.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-400">NISN: {item.nisn}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Rapor Akhir</span>
                    <span className="text-sm font-black text-emerald-600">{avg}</span>
                  </div>
                </div>

                {/* Score Input Boxes */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-200/60 text-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-slate-500 mb-0.5">Tugas 1</span>
                    <input
                      type="number"
                      value={item.t1}
                      onChange={(e) => handleScoreChange(item.id, "t1", e.target.value)}
                      className="w-full text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-slate-500 mb-0.5">Tugas 2</span>
                    <input
                      type="number"
                      value={item.t2}
                      onChange={(e) => handleScoreChange(item.id, "t2", e.target.value)}
                      className="w-full text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-slate-500 mb-0.5">Kuis</span>
                    <input
                      type="number"
                      value={item.kuis}
                      onChange={(e) => handleScoreChange(item.id, "kuis", e.target.value)}
                      className="w-full text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-rose-600 mb-0.5">PTS CBT</span>
                    <input
                      type="number"
                      value={item.pts}
                      onChange={(e) => handleScoreChange(item.id, "pts", e.target.value)}
                      className="w-full text-center py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-700 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
