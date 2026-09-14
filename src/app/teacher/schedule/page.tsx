"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  MapPin, 
  BookOpen, 
  Sparkles,
  Users
} from "lucide-react"

export default function TeacherScheduleInputPage() {
  const [scheduleList, setScheduleList] = useState([
    { id: 1, day: "Senin", session: "Jam ke 1-3 (07:15 - 09:30)", class: "XII RPL 1", subject: "Pemrograman Web & Perangkat Bergerak", room: "Lab Komputer 2" },
    { id: 2, day: "Senin", session: "Jam ke 5-7 (12:30 - 14:45)", class: "XI RPL 2", subject: "Basis Data Lanjut", room: "Lab Komputer 1" },
    { id: 3, day: "Selasa", session: "Jam ke 1-3 (07:15 - 09:30)", class: "XII RPL 1", subject: "Pemrograman Berorientasi Objek (PBO)", room: "Lab Komputer 2" },
    { id: 4, day: "Rabu", session: "Jam ke 6-8 (12:45 - 15:15)", class: "XII RPL 1", subject: "Cloud Computing & Supabase API", room: "Lab Komputer 2" },
  ])

  // Form State
  const [day, setDay] = useState("Kamis")
  const [sessionTime, setSessionTime] = useState("Jam ke 1-3 (07:15 - 09:30)")
  const [targetClass, setTargetClass] = useState("XII RPL 1")
  const [subject, setSubject] = useState("Pemrograman Web & Perangkat Bergerak")
  const [room, setRoom] = useState("Lab Komputer 2")
  const [savedToast, setSavedToast] = useState(false)

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault()
    const newSlot = {
      id: Date.now(),
      day,
      session: sessionTime,
      class: targetClass,
      subject,
      room
    }
    setScheduleList([...scheduleList, newSlot])
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2500)
  }

  const handleDeleteSlot = (id: number) => {
    setScheduleList(scheduleList.filter((s) => s.id !== id))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link 
            href="/teacher"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Input Jadwal Mengajar Mandiri</h2>
            <p className="text-[11px] text-slate-500 font-medium">Bpk. Kurniawan S, S.Kom</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
          Mandiri
        </span>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Slot jadwal berhasil disimpan dan otomatis sinkron ke jadwal siswa!</span>
        </div>
      )}

      {/* Info Mandiri Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-3xl text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px]">
          <strong>Sistem Desentralisasi Roster:</strong> Bapak/Ibu guru mapel dapat langsung mengatur hari, jam tatap muka, kelas, dan ruang lab mandiri di sini. Jadwal ini akan langsung tampil di akun siswa kelas terkait tanpa menunggu admin menginput satu per satu.
        </p>
      </div>

      {/* Form Input Jadwal Baru */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-600" />
          Tambah Slot Jam Mengajar Baru
        </h3>

        <form onSubmit={handleAddSlot} className="flex flex-col gap-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Hari Mengajar:</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Sesi Jam Pelajaran:</label>
              <select
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
              >
                <option value="Jam ke 1-3 (07:15 - 09:30)">Jam 1-3 (07:15 - 09:30)</option>
                <option value="Jam ke 4-5 (09:45 - 11:15)">Jam 4-5 (09:45 - 11:15)</option>
                <option value="Jam ke 6-8 (12:30 - 14:45)">Jam 6-8 (12:30 - 14:45)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Target Rombel / Kelas:</label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
              >
                <option value="XII RPL 1">XII RPL 1</option>
                <option value="XI RPL 2">XI RPL 2</option>
                <option value="X RPL 1">X RPL 1</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-slate-700 text-[11px]">Ruang Kelas / Lab:</label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
              >
                <option value="Lab Komputer 2">Lab Komputer 2</option>
                <option value="Lab Komputer 1">Lab Komputer 1</option>
                <option value="Ruang Teori 12">Ruang Teori 12</option>
                <option value="Ruang Teori 10">Ruang Teori 10</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-slate-700 text-[11px]">Mata Pelajaran:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simpan Slot Jadwal Saya</span>
          </button>
        </form>
      </div>

      {/* Daftar Slot Mengajar Aktif Guru */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Jadwal Mengajar Anda ({scheduleList.length} Sesi Aktif)
          </h3>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Tersinkron Siswa
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {scheduleList.map((slot) => (
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
                    {slot.class}
                  </span>
                  <span className="text-[10px] text-slate-500">{slot.room}</span>
                </div>

                <h4 className="font-bold text-slate-900 mt-0.5 leading-snug">{slot.subject}</h4>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {slot.session}
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
      </div>
    </div>
  )
}
