"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  CheckCircle2,
  Calendar,
  Award
} from "lucide-react"

export default function StudentProfilePage() {
  const router = useRouter()
  const [savedPassword, setSavedPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const handleLogout = () => {
    router.push("/login")
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedPassword(true)
    setTimeout(() => {
      setSavedPassword(false)
      setShowPasswordForm(false)
    }, 1500)
  }

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
          onClick={handleLogout}
          className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition flex items-center gap-1 text-xs font-bold"
          title="Keluar dari Akun"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>

      {/* Profile Card Showcase */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950 p-5 text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-2xl border-2 border-white/30 shadow-lg ring-4 ring-white/10 mb-3">
          FP
        </div>

        <h3 className="text-base font-black text-white">Fajar Pratama</h3>
        <p className="text-xs text-blue-200 mt-0.5">NISN: 0067821943 • NIK: 3303120409080001</p>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-3 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Siswa Aktif
          </span>
          <span className="text-[10px] font-bold bg-blue-500/40 text-white border border-white/20 px-3 py-0.5 rounded-full">
            XII RPL 1
          </span>
        </div>
      </div>

      {/* Biodata Lengkap */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <User className="w-4 h-4 text-blue-600" />
          Data Induk Siswa
        </h3>

        <div className="flex flex-col gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Kompetensi Keahlian:</span>
            <span className="font-bold text-slate-900">Rekayasa Perangkat Lunak (RPL)</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Wali Kelas:</span>
            <span className="font-bold text-slate-900">Bpk. Kurniawan S, S.Kom</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Email Akun Belajar:</span>
            <span className="font-bold text-blue-600 font-mono text-[11px]">fajar.0067@smkn1.sch.id</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Tempat, Tanggal Lahir:</span>
            <span className="font-bold text-slate-900">Purbalingga, 14 Mei 2008</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
            <span className="text-slate-500">Nama Orang Tua / Wali:</span>
            <span className="font-bold text-slate-900">Bpk. Sugeng Pratama</span>
          </div>
        </div>
      </div>

      {/* Keamanan & Ubah Password */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Keamanan Akun</h3>
              <p className="text-[10px] text-slate-500">Kelola kata sandi akun LMS</p>
            </div>
          </div>

          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            {showPasswordForm ? "Tutup Form" : "Ubah Sandi"}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-2 pt-1 border-t border-slate-100">
            <input
              type="password"
              placeholder="Kata sandi lama"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              required
            />
            <input
              type="password"
              placeholder="Kata sandi baru (min. 6 karakter)"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              required
            />
            <button
              type="submit"
              className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm mt-1"
            >
              Simpan Kata Sandi Baru
            </button>
          </form>
        )}

        {savedPassword && (
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Kata sandi berhasil diperbarui!</span>
          </div>
        )}
      </div>

      {/* Informasi PWA & Versi Aplikasi */}
      <div className="p-3 bg-slate-100 rounded-2xl flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          PELITA Mobile PWA v2.4
        </span>
        <span>Build 2026.09.14</span>
      </div>

      {/* Tombol Logout Jelas */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition flex items-center justify-center gap-1.5"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Akun Siswa</span>
      </button>
    </div>
  )
}
