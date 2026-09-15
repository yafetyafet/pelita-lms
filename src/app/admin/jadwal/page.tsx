"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Plus, Trash2, ShieldCheck, Loader2, X, Flag } from "lucide-react"
import { getSchedules, createScheduleAdmin, deleteScheduleAdmin, getClasses, getTeachers } from "@/app/actions/admin"

export default function AdminJadwalPage() {
  const [teacherSelfSchedule, setTeacherSelfSchedule] = useState(true)
  const [schedules, setSchedules] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formDay, setFormDay] = useState("Senin")
  const [formStart, setFormStart] = useState("07:00")
  const [formEnd, setFormEnd] = useState("08:00")
  const [formClassId, setFormClassId] = useState("")
  const [formTeacherId, setFormTeacherId] = useState("")
  const [formRoom, setFormRoom] = useState("")
  const [formType, setFormType] = useState("REGULAR")
  const [formLabel, setFormLabel] = useState("")

  useEffect(() => {
    async function load() {
      const [sch, cls, tch] = await Promise.all([getSchedules(), getClasses(), getTeachers()])
      setSchedules(sch)
      setClasses(cls)
      setTeachers(tch)
      if (cls.length > 0) setFormClassId(cls[0].id)
      setIsLoading(false)
    }
    load()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formClassId) return
    setSaving(true)
    const res = await createScheduleAdmin({
      day: formDay,
      sessionStart: formStart,
      sessionEnd: formEnd,
      classId: formClassId,
      teacherId: formTeacherId || undefined,
      room: formRoom || undefined,
      type: formType,
      label: formType !== "REGULAR" ? formLabel : undefined
    })
    setSaving(false)
    if (res.error) {
      alert(res.error)
    } else {
      setShowAddModal(false)
      setFormLabel("")
      const sch = await getSchedules()
      setSchedules(sch)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return
    await deleteScheduleAdmin(id)
    const sch = await getSchedules()
    setSchedules(sch)
  }

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || classId
  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return "-"
    return teachers.find(t => t.id === teacherId)?.name || teacherId
  }

  const typeColors: any = {
    REGULAR: "bg-blue-100 text-blue-800",
    UPACARA: "bg-amber-100 text-amber-800",
    PEMBIASAAN: "bg-emerald-100 text-emerald-800"
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      <div className="flex items-center justify-between pt-1 mb-2">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Plotting & Penjadwalan</h2>
            <p className="text-[11px] text-slate-500 font-medium">Jadwal Pelajaran, Upacara & Pembiasaan</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Kebijakan Guru Mandiri Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white shadow-md flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Kebijakan Sistem</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">Izinkan Guru Menginput Jadwal Mandiri</h3>
          <p className="text-[11px] text-blue-100/90 mt-0.5">
            Jika diaktifkan, guru dapat memilih jam mengajar mereka sendiri di portal guru.
          </p>
        </div>

        <button 
          onClick={() => setTeacherSelfSchedule(!teacherSelfSchedule)}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shrink-0 ${
            teacherSelfSchedule ? "bg-emerald-500 text-white shadow-sm" : "bg-white/20 text-white"
          }`}
        >
          {teacherSelfSchedule ? "Aktif (Mandiri)" : "Terkunci (Admin Only)"}
        </button>
      </div>

      {/* Daftar Jadwal */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Daftar Jadwal ({schedules.length})</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 flex flex-col items-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-500" />
            <span className="text-xs">Memuat jadwal...</span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic flex flex-col items-center gap-2">
            <Calendar className="w-8 h-8 text-slate-300" />
            Belum ada jadwal. Klik &quot;Tambah&quot; untuk membuat jadwal baru.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {schedules.map((item: any) => (
              <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{item.day}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${typeColors[item.type] || "bg-slate-100 text-slate-600"}`}>
                        {item.type}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">{getClassName(item.classId)}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {item.label || (item.type === "UPACARA" ? "Upacara Bendera" : item.type === "PEMBIASAAN" ? "Pembiasaan" : "Pelajaran")}
                    </h4>
                    {item.teacherId && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{getTeacherName(item.teacherId)}</p>
                    )}
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-emerald-200/60">
                      {item.sessionStart} - {item.sessionEnd}
                    </span>
                    {item.room && <span className="text-[10px] text-slate-400 ml-2">{item.room}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Tambah Jadwal Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-3 text-xs">
              {/* Type selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Jenis Jadwal:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: "REGULAR", label: "Pelajaran", color: "bg-blue-600" },
                    { val: "UPACARA", label: "Upacara", color: "bg-amber-500" },
                    { val: "PEMBIASAAN", label: "Pembiasaan", color: "bg-emerald-600" }
                  ].map(t => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setFormType(t.val)}
                      className={`py-2 rounded-xl font-bold text-xs transition ${
                        formType === t.val ? `${t.color} text-white shadow-sm` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {formType !== "REGULAR" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Label / Keterangan:</label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={e => setFormLabel(e.target.value)}
                    placeholder={formType === "UPACARA" ? "Upacara Bendera & Penguatan Karakter" : "Pembiasaan Pagi / Jumat Bersih"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Hari:</label>
                  <select value={formDay} onChange={e => setFormDay(e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Mulai:</label>
                  <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Selesai:</label>
                  <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Kelas:</label>
                  <select value={formClassId} onChange={e => setFormClassId(e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Guru (Opsional):</label>
                  <select value={formTeacherId} onChange={e => setFormTeacherId(e.target.value)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                    <option value="">-- Pilih --</option>
                    {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Ruangan (Opsional):</label>
                <input type="text" value={formRoom} onChange={e => setFormRoom(e.target.value)} placeholder="Lab Komputer 2" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 mt-1"
              >
                {saving ? "Menyimpan..." : "Simpan Jadwal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
