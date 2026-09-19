"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Save,
  Loader2,
  Navigation,
  AlertCircle,
  Building2,
  Clock,
} from "lucide-react"
import { getAppSetting, setAppSetting } from "@/app/actions/admin"

type Gedung = {
  nama: string
  lat: string
  lng: string
  radius: string
}

/** Jarak haversine, untuk memperingatkan koordinat yang keliru. */
function jarakMeter(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371e3
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

const angka = (v: string) => {
  const n = Number(v)
  return v.trim() !== "" && Number.isFinite(n) ? n : null
}

export default function AdminAttendanceSettingsPage() {
  // Gedung 1 memakai kunci lama supaya pengaturan yang sudah ada tetap terbaca.
  const [g1, setG1] = useState<Gedung>({
    nama: "Gedung 1",
    lat: "",
    lng: "",
    radius: "50",
  })
  const [g2, setG2] = useState<Gedung>({
    nama: "Gedung 2",
    lat: "",
    lng: "",
    radius: "",
  })

  const [timeLimit, setTimeLimit] = useState("07:00")
  const [checkOutTime, setCheckOutTime] = useState("15:00")

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadSettings() {
      const [
        lat1, lng1, radius1, nama1,
        lat2, lng2, radius2, nama2,
        savedTimeLimit, savedCheckOutTime,
      ] = await Promise.all([
        getAppSetting("SCHOOL_LATITUDE"),
        getAppSetting("SCHOOL_LONGITUDE"),
        getAppSetting("ATTENDANCE_RADIUS"),
        getAppSetting("SCHOOL_SITE1_NAME"),
        getAppSetting("SCHOOL_LATITUDE_2"),
        getAppSetting("SCHOOL_LONGITUDE_2"),
        getAppSetting("ATTENDANCE_RADIUS_2"),
        getAppSetting("SCHOOL_SITE2_NAME"),
        getAppSetting("ATTENDANCE_TIME_LIMIT"),
        getAppSetting("ATTENDANCE_CHECKOUT_TIME"),
      ])

      setG1({
        nama: nama1 || "Gedung 1",
        lat: lat1 || "",
        lng: lng1 || "",
        radius: radius1 || "50",
      })
      setG2({
        nama: nama2 || "Gedung 2",
        lat: lat2 || "",
        lng: lng2 || "",
        radius: radius2 || "",
      })
      if (savedTimeLimit) setTimeLimit(savedTimeLimit)
      if (savedCheckOutTime) setCheckOutTime(savedCheckOutTime)
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (angka(g1.lat) === null || angka(g1.lng) === null || angka(g1.radius) === null) {
      setError("Koordinat dan radius gedung utama wajib diisi.")
      return
    }

    // Gedung kedua boleh dikosongkan, tapi tidak boleh terisi setengah —
    // koordinat yang tidak lengkap akan diabaikan diam-diam oleh server.
    const g2Terisi = [g2.lat, g2.lng].some((v) => v.trim() !== "")
    if (g2Terisi && (angka(g2.lat) === null || angka(g2.lng) === null)) {
      setError("Gedung kedua terisi sebagian. Isi latitude dan longitude-nya, atau kosongkan keduanya.")
      return
    }

    setIsSaving(true)
    await Promise.all([
      setAppSetting("SCHOOL_LATITUDE", g1.lat.trim()),
      setAppSetting("SCHOOL_LONGITUDE", g1.lng.trim()),
      setAppSetting("ATTENDANCE_RADIUS", g1.radius.trim()),
      setAppSetting("SCHOOL_SITE1_NAME", g1.nama.trim() || "Gedung 1"),
      setAppSetting("SCHOOL_LATITUDE_2", g2.lat.trim()),
      setAppSetting("SCHOOL_LONGITUDE_2", g2.lng.trim()),
      setAppSetting("ATTENDANCE_RADIUS_2", g2.radius.trim()),
      setAppSetting("SCHOOL_SITE2_NAME", g2.nama.trim() || "Gedung 2"),
      setAppSetting("ATTENDANCE_TIME_LIMIT", timeLimit),
      setAppSetting("ATTENDANCE_CHECKOUT_TIME", checkOutTime),
    ])

    setToast("Pengaturan presensi dan koordinat berhasil disimpan.")
    setTimeout(() => setToast(null), 3500)
    setIsSaving(false)
  }

  const ambilLokasi = (set: (g: Gedung) => void, g: Gedung) => {
    if (!navigator.geolocation) {
      setError("Peramban ini tidak mendukung deteksi lokasi.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        set({
          ...g,
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
        }),
      (err) => setError("Gagal mendapatkan lokasi: " + err.message),
      { enableHighAccuracy: true }
    )
  }

  // Peringatan bila dua titik terlalu berdekatan atau radiusnya tumpang tindih.
  const lat1 = angka(g1.lat), lng1 = angka(g1.lng)
  const lat2 = angka(g2.lat), lng2 = angka(g2.lng)
  const r1 = angka(g1.radius) ?? 0
  const r2 = angka(g2.radius) ?? r1
  const jarakAntar =
    lat1 !== null && lng1 !== null && lat2 !== null && lng2 !== null
      ? jarakMeter(lat1, lng1, lat2, lng2)
      : null
  const tumpangTindih = jarakAntar !== null && jarakAntar < r1 + r2

  const kartuGedung = (
    g: Gedung,
    set: (v: Gedung) => void,
    utama: boolean
  ) => (
    <div
      className={`flex flex-col gap-3 p-4 rounded-2xl border ${
        utama ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50/60 border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <Building2 className={`w-4 h-4 ${utama ? "text-emerald-600" : "text-slate-500"}`} />
        <input
          type="text"
          value={g.nama}
          onChange={(e) => set({ ...g, nama: e.target.value })}
          placeholder={utama ? "Gedung 1" : "Gedung 2"}
          className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 shrink-0">
          {utama ? "WAJIB" : "OPSIONAL"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold text-slate-600 block mb-1">Latitude</label>
          <input
            type="text"
            value={g.lat}
            onChange={(e) => set({ ...g, lat: e.target.value })}
            placeholder="-7.472145"
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-600 block mb-1">Longitude</label>
          <input
            type="text"
            value={g.lng}
            onChange={(e) => set({ ...g, lng: e.target.value })}
            placeholder="109.381210"
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-600 block mb-1">
          Radius Maksimal (meter)
        </label>
        <input
          type="number"
          min="10"
          max="5000"
          value={g.radius}
          onChange={(e) => set({ ...g, radius: e.target.value })}
          placeholder={utama ? "50" : `Kosongkan = ikut ${g1.radius || "radius gedung 1"}`}
          className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      <button
        type="button"
        onClick={() => ambilLokasi(set, g)}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border-2 border-dashed border-emerald-500 text-emerald-600 font-bold text-[11px] hover:bg-emerald-50 transition"
      >
        <Navigation className="w-3.5 h-3.5" />
        Pakai Lokasi Saya Sekarang
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1 mb-2">
        <Link
          href="/admin"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Aturan Presensi &amp; Lokasi
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Zona presensi (geofencing) dan jam presensi
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Zona Presensi Siswa
          </h3>
        </div>

        {isLoading ? (
          <PemuatData pesan="Memuat pengaturan..." />
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {error && (
              <p className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800 leading-relaxed">
                <strong className="block mb-1">Dua gedung sekolah</strong>
                Presensi siswa dianggap sah bila berada dalam radius{" "}
                <strong>salah satu</strong> gedung di bawah — berlaku untuk
                presensi masuk maupun pulang. Isi gedung kedua hanya kalau
                sekolah memang menempati dua lokasi; kalau dikosongkan, sistem
                bekerja seperti semula dengan satu titik saja.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {kartuGedung(g1, setG1, true)}
              {kartuGedung(g2, setG2, false)}
            </div>

            {jarakAntar !== null && (
              <p
                className={`text-[11px] rounded-xl px-3 py-2 border leading-relaxed ${
                  tumpangTindih
                    ? "text-amber-900 bg-amber-50 border-amber-200"
                    : "text-slate-600 bg-slate-50 border-slate-200"
                }`}
              >
                Jarak antar gedung: <strong>{(jarakAntar / 1000).toFixed(2)} km</strong>
                {tumpangTindih && (
                  <>
                    {" "}— radius kedua zona saling bertumpuk. Perkecil radiusnya,
                    atau periksa kembali koordinatnya: siswa di satu gedung akan
                    terhitung berada di gedung yang lain.
                  </>
                )}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Jam Presensi
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Batas Waktu Masuk
                  </label>
                  <input
                    type="time"
                    required
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Presensi setelah jam ini tercatat sebagai terlambat.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Jam Pulang Cadangan
                  </label>
                  <input
                    type="time"
                    required
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Presensi pulang kini mengikuti <strong>jam pelajaran
                    terakhir hari itu</strong> secara otomatis. Nilai ini hanya
                    dipakai bila hari tersebut tidak punya jadwal sama sekali.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-1 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Pengaturan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
