"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import { getStudentViolations } from "@/app/actions/student"
import { getViolationCategories, type JenisPelanggaran } from "@/app/actions/kesiswaan"
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
} from "lucide-react"

export default function DisciplinePage() {
  const [violations, setViolations] = useState<any[]>([])
  const [rules, setRules] = useState<JenisPelanggaran[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Daftar acuan dibaca dari pengaturan admin, bukan ditulis di kode.
      const [data, jenis] = await Promise.all([
        getStudentViolations(),
        getViolationCategories()
      ])
      setViolations(data)
      setRules(jenis)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat data disiplin..." />
    )
  }

  const totalDeductions = violations.reduce((sum, v) => sum + (v.points || 0), 0)
  const points = Math.max(0, 100 - totalDeductions)
  const predikat = points >= 90 ? "A" : points >= 75 ? "B" : points >= 60 ? "C" : "D"

  // Daftar acuan sebelumnya ditulis mati di sini, terpisah dari dropdown
  // guru — angka yang dilihat siswa bisa berbeda dari yang benar-benar
  // dipakai saat mencatat pelanggaran.

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

        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
          predikat === "A" ? "bg-emerald-100 text-emerald-800" :
          predikat === "B" ? "bg-blue-100 text-blue-800" :
          predikat === "C" ? "bg-amber-100 text-amber-800" :
          "bg-red-100 text-red-800"
        }`}>
          <Sparkles className="w-3 h-3" />
          Predikat {predikat}
        </span>
      </div>

      {/* Poin Karakter Showcase */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 text-white shadow-xl flex flex-col items-center text-center gap-2">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Sisa Poin Disiplin & Karakter
        </span>
        <div className={`text-4xl font-black ${points >= 75 ? "text-emerald-400" : points >= 50 ? "text-amber-400" : "text-red-400"}`}>
          {points} <span className="text-base font-normal text-slate-400">/ 100</span>
        </div>
        <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
          {violations.length === 0
            ? "Catatan bersih tanpa pelanggaran. Pertahankan kedisiplinan dan integritas Anda hingga kelulusan."
            : `Terdapat ${violations.length} catatan pelanggaran. Tingkatkan disiplin untuk memperbaiki predikat Anda.`}
        </p>
      </div>

      {/* Riwayat Pelanggaran */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Riwayat Catatan Pelanggaran ({violations.length})
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
          <div className="flex flex-col gap-2">
            {violations.map((v: any) => (
              <div key={v.id} className="p-3 bg-red-50 rounded-2xl border border-red-200 flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-red-900">{v.description}</h4>
                  <p className="text-[10px] text-red-700 mt-0.5">
                    {new Date(v.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs font-bold text-red-600 shrink-0">-{v.points} Poin</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pedoman Poin */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Pedoman Poin Tata Tertib
        </h3>

        <div className="flex flex-col gap-2">
          {rules.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-2 text-center">
              Daftar poin pelanggaran belum diatur sekolah.
            </p>
          ) : (
            rules.map((r) => (
              <div key={r.nama} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-700 font-medium">
                  {r.nama}
                  {r.kelompok && (
                    <span className="text-slate-400 font-normal"> · {r.kelompok}</span>
                  )}
                </span>
                <span className="font-bold text-rose-600 shrink-0">-{r.poin} Poin</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
