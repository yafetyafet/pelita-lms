"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import { ArrowLeft, Bell, Send, CheckCircle2, Megaphone, Users, Clock, Loader2 } from "lucide-react"
import { getBroadcasts, createBroadcast } from "@/app/actions/admin"

export default function AdminBroadcastPage() {
  const [target, setTarget] = useState("ALL")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])

  const loadData = async () => {
    setIsLoading(true)
    const data = await getBroadcasts()
    setHistory(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return

    setIsSending(true)
    const targetLabel = target === "ALL" ? "Semua Pengguna" : target === "STUDENT" ? "Siswa" : target === "TEACHER" ? "Guru" : "Mitra DUDI"
    
    const res = await createBroadcast({
      title,
      message,
      target: targetLabel
    })

    if (res.error) {
      alert(res.error)
    } else {
      setTitle("")
      setMessage("")
      setToast("Pengumuman berhasil disiarkan ke seluruh perangkat!")
      setTimeout(() => setToast(null), 3500)
      loadData()
    }
    setIsSending(false)
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
          <h2 className="text-base font-bold text-slate-900 leading-tight">Siaran Pengumuman</h2>
          <p className="text-[11px] text-slate-500 font-medium">Kirim notifikasi massal ke warga sekolah</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Megaphone className="w-24 h-24" />
        </div>
        
        <form onSubmit={handleSend} className="relative z-10 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-bold text-blue-100 block mb-1.5 uppercase tracking-wider">Target Penerima</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "ALL", label: "Semua", icon: Users },
                { id: "STUDENT", label: "Siswa", icon: Users },
                { id: "TEACHER", label: "Guru", icon: Users },
                { id: "DUDI", label: "Mitra DUDI", icon: Users }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTarget(t.id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    target === t.id 
                      ? "bg-white text-blue-700 shadow-md scale-[1.02]" 
                      : "bg-white/10 text-blue-100 hover:bg-white/20 border border-white/10"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-blue-100 block mb-1.5 uppercase tracking-wider">Judul Pesan</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Libur Nasional / Jadwal Ujian..."
              className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-blue-100 block mb-1.5 uppercase tracking-wider">Isi Pesan</label>
            <textarea
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Tulis detail pengumuman di sini..."
              rows={3}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full bg-white text-blue-700 hover:bg-blue-50 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-70"
          >
            {isSending ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</span>
            ) : (
              <span className="flex items-center gap-2"><Send className="w-4 h-4" /> Siarkan Sekarang</span>
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4 mt-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Riwayat Pengumuman
        </h3>

        {isLoading ? (
          <PemuatData pesan="Memuat riwayat..." />
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">Belum ada pengumuman yang disiarkan.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map(item => (
              <div key={item.id} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/50 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h4>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full whitespace-nowrap">
                    Ke: {item.target}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {item.message}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <Clock className="w-3 h-3" />
                  {new Date(item.createdAt).toLocaleString("id-ID")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
