"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Key,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  UserX,
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  Users,
} from "lucide-react"
import { getAppSetting, setAppSetting, getTeachersWithoutExamQuestions } from "@/app/actions/admin"

type GuruBelumSoal = {
  guru: { id: string; name: string; username: string }
  mapel: { id: string; name: string }
  kelas: { id: string; name: string }[]
}

export default function AdminUjianPage() {
  const [token, setToken] = useState("...")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // State untuk fitur guru belum memasukkan soal
  const [guruBelumSoal, setGuruBelumSoal] = useState<GuruBelumSoal[]>([])
  const [isLoadingGuru, setIsLoadingGuru] = useState(true)
  const [showGuruSection, setShowGuruSection] = useState(true)
  const [searchGuru, setSearchGuru] = useState("")

  const loadToken = async () => {
    setIsLoading(true)
    const t = await getAppSetting("CBT_TOKEN")
    setToken(t || "BELUM_ADA")
    setIsLoading(false)
  }

  const loadGuruBelumSoal = async () => {
    setIsLoadingGuru(true)
    try {
      const data = await getTeachersWithoutExamQuestions()
      setGuruBelumSoal(data)
    } catch {
      setGuruBelumSoal([])
    }
    setIsLoadingGuru(false)
  }

  useEffect(() => {
    loadToken()
    loadGuruBelumSoal()
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

  // Filter & kelompokkan guru berdasarkan pencarian
  const filteredGuru = guruBelumSoal.filter((item) => {
    if (!searchGuru) return true
    const q = searchGuru.toLowerCase()
    return (
      item.guru.name.toLowerCase().includes(q) ||
      item.guru.username.toLowerCase().includes(q) ||
      item.mapel.name.toLowerCase().includes(q) ||
      item.kelas.some((k) => k.name.toLowerCase().includes(q))
    )
  })

  // Kelompokkan per guru
  const guruGrouped = filteredGuru.reduce<
    Record<string, { guru: GuruBelumSoal["guru"]; items: { mapel: GuruBelumSoal["mapel"]; kelas: GuruBelumSoal["kelas"] }[] }>
  >((acc, item) => {
    if (!acc[item.guru.id]) {
      acc[item.guru.id] = { guru: item.guru, items: [] }
    }
    acc[item.guru.id].items.push({ mapel: item.mapel, kelas: item.kelas })
    return acc
  }, {})

  const guruList = Object.values(guruGrouped)

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
                <span className="text-3xl font-black text-white/30 animate-pulse">
                  MEMUAT...
                </span>
              ) : (
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-emerald-300 drop-shadow">
                  {token}
                </span>
              )}
            </div>
            <p className="text-[11px] text-purple-200/90 mt-1">
              Sistem akan merotasi token ini secara otomatis setiap 15 menit jika ada ujian CBT yang sedang aktif.
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

      {/* === GURU BELUM MEMASUKKAN SOAL === */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header — klik untuk expand/collapse */}
        <button
          onClick={() => setShowGuruSection(!showGuruSection)}
          className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md shadow-rose-200/50">
              <UserX className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Guru Belum Memasukkan Soal Ujian
                {!isLoadingGuru && guruBelumSoal.length > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    {guruBelumSoal.length} mapel
                  </span>
                )}
                {!isLoadingGuru && guruBelumSoal.length === 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Semua sudah lengkap
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Daftar guru yang sudah mengampu kelas tetapi belum membuat ujian bersoal
              </p>
            </div>
          </div>
          {showGuruSection ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {showGuruSection && (
          <div className="px-5 pb-5 flex flex-col gap-3">
            {isLoadingGuru ? (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-medium">Memuat data guru...</span>
              </div>
            ) : guruBelumSoal.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-emerald-600">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-xs font-bold">Semua guru sudah memasukkan soal ujian!</p>
                <p className="text-[11px] text-slate-400 font-medium text-center max-w-xs">
                  Setiap guru pengampu sudah membuat minimal satu ujian yang memiliki soal untuk mapel yang diampu.
                </p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama guru, mapel, atau kelas..."
                    value={searchGuru}
                    onChange={(e) => setSearchGuru(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-300 focus:ring-2 focus:ring-purple-100 outline-none transition placeholder:text-slate-400"
                  />
                </div>

                {/* Ringkasan */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-800">
                    <strong className="font-bold">{guruList.length} guru</strong> dengan total{" "}
                    <strong className="font-bold">{filteredGuru.length} penugasan mapel</strong>{" "}
                    belum membuat ujian bersoal. Guru dapat membuat ujian dan soal dari menu Ujian pada akun guru.
                  </div>
                </div>

                {/* Daftar Guru */}
                {guruList.length === 0 && searchGuru && (
                  <div className="flex flex-col items-center justify-center py-6 gap-1 text-slate-400">
                    <Search className="w-6 h-6" />
                    <p className="text-xs font-medium">Tidak ditemukan guru yang cocok</p>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {guruList.map((g) => (
                    <div
                      key={g.guru.id}
                      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white overflow-hidden hover:border-slate-300 transition"
                    >
                      {/* Info Guru */}
                      <div className="p-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                          {g.guru.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{g.guru.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">@{g.guru.username}</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span className="text-[10px] font-bold text-rose-600">
                            {g.items.length} mapel
                          </span>
                        </div>
                      </div>

                      {/* Daftar Mapel yang belum ada soal */}
                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {g.items.map((item) => (
                          <div key={item.mapel.id} className="px-3.5 py-2.5 flex items-start gap-2.5">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-slate-800">{item.mapel.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.kelas.map((k) => (
                                  <span
                                    key={k.id}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-600 border border-slate-200"
                                  >
                                    <Users className="w-2.5 h-2.5" />
                                    {k.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tombol refresh */}
                <button
                  onClick={loadGuruBelumSoal}
                  disabled={isLoadingGuru}
                  className="self-center flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGuru ? "animate-spin" : ""}`} />
                  Muat Ulang Data
                </button>
              </>
            )}
          </div>
        )}
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

