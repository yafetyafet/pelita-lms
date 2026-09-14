"use client"

import React from "react"
import Link from "next/link"
import { 
  Building2, 
  MapPin, 
  Sparkles,
  LogOut
} from "lucide-react"

export default function DudiDashboard() {
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
              <h2 className="text-base font-bold text-slate-900 leading-tight">Mitra Industri</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Pembimbing Lapangan DUDI</p>
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
          <span className="text-xs text-purple-300 font-medium">Periode Terkini</span>
        </div>
        <h3 className="text-sm font-bold text-white mb-1">Pusat Industri • Prakerin</h3>
        <p className="text-xs text-purple-200/90 leading-relaxed mb-3">
          Sistem belum menemukan data siswa magang (PKL) yang ditugaskan ke industri Anda saat ini.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] text-purple-200 block">Siswa Bimbingan</span>
            <span className="text-base font-bold text-white">0 Siswa</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] text-purple-200 block">Presensi Hari Ini</span>
            <span className="text-base font-bold text-slate-300">-</span>
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

        <div className="flex flex-col gap-2.5 mt-2">
           <div className="text-center text-xs text-slate-400 italic py-4">Belum ada siswa PKL yang terdaftar di lokasi industri Anda.</div>
        </div>
      </div>
    </div>
  )
}
