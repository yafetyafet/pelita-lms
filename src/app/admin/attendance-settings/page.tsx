"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, CheckCircle2, Save, Loader2, Navigation, AlertCircle } from "lucide-react"
import { getAppSetting, setAppSetting } from "@/app/actions/admin"

export default function AdminAttendanceSettingsPage() {
  const [lat, setLat] = useState("-7.34")
  const [lng, setLng] = useState("109.34")
  const [radius, setRadius] = useState("50")
  const [timeLimit, setTimeLimit] = useState("07:00")
  const [checkOutTime, setCheckOutTime] = useState("15:00")
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true)
      const [savedLat, savedLng, savedRadius, savedTimeLimit, savedCheckOutTime] = await Promise.all([
        getAppSetting("SCHOOL_LATITUDE"),
        getAppSetting("SCHOOL_LONGITUDE"),
        getAppSetting("ATTENDANCE_RADIUS"),
        getAppSetting("ATTENDANCE_TIME_LIMIT"),
        getAppSetting("ATTENDANCE_CHECKOUT_TIME")
      ])
      
      if (savedLat) setLat(savedLat)
      if (savedLng) setLng(savedLng)
      if (savedRadius) setRadius(savedRadius)
      if (savedTimeLimit) setTimeLimit(savedTimeLimit)
      if (savedCheckOutTime) setCheckOutTime(savedCheckOutTime)
      
      setIsLoading(false)
    }
    
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    await Promise.all([
      setAppSetting("SCHOOL_LATITUDE", lat),
      setAppSetting("SCHOOL_LONGITUDE", lng),
      setAppSetting("ATTENDANCE_RADIUS", radius),
      setAppSetting("ATTENDANCE_TIME_LIMIT", timeLimit),
      setAppSetting("ATTENDANCE_CHECKOUT_TIME", checkOutTime)
    ])
    
    setToast("Pengaturan presensi dan koordinat berhasil disimpan!")
    setTimeout(() => setToast(null), 3500)
    setIsSaving(false)
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda.")
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toString())
        setLng(position.coords.longitude.toString())
      },
      (error) => {
        alert("Gagal mendapatkan lokasi: " + error.message)
      },
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1 mb-2">
        <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">Aturan Presensi & Lokasi</h2>
          <p className="text-[11px] text-slate-500 font-medium">Konfigurasi zona radius absensi (Geofencing)</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Pengaturan Zona Presensi Siswa
          </h3>
        </div>

        {isLoading ? (
          <div className="py-10 flex flex-col items-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-500" />
            <span className="text-xs">Memuat pengaturan...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <strong className="block mb-1">Cara Kerja Sistem Geofencing</strong>
                Siswa hanya dapat melakukan presensi kehadiran melalui HP mereka jika jarak (berdasarkan GPS) mereka ke titik pusat sekolah berada di dalam <strong>Radius Maksimal</strong> yang Anda tentukan di bawah ini.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Titik Koordinat Sekolah</h4>
                
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Latitude (Garis Lintang)</label>
                  <input
                    type="text"
                    required
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    placeholder="Contoh: -7.345"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Longitude (Garis Bujur)</label>
                  <input
                    type="text"
                    required
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    placeholder="Contoh: 109.345"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-500 text-emerald-600 font-bold text-xs hover:bg-emerald-50 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Gunakan Titik Lokasi Saya Saat Ini
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Batasan & Waktu</h4>
                
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Radius Maksimal (Meter)</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="5000"
                    value={radius}
                    onChange={e => setRadius(e.target.value)}
                    placeholder="Contoh: 50"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Jarak maksimum siswa dari titik pusat (Disarankan: 50-100 meter).
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Batas Waktu Masuk (Opsional)</label>
                  <input
                    type="time"
                    required
                    value={timeLimit}
                    onChange={e => setTimeLimit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Waktu maksimal siswa dapat presensi tepat waktu. Jika melebihi ini, akan dianggap Terlambat.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">Mulai Waktu Pulang (Opsional)</label>
                  <input
                    type="time"
                    required
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Waktu paling awal siswa diizinkan melakukan presensi pulang.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4" /> Simpan Pengaturan</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
