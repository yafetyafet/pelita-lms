"use client"

import React from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  CheckCircle2, 
  Clock, 
  HeartHandshake,
  Sparkles
} from "lucide-react"

export default function DisciplinePage() {
  const points = 100 // Poin Karakter Awal
  const violations: { date: string; desc: string; deduction: number; teacher: string }[] = []

  const rules = [
    { title: "Keterlambatan Hadir (> 07:15 WIB)", deduction: "-5 Poin" },
    { title: "Meninggalkan Kelas Tanpa Izin Guru", deduction: "-10 Poin" },
    { title: "Ketidaklengkapan Seragam & Atribut", deduction: "-5 Poin" },
    { title: "Kecurangan Akademik / Ujian", deduction: "-25 Poin" },
  ]

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Buku Catatan Disiplin</h2>
            <p className="text-[11px] text-slate-500 font-medium">Penguatan Iman & Karakter Siswa</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          Predikat A
        </span>
      </div>

      {/* Poin Karakter Showcase */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-xl flex flex-col items-center text-center gap-2">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Sisa Poin Disiplin & Karakter
        </span>
        <div className="text-4xl font-black text-emerald-400">
          {points} <span className="text-base font-normal text-slate-400">/ 100</span>
        </div>
        <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
          Catatan bersih tanpa pelanggaran. Pertahankan kedisiplinan dan integritas Anda hingga kelulusan.
        </p>
      </div>

      {/* Catatan Pelanggaran Siswa */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Riwayat Catatan Pelanggaran
        </h3>

        {violations.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center flex flex-col items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">Belum Ada Catatan Pelanggaran</span>
            <p className="text-[11px] text-emerald-700">
              Siswa senantiasa menaati tata tertib sekolah dan tata krama pembelajaran.
            </p>
          </div>
        ) : (
          violations.map((v, i) => (
            <div key={i} className="p-3 bg-red-50 rounded-2xl border border-red-200 flex justify-between">
              <div>
                <h4 className="text-xs font-bold text-red-900">{v.desc}</h4>
                <p className="text-[10px] text-red-700">{v.date} • Dicatat: {v.teacher}</p>
              </div>
              <span className="text-xs font-bold text-red-600">{v.deduction} Poin</span>
            </div>
          ))
        )}
      </div>

      {/* Transparansi Tata Tertib & Bobot Poin */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Pedoman Poin Tata Tertib
        </h3>

        <div className="flex flex-col gap-2">
          {rules.map((r, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">{r.title}</span>
              <span className="font-bold text-rose-600 shrink-0">{r.deduction}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
