"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, Key, RefreshCw, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react"
import { getAppSetting, setAppSetting } from "@/app/actions/admin"

export default function AdminUjianPage() {
  const [token, setToken] = useState("...")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const loadToken = async () => {
    setIsLoading(true)
    const t = await getAppSetting("CBT_TOKEN")
    setToken(t || "BELUM_ADA")
    setIsLoading(false)
  }

  useEffect(() => {
    loadToken()
  }, [])

  const generateNewToken = async () => {
    setIsGenerating(true)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let res = "CBT-"
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    const result = await setAppSetting("CBT_TOKEN", res)
    if (result.error) {
      alert(result.error)
    } else {
      setToken(res)
      setToast("Token CBT baru berhasil di-generate & disimpan di database!")
      setTimeout(() => setToast(null), 3000)
    }
    setIsGenerating(false)
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
      <div className="bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Key className="w-24 h-24" />
        </div>
        
        <div className="relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-2 py-0.5 rounded-md">
            Token Akses Sesi Ujian Aktif
          </span>
          <div className="flex items-center gap-3 mt-2">
            {isLoading ? (
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-emerald-300 drop-shadow flex items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
              </span>
            ) : (
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-emerald-300 drop-shadow">
                {token}
              </span>
            )}
          </div>
          <p className="text-[11px] text-purple-200/90 mt-1">
            Bagikan kode token ini ke pengawas ruang untuk dibuka di HP siswa sebelum ujian dimulai.
          </p>
        </div>

        <button 
          onClick={generateNewToken}
          disabled={isGenerating || isLoading}
          className="relative z-10 bg-white text-purple-900 hover:bg-purple-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition shrink-0 disabled:opacity-70"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 text-purple-600 animate-spin" /> : <RefreshCw className="w-4 h-4 text-purple-600" />}
          <span>Generate Token Baru</span>
        </button>
      </div>

      {/* Status Ruang Ujian */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span>Konfigurasi Ruang & Jadwal CBT</span>
        </h3>

        {/*
          Sebelumnya bagian ini mengklaim sistem "otomatis mengunci layar agar
          tidak dapat berpindah aplikasi". Peramban web tidak mengizinkan hal
          itu dan aplikasi ini tidak melakukannya. Yang benar-benar ada adalah
          pencatatan perpindahan tab, jadi deskripsinya disesuaikan.
        */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Pengawasan Ujian</strong>
            <span>
              Setiap kali siswa meninggalkan halaman ujian, kejadian itu dihitung
              dan tersimpan bersama jawabannya; guru melihat jumlahnya di halaman
              kelola ujian. Waktu pengerjaan juga dihitung di server sehingga
              menutup atau menyegarkan aplikasi tidak menambah waktu. Peramban
              web tidak dapat mengunci perangkat siswa, jadi pengawas ruang tetap
              diperlukan.
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5">
          <BookOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold text-slate-800">Token per ujian</strong>
            <span>
              Token di atas berlaku sebagai token cadangan untuk seluruh ujian.
              Guru dapat menetapkan token, jadwal buka/tutup, dan status terbit
              khusus tiap ujian dari menu Ujian pada akun guru — token khusus
              selalu didahulukan.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
