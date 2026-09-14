"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, Key, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react"

export default function AdminUjianPage() {
  const [token, setToken] = useState("PTS2026")
  const [isGenerated, setIsGenerated] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const generateNewToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let res = "CBT-"
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setToken(res)
    setToast("Token CBT baru berhasil di-generate!")
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1 mb-2">
        <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">Jadwal & Token Ujian CBT / PTS</h2>
          <p className="text-[11px] text-slate-500 font-medium">Manajemen otorisasi ruang ujian CBT dan token akses siswa</p>
        </div>
      </div>

      {/* Active Token Card */}
      <div className="bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-2 py-0.5 rounded-md">
            Token Akses Sesi Ujian Aktif
          </span>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-emerald-300 drop-shadow">
              {token}
            </span>
          </div>
          <p className="text-[11px] text-purple-200/90 mt-1">
            Bagikan kode token ini ke pengawas ruang untuk dibuka di HP siswa sebelum ujian dimulai.
          </p>
        </div>

        <button 
          onClick={generateNewToken}
          className="bg-white text-purple-900 hover:bg-purple-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-purple-600" />
          <span>Generate Token Baru</span>
        </button>
      </div>

      {/* Status Ruang Ujian */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span>Konfigurasi Ruang & Jadwal CBT</span>
        </h3>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Mode Anti-Curang (Safe Exam Browser / Tab Lock)</strong>
            <span>
              Saat token aktif dimasukkan oleh siswa, sistem ujian otomatis mengunci layar agar tidak dapat berpindah aplikasi atau membuka peramban lain.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
