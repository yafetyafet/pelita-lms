"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Plus, Trash2, X, Loader2 } from "lucide-react"
import { getSessions, createSession, deleteSession } from "@/app/actions/admin"

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]

type Sesi = {
  id: string
  day: string
  name: string
  startTime: string
  endTime: string
  type: string
}

export default function AdminSesiPage() {
  const [sesiList, setSesiList] = useState<Sesi[]>([])
  const [selectedDay, setSelectedDay] = useState("Senin")
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formHari, setFormHari] = useState("Senin")
  const [formJamKe, setFormJamKe] = useState("")
  const [formMulai, setFormMulai] = useState("07:00")
  const [formSelesai, setFormSelesai] = useState("07:45")
  const [formType, setFormType] = useState("Reguler")

  const loadData = async () => {
    setIsLoading(true)
    const data = await getSessions()
    setSesiList(data as Sesi[])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredSesi = sesiList
    .filter(s => s.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formJamKe.trim()) return
    setIsSubmitting(true)

    const res = await createSession({
      day: formHari,
      name: formJamKe,
      startTime: formMulai,
      endTime: formSelesai,
      type: formType
    })

    if (res.error) {
      alert(res.error)
    } else {
      setFormJamKe("")
      setShowModal(false)
      loadData()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus sesi ini?")) return
    setIsSubmitting(true)
    const res = await deleteSession(id)
    if (res.error) alert(res.error)
    else loadData()
    setIsSubmitting(false)
  }

  const handleCopyToDay = async (targetDay: string) => {
    const sourceSesi = sesiList.filter(s => s.day === selectedDay)
    if (sourceSesi.length === 0) return alert("Tidak ada sesi di hari ini untuk disalin.")
    
    setIsSubmitting(true)
    // Add all one by one
    for (const s of sourceSesi) {
      await createSession({
        day: targetDay,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        type: s.type
      })
    }
    await loadData()
    setIsSubmitting(false)
    alert(`Berhasil menyalin ${sourceSesi.length} sesi ke hari ${targetDay}.`)
  }

  const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
    Reguler: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    Istirahat: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    Upacara: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
    Pembiasaan: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  }

  const allDayCounts = DAYS.map(d => ({
    day: d,
    count: sesiList.filter(s => s.day === d).length
  }))

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between pt-1 mb-2">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Master Sesi & Jam Pelajaran</h2>
            <p className="text-[11px] text-slate-500 font-medium">Atur sesi per hari secara dinamis (Tersimpan ke Database)</p>
          </div>
        </div>

        <button 
          onClick={() => {
            setFormHari(selectedDay)
            setShowModal(true)
          }}
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {allDayCounts.map(({ day, count }) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedDay === day
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {day}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
              selectedDay === day ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Info: Salin ke Hari Lain */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 flex items-center justify-between">
        <span className="text-[11px]">
          <strong>Tip:</strong> Salin semua sesi hari <strong>{selectedDay}</strong> ke hari lain →
        </span>
        <div className="flex gap-1">
          {DAYS.filter(d => d !== selectedDay).map(d => (
            <button
              key={d}
              onClick={() => handleCopyToDay(d)}
              disabled={isSubmitting}
              className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Sesi List per Hari */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            Sesi Hari {selectedDay} ({filteredSesi.length} sesi)
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-500" />
            <span className="text-xs">Memuat sesi dari database...</span>
          </div>
        ) : filteredSesi.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-slate-300" />
            <span>Belum ada sesi untuk hari {selectedDay}.</span>
            <span className="text-[10px]">Klik &quot;Tambah Sesi&quot; atau salin dari hari lain.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSesi.map((s) => {
              const style = typeStyles[s.type] || typeStyles.Reguler
              return (
                <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${style.bg} ${style.text} border ${style.border}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{s.startTime} — {s.endTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                      {s.type}
                    </span>
                    <button 
                      onClick={() => handleDelete(s.id)} 
                      disabled={isSubmitting}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah Sesi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Tambah Sesi Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              {/* Hari */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Hari:</label>
                <div className="grid grid-cols-5 gap-1">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormHari(d)}
                      className={`py-1.5 rounded-xl text-[11px] font-bold transition ${
                        formHari === d
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama Sesi */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Sesi:</label>
                <input
                  required
                  type="text"
                  value={formJamKe}
                  onChange={e => setFormJamKe(e.target.value)}
                  placeholder="Contoh: Jam Ke-7, Istirahat, Upacara"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Jam Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Jam Mulai:</label>
                  <input
                    required
                    type="time"
                    value={formMulai}
                    onChange={e => setFormMulai(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Jam Selesai:</label>
                  <input
                    required
                    type="time"
                    value={formSelesai}
                    onChange={e => setFormSelesai(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Tipe Sesi */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Tipe Sesi:</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { val: "Reguler", color: "bg-blue-600" },
                    { val: "Istirahat", color: "bg-amber-500" },
                    { val: "Upacara", color: "bg-rose-500" },
                    { val: "Pembiasaan", color: "bg-emerald-600" }
                  ].map(t => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setFormType(t.val)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold transition ${
                        formType === t.val
                          ? `${t.color} text-white shadow-sm`
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t.val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan Sesi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
