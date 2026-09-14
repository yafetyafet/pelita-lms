"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Clock, 
  CalendarDays, 
  MapPin, 
  BookOpen, 
  UserRound,
  CheckCircle2
} from "lucide-react"

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState("Senin")

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]

  const fullSchedule: { [key: string]: { time: string; subject: string; teacher: string; room: string; code: string; isOngoing?: boolean }[] } = {
    Senin: [
      { time: "07:00 - 07:45 WIB", subject: "Upacara Bendera & Penguatan Karakter", teacher: "Tim Kesiswaan", room: "Lapangan Utama", code: "UPC" },
      { time: "07:45 - 10:00 WIB", subject: "Pemrograman Web & Perangkat Bergerak", teacher: "Bpk. Kurniawan S, S.Kom", room: "Lab Komputer 2", code: "PWB", isOngoing: true },
      { time: "10:15 - 11:45 WIB", subject: "Pendidikan Agama & Budi Pekerti", teacher: "Bpk. M. Sholeh, M.Pd.I", room: "Ruang Teori 12", code: "PAB" },
      { time: "12:30 - 14:45 WIB", subject: "Basis Data Lanjut (SQL & Prisma)", teacher: "Ibu Nurul Hidayah, S.T", room: "Lab Komputer 1", code: "BDL" },
    ],
    Selasa: [
      { time: "07:15 - 09:30 WIB", subject: "Pemrograman Berorientasi Objek (PBO)", teacher: "Bpk. Kurniawan S, S.Kom", room: "Lab Komputer 2", code: "PBO" },
      { time: "09:45 - 11:45 WIB", subject: "Matematika Terapan", teacher: "Ibu Dra. Sri Wahyuni", room: "Ruang Teori 12", code: "MTK" },
      { time: "12:30 - 15:00 WIB", subject: "Praktikum Desain Antarmuka (UI/UX)", teacher: "Bpk. Fajar Ramadhan, S.Kom", room: "Lab Multimedia", code: "UIX" },
    ],
    Rabu: [
      { time: "07:15 - 10:00 WIB", subject: "Produk Kreatif & Kewirausahaan (PKK)", teacher: "Ibu Endang S, S.E", room: "Ruang Teori 12", code: "PKK" },
      { time: "10:15 - 12:00 WIB", subject: "Bahasa Inggris Komunikasi Bisnis", teacher: "Ibu Ratna Dewi, M.Pd", room: "Lab Bahasa", code: "ING" },
      { time: "12:45 - 15:15 WIB", subject: "Cloud Computing & Supabase API", teacher: "Bpk. Kurniawan S, S.Kom", room: "Lab Komputer 2", code: "CLD" },
    ],
    Kamis: [
      { time: "07:15 - 09:30 WIB", subject: "Bahasa Indonesia & Literasi", teacher: "Bpk. Bambang S, S.Pd", room: "Ruang Teori 12", code: "IND" },
      { time: "09:45 - 12:00 WIB", subject: "Keamanan Sistem & Web Security", teacher: "Bpk. Dimas Pratama, M.Kom", room: "Lab Jaringan", code: "SEC" },
      { time: "12:45 - 15:15 WIB", subject: "Pendidikan Jasmani & Kesehatan", teacher: "Bpk. Agus Salim, S.Pd", room: "Gor Sekolah", code: "PJK" },
    ],
    Jumat: [
      { time: "07:00 - 08:00 WIB", subject: "Jumat Bersih, Sehat & Religi (Iman)", teacher: "Wali Kelas & BK", room: "Masjid & Kampus", code: "JMT" },
      { time: "08:00 - 10:30 WIB", subject: "Pembekalan Praktik Kerja Lapangan (PKL)", teacher: "Koordinator BKK & DUDI", room: "Aula SMKN 1", code: "PKL" },
    ]
  }

  const currentList = fullSchedule[selectedDay] || []

  return (
    <div className="flex flex-col gap-4 p-4">
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Jadwal Pembelajaran</h2>
            <p className="text-[11px] text-slate-500 font-medium">Kelas XII RPL 1 • Semester Ganjil</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
          Roster Aktif
        </span>
      </div>

      {/* Selector Hari */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              selectedDay === d
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Daftar Sesi Mapel */}
      <div className="flex flex-col gap-2.5">
        {currentList.map((item, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-3xl bg-white border transition-all flex flex-col gap-2 ${
              item.isOngoing 
                ? "border-2 border-blue-500 shadow-md relative overflow-hidden" 
                : "border-slate-200/80 shadow-sm"
            }`}
          >
            {item.isOngoing && (
              <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
                Sedang Berlangsung
              </span>
            )}

            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                item.isOngoing ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700"
              }`}>
                {item.code}
              </div>

              <div className="flex-1 pr-10">
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.subject}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <UserRound className="w-3 h-3 text-slate-400" /> {item.teacher}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {item.time}
              </span>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                {item.room}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
