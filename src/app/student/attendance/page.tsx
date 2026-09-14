"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  History, 
  Navigation,
  Radio,
  Clock,
  ShieldCheck,
  Building2
} from "lucide-react"

// Titik Koordinat Pusat SMKN 1 Kemangkon
const SCHOOL_COORDS = {
  lat: -7.472145,
  lng: 109.381210,
  maxRadiusMeters: 120, // radius toleransi presensi
  name: "Kampus SMKN 1 Kemangkon"
}

// Rumus Haversine untuk menghitung jarak akurat dalam meter
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3 // radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(false)
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>("Menunggu pendeteksian lokasi...")
  const [attendedSuccess, setAttendedSuccess] = useState(false)
  const [attendedTime, setAttendedTime] = useState<string | null>(null)
  const [useSimulation, setUseSimulation] = useState(false)

  // Fungsi deteksi GPS
  const detectLocation = () => {
    setLoading(true)
    setStatusMessage("Mendeteksi sinyal satelit GPS...")

    if (useSimulation) {
      // Mode simulasi langsung di dalam sekolah untuk kemudahan pengujian
      setTimeout(() => {
        const simLat = SCHOOL_COORDS.lat + 0.0001
        const simLng = SCHOOL_COORDS.lng + 0.0001
        const dist = calculateDistance(simLat, simLng, SCHOOL_COORDS.lat, SCHOOL_COORDS.lng)
        setCurrentCoords({ lat: simLat, lng: simLng, accuracy: 3.5 })
        setDistance(dist)
        setIsWithinRadius(dist <= SCHOOL_COORDS.maxRadiusMeters)
        setStatusMessage("Lokasi terverifikasi (Mode Uji Coba Sekolah)")
        setLoading(false)
      }, 700)
      return
    }

    if (!navigator.geolocation) {
      setStatusMessage("Browser Anda tidak mendukung deteksi lokasi.")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        const dist = calculateDistance(latitude, longitude, SCHOOL_COORDS.lat, SCHOOL_COORDS.lng)
        setCurrentCoords({ lat: latitude, lng: longitude, accuracy })
        setDistance(dist)
        const valid = dist <= SCHOOL_COORDS.maxRadiusMeters
        setIsWithinRadius(valid)
        setStatusMessage(
          valid
            ? `Berada dalam radius sekolah (${dist} meter)`
            : `Di luar radius sekolah (${dist} meter dari gerbang)`
        )
        setLoading(false)
      },
      (err) => {
        console.error(err)
        // Jika izin ditolak atau error, tawarkan opsi simulasi
        setStatusMessage("Izin GPS tidak diberikan atau GPS belum aktif. Mengaktifkan koordinat default uji coba.")
        setUseSimulation(true)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    detectLocation()
  }, [useSimulation])

  const handlePresensi = () => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"
    setAttendedSuccess(true)
    setAttendedTime(timeStr)
  }

  const attendanceHistory = [
    { date: "Senin, 14 Sept 2026", time: attendedTime || "07:18 WIB", status: "Hadir Tepat Waktu", distance: "18 meter", valid: true },
    { date: "Jumat, 11 Sept 2026", time: "07:10 WIB", status: "Hadir Tepat Waktu", distance: "24 meter", valid: true },
    { date: "Kamis, 10 Sept 2026", time: "07:14 WIB", status: "Hadir Tepat Waktu", distance: "12 meter", valid: true },
    { date: "Rabu, 09 Sept 2026", time: "07:22 WIB", status: "Hadir Tepat Waktu", distance: "31 meter", valid: true },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link 
            href="/student"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Presensi Geotagging</h2>
            <p className="text-[11px] text-slate-500 font-medium">SMKN 1 Kemangkon • TA 2026/2027</p>
          </div>
        </div>

        <button
          onClick={detectLocation}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-blue-600 hover:bg-blue-50 transition shadow-sm flex items-center gap-1 text-xs font-semibold"
          title="Segarkan Titik GPS"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Simulator / Real GPS Toggle Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-2.5 flex items-center justify-between text-[11px]">
        <span className="text-slate-300 font-medium flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          Mode Pengujian Lokasi:
        </span>
        <button
          onClick={() => setUseSimulation(!useSimulation)}
          className={`px-2.5 py-1 rounded-xl font-bold transition ${
            useSimulation 
              ? "bg-emerald-500 text-white shadow-sm" 
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {useSimulation ? "Simulasi di Sekolah (Aktif)" : "Pakai GPS Asli"}
        </button>
      </div>

      {/* Radar Map & Radius Status Visual */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-4 text-white shadow-xl shadow-blue-700/20 relative overflow-hidden flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <Building2 className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                Titik Presensi Terdaftar
              </span>
              <h3 className="text-sm font-bold text-white">{SCHOOL_COORDS.name}</h3>
            </div>
          </div>
          <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-semibold">
            Maks Radius: {SCHOOL_COORDS.maxRadiusMeters}m
          </span>
        </div>

        {/* Live Distance Meter Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-blue-200 block">Jarak Anda ke Titik Sekolah</span>
            <div className="text-2xl font-black text-white flex items-baseline gap-1 mt-0.5">
              {distance !== null ? `${distance} m` : "..."}
              <span className="text-xs font-normal text-blue-200">dari gerbang</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-blue-200 block">Status Validasi</span>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
              isWithinRadius
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-red-500/80 text-white"
            }`}>
              {isWithinRadius ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dalam Area
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" /> Luar Radius
                </>
              )}
            </span>
          </div>
        </div>

        {/* Live Coordinates Detail */}
        <div className="text-[11px] font-mono text-blue-200/90 bg-black/20 p-2.5 rounded-xl flex items-center justify-between">
          <span>Lat: {currentCoords ? currentCoords.lat.toFixed(6) : "-"}</span>
          <span>Lng: {currentCoords ? currentCoords.lng.toFixed(6) : "-"}</span>
          <span className="text-[10px] text-emerald-300">±{currentCoords ? currentCoords.accuracy.toFixed(1) : "-"}m</span>
        </div>

        {/* 1-Tap Action Button */}
        {!attendedSuccess ? (
          <button
            onClick={handlePresensi}
            disabled={!isWithinRadius || loading}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
              isWithinRadius && !loading
                ? "bg-white text-blue-700 hover:bg-blue-50 active:scale-[0.98] shadow-white/20"
                : "bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>
              {isWithinRadius 
                ? "Kirim Presensi Hadir Sekarang (1-Tap)" 
                : "Belum Memenuhi Radius (Dekati Area Sekolah)"}
            </span>
          </button>
        ) : (
          <div className="w-full py-3 px-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Presensi Berhasil Dicatat Pukul {attendedTime}</span>
          </div>
        )}
      </div>

      {/* Info Tanpa Foto Sesuai Permintaan */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          Sistem presensi PELITA menggunakan verifikasi koordinat GPS Geofencing berkecepatan tinggi <strong>tanpa memerlukan unggah foto</strong> agar proses lebih cepat dan hemat data.
        </p>
      </div>

      {/* Riwayat Presensi Pekan Ini */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
            <History className="w-3.5 h-3.5 text-blue-600" />
            Riwayat Presensi Pekan Ini
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            100% Hadir
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {attendanceHistory.map((item, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{item.date}</h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" /> {item.time} • Radius: {item.distance}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-lg">
                Tepat Waktu
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
