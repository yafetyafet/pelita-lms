"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Navigation,
  ShieldCheck,
  Building2,
  LogOut
} from "lucide-react"
import { submitAttendance, submitCheckOut, getTodayAttendance, getAttendanceConfig } from "@/app/actions/student"

/**
 * Titik sekolah TIDAK boleh ditulis di sini.
 *
 * Sebelumnya berkas ini memuat koordinat tetap (-7.472145, 109.381210) dengan
 * radius 120 m, terpisah sama sekali dari yang diatur admin di
 * /admin/attendance-settings. Karena tombol presensi diblokir di sisi klien
 * berdasarkan angka itu, siswa yang benar-benar berada di sekolah bisa ikut
 * terhalang dan jarak yang ditampilkan salah. Sekarang nilainya diambil dari
 * pengaturan admin lewat getAttendanceConfig().
 */
type Geofence = {
  lat: number | null
  lng: number | null
  radius: number | null
  batasMasuk: string
  jamPulang: string
  terkonfigurasi: boolean
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3
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
  // Titik & radius sekolah dibaca dari pengaturan admin, bukan ditulis di kode.
  const [geo, setGeo] = useState<Geofence | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>("Menunggu pendeteksian lokasi...")
  
  // Real DB state
  const [attended, setAttended] = useState(false)
  const [attendedTime, setAttendedTime] = useState<string | null>(null)
  const [checkedOut, setCheckedOut] = useState(false)
  const [checkOutTimeStr, setCheckOutTimeStr] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initial load
  useEffect(() => {
    async function fetchAttendance() {
      const data = await getTodayAttendance()
      if (data) {
        setAttended(true)
        setAttendedTime(new Date(data.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB")
        if (data.checkOutTime) {
          setCheckedOut(true)
          setCheckOutTimeStr(new Date(data.checkOutTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB")
        }
      }
    }
    fetchAttendance()

    // Pengaturan harus tiba lebih dulu, karena perhitungan jarak
    // bergantung padanya.
    getAttendanceConfig().then((cfg) => {
      setGeo(cfg)
      detectLocation(cfg)
    })
  }, [])

  const detectLocation = (cfg: Geofence | null) => {
    setLoading(true)
    setStatusMessage("Mendeteksi sinyal satelit GPS...")

    if (!navigator.geolocation) {
      setStatusMessage("Browser Anda tidak mendukung deteksi lokasi.")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setCurrentCoords({ lat: latitude, lng: longitude, accuracy })

        // Kalau admin belum mengisi titik sekolah, tidak ada yang bisa
        // dibandingkan. Presensi tetap boleh dikirim — server yang menandainya
        // sebagai perlu ditinjau.
        if (!cfg?.terkonfigurasi || cfg.lat === null || cfg.lng === null || cfg.radius === null) {
          setDistance(null)
          setIsWithinRadius(true)
          setStatusMessage(
            "Titik sekolah belum diatur admin, jadi lokasi tidak divalidasi. Presensi akan ditandai untuk ditinjau guru."
          )
          setLoading(false)
          return
        }

        const dist = calculateDistance(latitude, longitude, cfg.lat, cfg.lng)
        setDistance(dist)
        const valid = dist <= cfg.radius
        setIsWithinRadius(valid)
        setStatusMessage(
          valid
            ? `Berada dalam radius sekolah (${dist} meter)`
            : `Di luar radius sekolah (${dist} meter, maksimal ${cfg.radius} meter)`
        )
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setStatusMessage("Izin GPS tidak diberikan atau GPS belum aktif. Pastikan izinkan lokasi di peramban Anda.")
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handlePresensi = async () => {
    // Radius tidak lagi memblokir pengiriman di sisi klien: validasi
    // sebenarnya ada di server, yang memakai pengaturan admin dan menandai
    // presensi di luar radius sebagai "perlu verifikasi" alih-alih menolaknya.
    // Pemblokiran sebelumnya membuat siswa terhalang bila koordinat di kode
    // tidak sama dengan pengaturan sekolah.
    if (!currentCoords || isSubmitting) return
    setIsSubmitting(true)
    
    if (!attended) {
      const res = await submitAttendance(currentCoords.lat, currentCoords.lng)
      if (res.success) {
        const now = new Date()
        setAttended(true)
        setAttendedTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB")
      } else {
        alert(res.error || "Gagal melakukan presensi")
      }
    } else if (!checkedOut) {
      const res = await submitCheckOut(currentCoords.lat, currentCoords.lng)
      if (res.success) {
        const now = new Date()
        setCheckedOut(true)
        setCheckOutTimeStr(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB")
      } else {
        alert(res.error || "Gagal melakukan presensi pulang")
      }
    }
    setIsSubmitting(false)
  }

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
          onClick={() => detectLocation(geo)}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-blue-600 hover:bg-blue-50 transition shadow-sm flex items-center gap-1 text-xs font-semibold"
          title="Segarkan Titik GPS"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
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
              <h3 className="text-sm font-bold text-white">Titik Presensi Sekolah</h3>
            </div>
          </div>
          <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-semibold">
            {geo?.terkonfigurasi ? `Maks Radius: ${geo.radius}m` : "Radius belum diatur"}
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
        <div className="flex flex-col gap-2 mt-1">
          {!attended ? (
            <button
              onClick={handlePresensi}
              disabled={loading || isSubmitting || !currentCoords}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                isWithinRadius && !loading
                  ? "bg-white text-blue-700 hover:bg-blue-50 active:scale-[0.98] shadow-white/20"
                  : "bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-700"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Memproses..."
                  : isWithinRadius
                    ? "Kirim Presensi Hadir (1-Tap)"
                    : "Kirim Presensi (di luar radius, akan ditinjau)"}
              </span>
            </button>
          ) : (
            <div className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
              <span>Masuk Berhasil: {attendedTime}</span>
            </div>
          )}

          {attended && !checkedOut && (
            <button
              onClick={handlePresensi}
              disabled={loading || isSubmitting || !currentCoords}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                isWithinRadius && !loading
                  ? "bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98] shadow-rose-500/30"
                  : "bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-700"
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Memproses..."
                  : isWithinRadius
                    ? "Kirim Presensi Pulang (1-Tap)"
                    : "Kirim Presensi Pulang (di luar radius, akan ditinjau)"}
              </span>
            </button>
          )}

          {checkedOut && (
            <div className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 shadow-lg">
              <LogOut className="w-4 h-4" />
              <span>Pulang Berhasil: {checkOutTimeStr}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <Navigation className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block mb-1">Catatan Penting GPS</span>
          <p className="opacity-90 leading-relaxed mb-1">
            Presensi ini murni memverifikasi koordinat GPS ponsel Anda tanpa perlu mengunggah foto selfie.
          </p>
          <p className="opacity-90 leading-relaxed">
            Pastikan memberikan **Izin Lokasi (Allow Location)** pada peramban/browser Anda agar sistem dapat mendeteksi radius kampus secara akurat.
          </p>
        </div>
      </div>
      
      {/* Bottom padding */}
      <div className="h-20"></div>
    </div>
  )
}
