"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getDashboardStats } from "@/app/actions/admin"
import { logout } from "@/app/actions/auth"
import { 
  Users, 
  GraduationCap, 
  Layers, 
  School, 
  Database, 
  ShieldCheck, 
  BookOpen,
  Calendar,
  Sparkles,
  ChevronRight,
  Bell,
  Clock,
  BookMarked,
  LogOut,
  UserCheck
} from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    admins: 0,
    classes: 0,
    subjects: 0,
    database: "Menghubungkan..."
  })
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const data = await getDashboardStats()
      setStats(data)
      setIsLoading(false)
    }
    loadStats()
  }, [])

  const masterCards = [
    { title: "Siswa Terdaftar", count: isLoading ? "..." : `${stats.students} Siswa`, sub: isLoading ? "..." : `${stats.classes} Rombel`, icon: GraduationCap, color: "from-blue-600 to-indigo-600" },
    { title: "Tenaga Pendidik", count: isLoading ? "..." : `${stats.teachers} Guru`, sub: "Aktif Mengajar", icon: Layers, color: "from-emerald-600 to-teal-600" },
    { title: "Administrator", count: isLoading ? "..." : `${stats.admins} Admin`, sub: "Akses Penuh", icon: ShieldCheck, color: "from-purple-600 to-violet-600" },
    { title: "Status Server", count: isLoading ? "..." : stats.database, sub: "Sinkronisasi Realtime", icon: Database, color: "from-slate-700 to-slate-900" },
  ]

  const quickActions = [
    { id: "users", title: "Manajemen Akun & Upload Massal", desc: "Input Satuan / Upload Sekaligus (Excel)", icon: Users },
    { id: "broadcast", title: "Pengumuman Sekolah (Broadcast)", desc: "Kirim Pesan ke Semua HP", icon: Bell },
    { id: "rombel", title: "Master Rombel & Wali Kelas", desc: "Atur Tingkat & Penetapan Wali Kelas", icon: School },
    { id: "sesi", title: "Master Sesi & Jam Pelajaran", desc: "Atur Durasi & Shift Jam Ke-X", icon: Clock },
    { id: "mapel", title: "Master Mapel & Pengampu", desc: "Data Mata Pelajaran & Relasi Guru", icon: BookMarked },
    { id: "jadwal", title: "Plotting Jadwal Mandiri Guru", desc: "Guru Mapel Menginput Jadwal Sendiri", icon: Calendar },
    { id: "ujian", title: "Jadwal & Token Ujian PTS CBT", desc: "Pengaturan Token & Ruang CBT", icon: BookOpen },
    { id: "backup", title: "Backup Database Supabase", desc: "Sinkronisasi & Snapshot Data", icon: Database },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Admin Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white font-bold text-base shadow-md shadow-slate-900/20 ring-2 ring-white">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 leading-tight">Super Administrator</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Pusat Kendali Sistem • SMKN 1 Kemangkon</p>
          </div>
        </div>

        <button onClick={() => logout()} className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition flex items-center gap-1 text-xs font-bold" title="Keluar dari Admin"><LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Keluar</span></button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {masterCards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="bg-white rounded-3xl p-3.5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
              <div className={`absolute -right-6 -top-6 w-20 h-20 bg-gradient-to-br ${card.color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
              <div className="flex flex-col h-full gap-2 relative">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">{card.title}</span>
                </div>
                <div className="mt-auto">
                  <div className="text-lg font-black text-slate-900 leading-none">{card.count}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1">{card.sub}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-800 text-xs mt-2">
        <strong className="block mb-1">Informasi Database</strong>
        Tampilan ini sudah terhubung ke database langsung. Jika angka di atas menunjukkan 0, artinya sistem benar-benar telah dikosongkan dan siap digunakan untuk pendataan sesungguhnya.
      </div>

      {/* Grid Manajemen Master Data */}
      <div className="mt-1">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600" />
          Menu Konfigurasi Master Data
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.id}
                href={`/admin/${action.id}`}
                className="group bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-center gap-3 hover:border-blue-300 hover:shadow-md transition-all text-left w-full"
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{action.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>
      </div>
      
      {/* Bottom padding for mobile scroll */}
      <div className="h-10"></div>
    </div>
  )
}

