"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { submitAttendance, getTodayAttendance } from "@/app/actions/student"
import { PwaInstaller } from "@/components/PwaInstaller"
import { 
  User, 
  Bell, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  Video, 
  FileText, 
  Timer, 
  MessageSquareText, 
  Sparkles, 
  BookMarked, 
  AlertTriangle,
  ChevronRight,
  Clock,
  Sparkle,
  Radio
} from "lucide-react"

export default function StudentDashboard() {
  const [attended, setAttended] = useState(false)
  const [attendanceTime, setAttendanceTime] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"hari-ini" | "minggu-ini">("hari-ini")
  const [showNotif, setShowNotif] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const data = await getTodayAttendance()
      if (data) {
        setAttended(true)
        setAttendanceTime(new Date(data.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB")
      }
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleAttendance = async () => {
    if (isLoading || attended) return
    setIsLoading(true)
    
    // Simulate GPS fetch
    const lat = -7.34
    const lng = 109.34
    
    const res = await submitAttendance(lat, lng)
    if (res.success) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
      setAttended(true)
      setAttendanceTime(timeStr)
    } else {
      alert(res.error || "Gagal melakukan presensi")
    }
    setIsLoading(false)
  }

  const appMenus = [
    { 
      id: "jadwal", 
      title: "Jadwal", 
      subtitle: "Mapel & Ruang", 
      icon: Calendar, 
      color: "from-amber-500 to-orange-500", 
      badge: null,
      href: "/student/schedule"
    },
    { 
      id: "materi", 
      title: "Materi Belajar", 
      subtitle: "Embed & Modul", 
      icon: Video, 
      color: "from-sky-500 to-blue-600", 
      badge: "Baru",
      href: "/student/materials"
    },
    { 
      id: "tugas", 
      title: "Tugas & Kuis", 
      subtitle: "Latihan Harian", 
      icon: FileText, 
      color: "from-emerald-500 to-teal-600", 
      badge: "2",
      href: "/student/assignments"
    },
    { 
      id: "ujian", 
      title: "Ujian CBT", 
      subtitle: "PTS & PAS Khusus", 
      icon: Timer, 
      color: "from-rose-500 to-red-600", 
      badge: "PTS",
      href: "/student/exams"
    },
    { 
      id: "forum", 
      title: "Forum Diskusi", 
      subtitle: "Tanya Guru", 
      icon: MessageSquareText, 
      color: "from-violet-500 to-purple-600", 
      badge: null,
      href: "/student/materials"
    },
    { 
      id: "iman", 
      title: "Jurnal Iman", 
      subtitle: "Ibadah & Karakter", 
      icon: Sparkles, 
      color: "from-teal-500 to-emerald-600", 
      badge: null,
      href: "/student/jurnal-iman"
    },
    { 
      id: "perpus", 
      title: "Perpustakaan", 
      subtitle: "E-Book & Jurnal", 
      icon: BookMarked, 
      color: "from-indigo-500 to-blue-600", 
      badge: null,
      href: "/student/library"
    },
    { 
      id: "disiplin", 
      title: "Buku Disiplin", 
      subtitle: "0 Poin Pelanggaran", 
      icon: AlertTriangle, 
      color: "from-slate-700 to-slate-800", 
      badge: null,
      href: "/student/discipline"
    },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header Profile & Notifikasi */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-500/20 ring-2 ring-white">
              FP
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 leading-tight">Fajar Pratama</h2>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md">
                XII RPL 1
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">SMKN 1 Kemangkon • TA 2026/2027</p>
          </div>
        </div>

        <button 
          onClick={() => setShowNotif(true)}
          className="relative p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </button>
      </div>

      {/* Geotagging Attendance Live Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 text-white shadow-lg shadow-blue-600/20">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <MapPin className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                  Presensi Geotagging GPS
                </h3>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              </div>
              <p className="text-sm font-bold text-white">Senin, 14 September 2026</p>
            </div>
          </div>

          <Link 
            href="/student/attendance"
            className="text-[11px] font-semibold bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-emerald-500/35 transition"
          >
            <Radio className="w-3 h-3 text-emerald-300 animate-pulse" />
            Detail GPS
          </Link>
        </div>

        {/* Location Verification Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 mb-3 text-xs">
          <div className="flex items-center justify-between text-blue-100 mb-1">
            <span>Zona Sekolah:</span>
            <span className="font-semibold text-white">Area Kampus SMKN 1 Kemangkon</span>
          </div>
          <div className="flex items-center justify-between text-blue-200 text-[11px]">
            <span>Radius Validasi:</span>
            <span className="font-mono text-emerald-300 font-bold">18 Meter (Dalam Area)</span>
          </div>
        </div>

        {/* Action Button & Link to Dedicated Page */}
        <div className="flex gap-2">
          {!attended ? (
            <button
              onClick={handleAttendance}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-2xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600 transition-transform group-hover:scale-110" />
              <span>{isLoading ? "Memproses..." : "Presensi Hadir (1-Tap)"}</span>
            </button>
          ) : (
            <div className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 font-semibold text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Hadir Pukul {attendanceTime}</span>
            </div>
          )}

          <Link
            href="/student/attendance"
            className="px-3 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs flex items-center justify-center transition"
            title="Buka Peta & Radar Presensi"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Ringkasan Indikator / Quick Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <Link href="/student/attendance" className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition">
          <span className="text-[11px] font-semibold text-slate-500">Kehadiran</span>
          <span className="text-lg font-bold text-slate-900 mt-0.5">98.5%</span>
          <span className="text-[10px] font-medium text-emerald-600 mt-0.5">Sangat Baik</span>
        </Link>

        <Link href="/student/discipline" className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition">
          <span className="text-[11px] font-semibold text-slate-500">Poin Karakter</span>
          <span className="text-lg font-bold text-blue-600 mt-0.5">100</span>
          <span className="text-[10px] font-medium text-slate-500 mt-0.5">Nol Pelanggaran</span>
        </Link>

        <Link href="/student/assignments" className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition">
          <span className="text-[11px] font-semibold text-slate-500">Tugas & Kuis</span>
          <span className="text-lg font-bold text-amber-600 mt-0.5">2</span>
          <span className="text-[10px] font-medium text-amber-600 mt-0.5">Perlu Dikerjakan</span>
        </Link>
      </div>

      {/* Menu Aplikasi Smartphone (Grid 4x2) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkle className="w-4 h-4 text-blue-600 fill-blue-600" />
            Layanan Akademik
          </h3>
          <span className="text-[11px] font-semibold text-blue-600 hover:underline">
            8 Modul Siap
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {appMenus.map((menu) => {
            const Icon = menu.icon
            return (
              <Link
                key={menu.id}
                href={menu.href}
                className="group flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-200/70 hover:border-blue-300 hover:shadow-md transition-all active:scale-95"
              >
                <div className="relative mb-1.5">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${menu.color} flex items-center justify-center text-white shadow-sm shadow-slate-300 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 stroke-[2.2px]" />
                  </div>
                  {menu.badge && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-red-500 text-white shadow-sm">
                      {menu.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-1">
                  {menu.title}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">
                  {menu.subtitle}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Jadwal Pelajaran Hari Ini */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">Jadwal Kelas Hari Ini</h3>
          <Link href="/student/schedule" className="text-[11px] font-semibold text-blue-600 hover:underline">
            Lihat Sepekan →
          </Link>
        </div>

        {/* Schedule Item 1 - Active Class */}
        <div className="bg-white rounded-2xl p-3.5 border-2 border-blue-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
            Sedang Berlangsung
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
              PWB
            </div>

            <div className="flex-1 pr-14">
              <h4 className="text-xs font-bold text-slate-900">
                Pemrograman Web & Perangkat Bergerak
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Bpk. Kurniawan S, S.Kom</p>
              
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  07:15 - 09:30 WIB
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                  Lab Komputer 2
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action to open material */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Materi 04: Next.js & Geotagging API</span>
            <Link href="/student/materials" className="text-blue-600 font-bold text-[11px] flex items-center gap-0.5 hover:underline">
              Buka Modul Video <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Banner Khusus Ujian PTS CBT */}
      <Link 
        href="/student/exams"
        className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/80 rounded-2xl p-3.5 flex items-center justify-between hover:shadow-md transition active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/20">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded">
                UJIAN CBT
              </span>
              <span className="text-xs font-bold text-slate-900">Penilaian Tengah Semester (PTS)</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">Ruang Ujian Terpisah • Token: PTS2026</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-rose-400 shrink-0" />
      </Link>

      {/* MODAL NOTIFIKASI */}
      {showNotif && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Notifikasi Terbaru</h3>
              <button onClick={() => setShowNotif(false)} className="text-slate-400 font-bold text-xs">Tutup</button>
            </div>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <span className="text-[10px] font-bold text-blue-600 block mb-1">Baru saja</span>
                <span className="text-xs font-bold text-slate-800 block">Tugas Matematika Ditambahkan</span>
                <span className="text-[11px] text-slate-600">Bpk. Budi Santoso memberikan tugas baru. Tenggat besok.</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">2 jam yang lalu</span>
                <span className="text-xs font-bold text-slate-800 block">Pengumuman Sekolah</span>
                <span className="text-[11px] text-slate-600">Besok menggunakan seragam pramuka lengkap.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Installer Prompt */}
      <PwaInstaller />
    </div>
  )
}
