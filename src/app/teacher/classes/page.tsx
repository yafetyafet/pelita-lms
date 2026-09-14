"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  MapPin, 
  FilePlus, 
  Award, 
  CheckCircle2, 
  ChevronRight,
  GraduationCap,
  Sparkles
} from "lucide-react"

export default function TeacherClassesPage() {
  const [activeClassId, setActiveClassId] = useState("c1")

  const classes = [
    {
      id: "c1",
      name: "XII Rekayasa Perangkat Lunak 1",
      short: "XII RPL 1",
      subject: "Pemrograman Web & Perangkat Bergerak",
      studentsCount: 36,
      attendanceToday: "34 Hadir (2 Izin)",
      role: "Wali Kelas & Guru Pengampu",
      rombelLevel: "Kelas 12",
      students: [
        { name: "Fajar Pratama", nisn: "0067821943", status: "Hadir (GPS 18m)", scoreAvg: 92 },
        { name: "Citra Lestari", nisn: "0067821944", status: "Izin (Surat Terlampir)", scoreAvg: 88 },
        { name: "Rafi Ahmad", nisn: "0067821945", status: "Izin (Sakit)", scoreAvg: 85 },
        { name: "Dimas Anggara", nisn: "0067821946", status: "Hadir (GPS 12m)", scoreAvg: 90 },
      ]
    },
    {
      id: "c2",
      name: "XI Rekayasa Perangkat Lunak 2",
      short: "XI RPL 2",
      subject: "Basis Data Lanjut",
      studentsCount: 35,
      attendanceToday: "35 Hadir (Lengkap)",
      role: "Guru Pengampu",
      rombelLevel: "Kelas 11",
      students: [
        { name: "Bagus Sanjaya", nisn: "0078129011", status: "Hadir (GPS 20m)", scoreAvg: 86 },
        { name: "Anisa Nur", nisn: "0078129012", status: "Hadir (GPS 14m)", scoreAvg: 94 },
      ]
    },
    {
      id: "c3",
      name: "X Rekayasa Perangkat Lunak 1",
      short: "X RPL 1",
      subject: "Dasar-Dasar Kejuruan RPL",
      studentsCount: 36,
      attendanceToday: "Jadwal Besok",
      role: "Guru Pengampu",
      rombelLevel: "Kelas 10",
      students: [
        { name: "Eko Prasetyo", nisn: "0089123001", status: "Belum Dimulai", scoreAvg: 80 },
      ]
    }
  ]

  const activeClass = classes.find((c) => c.id === activeClassId) || classes[0]

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Manajemen Kelas Binaan</h2>
            <p className="text-[11px] text-slate-500 font-medium">Bpk. Kurniawan S, S.Kom</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
          3 Rombel
        </span>
      </div>

      {/* Class Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setActiveClassId(cls.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeClassId === cls.id
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {cls.short}
          </button>
        ))}
      </div>

      {/* Active Class Showcase Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 p-4 text-white shadow-lg flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase">
              {activeClass.role}
            </span>
            <h3 className="text-base font-black text-white mt-1 leading-snug">
              {activeClass.name}
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">{activeClass.subject}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
          <div className="bg-white/10 rounded-2xl p-2.5">
            <span className="text-[10px] text-emerald-200 block">Total Siswa:</span>
            <span className="font-bold text-white text-sm">{activeClass.studentsCount} Siswa</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-2.5">
            <span className="text-[10px] text-emerald-200 block">Presensi Hari Ini:</span>
            <span className="font-bold text-emerald-300 text-sm">{activeClass.attendanceToday}</span>
          </div>
        </div>

        {/* Quick Buttons for Class */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link
            href="/teacher/grades"
            className="py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs text-center hover:bg-emerald-50 transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Rekap Nilai</span>
          </Link>
          <Link
            href="/teacher/journal"
            className="py-2.5 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-white font-bold text-xs text-center hover:bg-emerald-500/40 transition flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Isi Jurnal Kelas</span>
          </Link>
        </div>
      </div>

      {/* Roster Siswa & Status Kehadiran */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            Daftar Siswa & Radar Presensi ({activeClass.students.length} Ditampilkan)
          </h3>
        </div>

        <div className="flex flex-col gap-2">
          {activeClass.students.map((std, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-slate-900">{std.name}</h4>
                <p className="text-[10px] text-slate-500">NISN: {std.nisn}</p>
              </div>

              <div className="text-right">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  std.status.includes("Hadir") 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {std.status}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Rata Nilai: {std.scoreAvg}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
