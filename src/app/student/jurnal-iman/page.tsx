"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Sparkles,
  HeartHandshake,
  CheckCircle2,
  BookOpen,
  Send,
  Plus
} from "lucide-react"

export default function JurnalImanPage() {
  const [success, setSuccess] = useState(false)
  const [ibadah, setIbadah] = useState("")
  const [catatan, setCatatan] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setIbadah("")
      setCatatan("")
    }, 3000)
  }

  const history = [
    { tanggal: "14 Sep 2026", jenis: "Shalat Dhuha & Membaca Al-Qur'an", catatan: "Juz 30, Surat An-Naba" },
    { tanggal: "13 Sep 2026", jenis: "Infaq Jumat", catatan: "Sedekah rutin mingguan" },
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Jurnal Iman & Karakter</h2>
            <p className="text-[11px] text-slate-500 font-medium">Rekaman Ibadah & Pembiasaan Baik</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Jurnal ibadah berhasil disimpan. Semoga berkah!</span>
        </div>
      )}

      {/* Input Ibadah */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Input Jurnal Hari Ini
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-600">Jenis Ibadah / Kebaikan</label>
            <select 
              required
              value={ibadah}
              onChange={(e) => setIbadah(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
            >
              <option value="">Pilih Jenis...</option>
              <option value="Shalat Dhuha">Shalat Dhuha</option>
              <option value="Shalat Dzuhur Berjamaah">Shalat Dzuhur Berjamaah</option>
              <option value="Membaca Kitab Suci">Membaca Kitab Suci</option>
              <option value="Infaq / Sedekah">Infaq / Sedekah</option>
              <option value="Membersihkan Lingkungan Sekolah">Membersihkan Lingkungan Sekolah</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-600">Catatan Tambahan (Opsional)</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Misal: Juz 30, membersihkan taman..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 mt-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simpan Jurnal Iman</span>
          </button>
        </form>
      </div>

      {/* Riwayat Jurnal */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-blue-500" />
          Riwayat Pembiasaan
        </h3>

        <div className="flex flex-col gap-2">
          {history.map((h, idx) => (
            <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-800 text-xs">{h.jenis}</span>
                <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">{h.tanggal}</span>
              </div>
              <p className="text-[11px] text-slate-500">{h.catatan}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}