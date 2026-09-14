"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Plus, Trash2, CheckCircle2, ShieldCheck } from "lucide-react"

export default function AdminJadwalPage() {
  const [teacherSelfSchedule, setTeacherSelfSchedule] = useState(true)
  const [schedules, setSchedules] = useState([
    { id: "1", hari: "Senin", kelas: "XII RPL 1", mapel: "Pemrograman Web & Bergerak", guru: "Bpk. Kurniawan S, S.Kom", jam: "07:00 - 09:15" },
    { id: "2", hari: "Senin", kelas: "XII RPL 1", mapel: "Matematika Terapan", guru: "Ibu Siti Aminah, M.Pd", jam: "09:45 - 11:15" },
    { id: "3", hari: "Selasa", kelas: "XII TKJ 2", mapel: "Administrasi Infrastruktur Jaringan", guru: "Bpk. M. Sholeh, S.T", jam: "07:00 - 10:30" }
  ])

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      <div className="flex items-center gap-2.5 pt-1 mb-2">
        <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">Plotting & Penjadwalan Pelajaran</h2>
          <p className="text-[11px] text-slate-500 font-medium">Pengaturan kebijakan jadwal mandiri guru & plotting master</p>
        </div>
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
            Jika diaktifkan, Bapak/Ibu guru mata pelajaran dapat memilih jam mengajar mereka sendiri di portal guru.
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

      {/* Daftar Jadwal Terplotting */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Daftar Plotting Jadwal Kelas</span>
          </h3>
          <span className="text-[10px] font-bold text-slate-500">{schedules.length} Jadwal Terdaftar</span>
        </div>

        <div className="divide-y divide-slate-100">
          {schedules.map((item) => (
            <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{item.hari}</span>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.mapel}</h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">{item.kelas} ? <span className="text-slate-500">{item.guru}</span></p>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-emerald-200/60">
                    {item.jam}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
