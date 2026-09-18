"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getCurrentUser, logout } from "@/app/actions/auth"
import { GantiSandiForm } from "@/components/GantiSandiForm"
import { 
  ArrowLeft, 
  User, 
  LogOut, 
  CheckCircle2,
  Smartphone,
  Loader2
} from "lucide-react"

export default function StudentProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      setCurrentUser(user)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-xs text-slate-500">Memuat profil...</span>
      </div>
    )
  }

  const initials = currentUser?.name
    ? currentUser.name.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "S"

  const className = currentUser?.studentClasses?.[0]?.classInfo?.name || "Belum Ada Rombel"
  const waliKelas = currentUser?.studentClasses?.[0]?.classInfo?.wali?.name || "Belum ditentukan"

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Profil & Akun Siswa</h2>
            <p className="text-[11px] text-slate-500 font-medium">SMKN 1 Kemangkon</p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition flex items-center gap-1 text-xs font-bold"
          title="Keluar dari Akun"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950 p-5 text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-2xl border-2 border-white/30 shadow-lg ring-4 ring-white/10 mb-3">
          {initials}
        </div>

        <h3 className="text-base font-black text-white">{currentUser?.name || "Siswa"}</h3>
        <p className="text-xs text-blue-200 mt-0.5">@{currentUser?.username || "-"}</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-3 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Siswa Aktif
          </span>
          <span className="text-[10px] font-bold bg-blue-500/40 text-white border border-white/20 px-3 py-0.5 rounded-full">
            {className}
          </span>
        </div>
      </div>

      {/* Biodata */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4 text-blue-600" />
          Data Siswa
        </h3>

        <div className="flex flex-col gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Nama Lengkap:</span>
            <span className="font-bold text-slate-900">{currentUser?.name || "-"}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Username:</span>
            <span className="font-bold text-blue-600 font-mono text-[11px]">@{currentUser?.username || "-"}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Kelas / Rombel:</span>
            <span className="font-bold text-slate-900">{className}</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Wali Kelas:</span>
            <span className="font-bold text-slate-900">{waliKelas}</span>
          </div>
        </div>
      </div>

      <GantiSandiForm accent="blue" />

      {/* Info Versi */}
      <div className="p-3 bg-slate-100 rounded-2xl flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          PELITA Mobile PWA
        </span>
        <span>Build {new Date().toISOString().slice(0, 10)}</span>
      </div>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition flex items-center justify-center gap-1.5"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Akun Siswa</span>
      </button>
    </div>
  )
}
