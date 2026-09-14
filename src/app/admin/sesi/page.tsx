"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Clock, Plus, Trash2, CheckCircle2 } from "lucide-react"

export default function AdminSesiPage() {
  const [sesiList, setSesiList] = useState([
    { id: "1", jamKe: "Jam Ke-1", waktu: "07:00 - 07:45", type: "Reguler" },
    { id: "2", jamKe: "Jam Ke-2", waktu: "07:45 - 08:30", type: "Reguler" },
    { id: "3", jamKe: "Jam Ke-3", waktu: "08:30 - 09:15", type: "Reguler" },
    { id: "4", jamKe: "Istirahat Pagi", waktu: "09:15 - 09:45", type: "Istirahat" },
    { id: "5", jamKe: "Jam Ke-4", waktu: "09:45 - 10:30", type: "Reguler" },
    { id: "6", jamKe: "Jam Ke-5", waktu: "10:30 - 11:15", type: "Reguler" },
    { id: "7", jamKe: "Istirahat Sholat & Dzuhur", waktu: "11:45 - 12:45", type: "Istirahat" },
    { id: "8", jamKe: "Jam Ke-6", waktu: "12:45 - 13:30", type: "Reguler" },
  ])

  const [jamKe, setJamKe] = useState("")
  const [waktu, setWaktu] = useState("")
  const [type, setType] = useState("Reguler")
  const [showModal, setShowModal] = useState(false)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jamKe.trim() || !waktu.trim()) return
    setSesiList([...sesiList, { id: Date.now().toString(), jamKe, waktu, type }])
    setJamKe("")
    setWaktu("")
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    setSesiList(sesiList.filter(s => s.id !== id))
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      <div className="flex items-center justify-between pt-1 mb-2">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Master Sesi & Jam Pelajaran</h2>
            <p className="text-[11px] text-slate-500 font-medium">Konfigurasi durasi jam mengajar dan waktu istirahat</p>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Sesi</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="divide-y divide-slate-100">
          {sesiList.map((s) => (
            <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  s.type === "Istirahat" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{s.jamKe}</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{s.waktu}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  s.type === "Istirahat" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {s.type}
                </span>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-3">Tambah Sesi Jam Baru</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Sesi (Contoh: Jam Ke-7 / Istirahat)</label>
                <input required type="text" value={jamKe} onChange={e => setJamKe(e.target.value)} placeholder="Contoh: Jam Ke-7" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Rentang Waktu</label>
                <input required type="text" value={waktu} onChange={e => setWaktu(e.target.value)} placeholder="Contoh: 13:30 - 14:15" className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-mono" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Tipe</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none">
                  <option value="Reguler">Reguler (Jam Belajar)</option>
                  <option value="Istirahat">Waktu Istirahat</option>
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700">Simpan Sesi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
