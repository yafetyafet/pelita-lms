"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  Building2, 
  MapPin, 
  FileSpreadsheet, 
  Award, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  Calendar,
  ChevronRight,
  Sparkles,
  LogOut
} from "lucide-react"

export default function DudiDashboard() {
  const [approvedList, setApprovedList] = useState<string[]>([])

  const handleApprove = (name: string) => {
    setApprovedList((prev) => [...prev, name])
  }

  const pklStudents = [
    { name: "Fajar Pratama", nisn: "0067821943", divisi: "Software Development", time: "07:45 WIB", status: "Presensi Tepat Waktu", distance: "Kantor Pusat Telkom Purbalingga (Radius 12m)" },
    { name: "Siti Rahmawati", nisn: "0067821990", divisi: "Network Operations", time: "07:50 WIB", status: "Presensi Tepat Waktu", distance: "Kantor Pusat Telkom Purbalingga (Radius 25m)" },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header Profile Mitra DUDI */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-purple-600/20 ring-2 ring-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 leading-tight">Ir. Hendra Kusuma</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Pembimbing Lapangan • PT Telkom Indonesia</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
            Mitra DUDI
          </span>
          <Link
            href="/login"
            className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-950 p-4 text-white shadow-lg shadow-purple-900/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-200">
              Monitoring Praktik Kerja Lapangan (PKL)
            </span>
          </div>
          <span className="text-xs text-purple-300 font-medium">Periode 2026/2027</span>
        </div>
        <h3 className="text-sm font-bold text-white mb-1">SMKN 1 Kemangkon • Jurusan RPL & TKJ</h3>
        <p className="text-xs text-purple-200/90 leading-relaxed mb-3">
          Memantau presensi geotagging di lokasi industri, memeriksa logbook harian, dan memberikan penilaian kinerja industri.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] text-purple-200 block">Siswa Bimbingan</span>
            <span className="text-base font-bold text-white">4 Siswa</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] text-purple-200 block">Presensi Hari Ini</span>
            <span className="text-base font-bold text-emerald-300">100% Hadir</span>
          </div>
        </div>
      </div>

      {/* Presensi Geotagging Siswa PKL Hari Ini */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Presensi GPS Siswa PKL</h3>
              <p className="text-[10px] text-slate-500">Terverifikasi Geofence Perusahaan</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {pklStudents.map((s) => {
            const isApproved = approvedList.includes(s.name)

            return (
              <div key={s.name} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                    <p className="text-[10px] text-slate-500">{s.divisi} • {s.nisn}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {s.time}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60">
                  <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">{s.distance}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Jurnal: Integrasi Database API</span>
                  {isApproved ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApprove(s.name)}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] shadow-sm transition"
                    >
                      Validasi Logbook
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
