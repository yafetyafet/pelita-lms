"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Award, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Layers
} from "lucide-react"

export default function TeacherProfilePage() {
  const router = useRouter()

  const handleLogout = () => {
    router.push("/login")
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Profil Guru</h2>
            <p className="text-[11px] text-slate-500 font-medium">SMKN 1 Kemangkon</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition flex items-center gap-1 text-xs font-bold"
          title="Keluar"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 p-5 text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-2xl border-2 border-white/30 shadow-lg ring-4 ring-white/10 mb-3">
          KS
        </div>

        <h3 className="text-base font-black text-white">Bpk. Kurniawan S, S.Kom</h3>
        <p className="text-xs text-emerald-200 mt-0.5">NIP: 198204152008011009 • Guru Ahli Pertama</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-3 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Pendidik Tersertifikasi
          </span>
          <span className="text-[10px] font-bold bg-white/20 text-white px-3 py-0.5 rounded-full">
            24 Jam Pelajaran / Pekan
          </span>
        </div>
      </div>

      {/* Data Guru */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5 text-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <User className="w-4 h-4 text-emerald-600" />
          Informasi Akademik Pendidik
        </h3>

        <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between border border-slate-100">
          <span className="text-slate-500">Mata Pelajaran Diampu:</span>
          <span className="font-bold text-slate-900">Pemrograman Web & Basis Data</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between border border-slate-100">
          <span className="text-slate-500">Tugas Tambahan:</span>
          <span className="font-bold text-slate-900">Wali Kelas XII RPL 1</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between border border-slate-100">
          <span className="text-slate-500">Email Sekolah:</span>
          <span className="font-bold text-emerald-600 font-mono text-[11px]">kurniawan@smkn1.sch.id</span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Akun Guru</span>
      </button>
    </div>
  )
}
