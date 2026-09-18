"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getCurrentUser } from "@/app/actions/auth"
import { getTeacherClasses, getTeacherSchedules, createSchedule, deleteSchedule } from "@/app/actions/teacher"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Sparkles,
  Loader2
} from "lucide-react"

export default function TeacherScheduleInputPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [scheduleList, setScheduleList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form State
  const [day, setDay] = useState("Senin")
  const [sessionStart, setSessionStart] = useState("07:00")
  const [sessionEnd, setSessionEnd] = useState("09:15")
  const [targetClassId, setTargetClassId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [room, setRoom] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  useEffect(() => {
    async function load() {
      const [user, cls, scheds] = await Promise.all([getCurrentUser(), getTeacherClasses(), getTeacherSchedules()])
      setCurrentUser(user)
      setTeacherClasses(cls)
      setScheduleList(scheds)
      if (cls.length > 0) {
        setTargetClassId(cls[0].classId)
        setSubjectId(cls[0].subjectId)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  /**
   * Halaman ini dulu sama sekali tidak punya pemilih mapel: mapelnya ditebak
   * dari penugasan pertama pada kelas terpilih. Guru yang mengampu dua mapel
   * di satu kelas karena itu hanya bisa menjadwalkan mapel pertama.
   */
  const handlePenugasanChange = (nilai: string) => {
    const [classId, subjectIdBaru] = nilai.split("|")
    setTargetClassId(classId || "")
    setSubjectId(subjectIdBaru || "")
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetClassId) return
    setSaving(true)
    const res = await createSchedule({
      day,
      sessionStart,
      sessionEnd,
      classId: targetClassId,
      subjectId: subjectId || undefined,
      room: room || undefined
    })
    setSaving(false)
    if (res.error) {
      alert(res.error)
    } else {
      setSavedToast(true)
      const scheds = await getTeacherSchedules()
      setScheduleList(scheds)
      setTimeout(() => setSavedToast(false), 2500)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    await deleteSchedule(id)
    const scheds = await getTeacherSchedules()
    setScheduleList(scheds)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <span className="text-xs text-slate-500">Memuat jadwal...</span>
      </div>
    )
  }

  // Group by subject name for display
  const getSubjectName = (sid: string | null) => {
    if (!sid) return "Tidak ada mapel"
    const match = teacherClasses.find((tc: any) => tc.subjectId === sid)
    return match?.subject.name || sid
  }
  const getClassName = (cid: string) => {
    const match = teacherClasses.find((tc: any) => tc.classId === cid)
    return match?.classInfo.name || cid
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link href="/teacher" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Input Jadwal Mengajar</h2>
            <p className="text-[11px] text-slate-500 font-medium">{currentUser?.name || "Guru"}</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
          Mandiri
        </span>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Slot jadwal berhasil disimpan!</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-3xl text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px]">
          <strong>Rentang Sesi Fleksibel:</strong> Pilih jam mulai dan jam selesai sesuai kebutuhan mengajar Anda. Jadwal ini akan tampil di akun siswa kelas terkait.
        </p>
      </div>

      {/* Form Input Jadwal */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-600" />
          Tambah Slot Jam Mengajar
        </h3>

        <form onSubmit={handleAddSlot} className="flex flex-col gap-2.5 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Hari:</label>
              <select value={day} onChange={(e) => setDay(e.target.value)} className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none">
                {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Jam Mulai:</label>
              <input type="time" value={sessionStart} onChange={(e) => setSessionStart(e.target.value)} className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Jam Selesai:</label>
              <input type="time" value={sessionEnd} onChange={(e) => setSessionEnd(e.target.value)} className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Kelas & Mapel:</label>
              <select
                value={targetClassId && subjectId ? `${targetClassId}|${subjectId}` : ""}
                onChange={(e) => handlePenugasanChange(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
              >
                <option value="">Pilih Kelas &amp; Mapel</option>
                {teacherClasses.map((tc: any) => (
                  <option
                    key={`${tc.classId}|${tc.subjectId}`}
                    value={`${tc.classId}|${tc.subjectId}`}
                  >
                    {tc.classInfo.name} — {tc.subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Ruang:</label>
              <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Lab Komputer 2" className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 mt-1 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{saving ? "Menyimpan..." : "Simpan Slot Jadwal"}</span>
          </button>
        </form>
      </div>

      {/* Daftar Jadwal */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Jadwal Mengajar Anda ({scheduleList.length} Sesi)
          </h3>
        </div>

        {scheduleList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            Belum ada jadwal yang ditambahkan.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {scheduleList.map((slot: any) => (
              <div 
                key={slot.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start justify-between text-xs gap-2"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                      {slot.day}
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">
                      {getClassName(slot.classId)}
                    </span>
                    {slot.room && <span className="text-[10px] text-slate-500">{slot.room}</span>}
                  </div>

                  <h4 className="font-bold text-slate-900 mt-0.5 leading-snug">
                    {slot.subjectId ? getSubjectName(slot.subjectId) : (slot.label || "Tidak ada mapel")}
                  </h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {slot.sessionStart} - {slot.sessionEnd} WIB
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Hapus Slot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
