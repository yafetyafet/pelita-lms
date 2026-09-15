"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Sparkles, HeartHandshake, CheckCircle2, BookOpen, Send, Plus, Loader2
} from "lucide-react"
import { getSpiritualJournals, createSpiritualJournal } from "@/app/actions/student"

export default function JurnalImanPage() {
  const [success, setSuccess] = useState(false)
  const [ibadah, setIbadah] = useState("")
  const [catatan, setCatatan] = useState("")
  const [history, setHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    const data = await getSpiritualJournals()
    setHistory(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ibadah.trim()) return

    setIsSubmitting(true)
    const res = await createSpiritualJournal({ activity: ibadah, notes: catatan })
    if (res.error) {
      alert(res.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setIbadah("")
        setCatatan("")
      }, 3000)
      loadData()
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {success && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Alhamdulillah, Jurnal Ibadah tersimpan!</span>
        </div>
      )}

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Jurnal Iman</h2>
            <p className="text-[11px] text-slate-500 font-medium">Catatan Ibadah & Pembentukan Karakter</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
          <HeartHandshake className="w-3 h-3" /> Spiritual
        </span>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-6 h-6 text-emerald-100" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Bina Iman Harian</h3>
          <p className="text-[11px] text-emerald-100 mt-0.5 leading-relaxed">
            "Barangsiapa yang hari ini lebih baik dari hari kemarin, dialah orang yang beruntung."
          </p>
        </div>
      </div>

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
            Kegiatan Ibadah (Wajib/Sunnah)
          </label>
          <input
            type="text"
            required
            value={ibadah}
            onChange={(e) => setIbadah(e.target.value)}
            placeholder="Contoh: Shalat Dhuha, Membaca Al-Quran Juz 30..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
            Refleksi / Catatan Kebaikan (Opsional)
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Hal baik apa yang kamu lakukan atau pelajari hari ini?"
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin"/> Menyimpan...</>
          ) : (
            <><Send className="w-4 h-4" /> Simpan Jurnal Kebaikan</>
          )}
        </button>
      </form>

      {/* History Riwayat */}
      <div className="flex flex-col gap-3 mt-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Riwayat Jurnal Terakhir
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-500" />
            <span className="text-xs">Memuat riwayat ibadah...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm text-center px-4">
            <HeartHandshake className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">Belum ada riwayat jurnal. Mulailah mencatat kebaikanmu hari ini!</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-900">{item.activity}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-emerald-200 pl-2">
                    "{item.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}