"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Send, CheckCircle2, Megaphone, Users, Clock } from "lucide-react"

export default function AdminBroadcastPage() {
  const [target, setTarget] = useState("ALL")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [history, setHistory] = useState([
    {
      id: "1",
      title: "Selamat Datang di Semester Baru",
      message: "Seluruh siswa dan guru dimohon mengupdate data presensi dan profil di aplikasi PELITA.",
      target: "Semua Pengguna",
      date: "Hari ini, 08:00 WIB"
    }
  ])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return

    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      const targetLabel = target === "ALL" ? "Semua Pengguna" : target === "STUDENT" ? "Siswa" : target === "TEACHER" ? "Guru" : "Mitra DUDI"
      setHistory([
        {
          id: Date.now().toString(),
          title,
          message,
          target: targetLabel,
          date: "Baru saja"
        },
        ...history
      ])
      setTitle("")
      setMessage("")
      setToast("Pengumuman berhasil disiarkan ke seluruh perangkat!")
      setTimeout(() => setToast(null), 3500)
    }, 800)
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
          <h2 className="text-base font-bold text-slate-900 leading-tight">Pengumuman Sekolah (Broadcast)</h2>
          <p className="text-[11px] text-slate-500 font-medium">Kirim notifikasi & pengumuman ke seluruh HP siswa dan guru</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Buat Siaran Baru</h3>
          </div>

          <form onSubmit={handleSend} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Penerima</label>
              <select 
                value={target} 
                onChange={(e) => setTarget(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
              >
                <option value="ALL">Semua Pengguna (Siswa, Guru, DUDI)</option>
                <option value="STUDENT">Khusus Seluruh Siswa</option>
                <option value="TEACHER">Khusus Bapak/Ibu Guru</option>
                <option value="DUDI">Khusus Mitra DUDI / Industri</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Judul Pengumuman</label>
              <input 
                required 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Jadwal Ujian PTS Semester Genap" 
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Isi Pesan Siaran</label>
              <textarea 
                required 
                rows={4}
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan isi pengumuman secara rinci di sini..." 
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 mt-1"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? "Mengirimkan Siaran..." : "Siarkan Pengumuman Sekarang"}</span>
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Riwayat Pengumuman</span>
          </h3>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[350px]">
            {history.map((h) => (
              <div key={h.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    {h.target}
                  </span>
                  <span className="text-[9px] text-slate-400">{h.date}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1">{h.title}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{h.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
