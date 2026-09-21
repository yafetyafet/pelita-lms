"use client"

import React, { useState } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  CalendarDays,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  BookText,
} from "lucide-react"
import {
  getMyPlacement,
  createPklJournal,
  submitPklAttendance,
} from "@/app/actions/pkl"

const BADGE: Record<string, { cls: string; label: string }> = {
  APPROVED: { cls: "bg-emerald-100 text-emerald-700", label: "Disetujui" },
  REJECTED: { cls: "bg-red-100 text-red-700", label: "Ditolak" },
  PENDING: { cls: "bg-amber-100 text-amber-800", label: "Menunggu" },
}

export function IsiPkl({ awal }: { awal: Awaited<ReturnType<typeof getMyPlacement>> }) {
  const [data, setData] = useState<any>(awal)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  const [activity, setActivity] = useState("")
  const [notes, setNotes] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [absen, setAbsen] = useState(false)

  const load = async () => {
    const res = await getMyPlacement()
    setData(res)
    setIsLoading(false)
  }


  const beriToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(""), 4000)
  }

  const kirimJurnal = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    const res = await createPklJournal({ activity, notes, fileUrl })
    setSaving(false)

    if (res.error) {
      setError(res.error)
      return
    }
    setActivity("")
    setNotes("")
    setFileUrl("")
    beriToast("Jurnal terkirim, menunggu verifikasi pembimbing industri.")
    await load()
  }

  const presensi = () => {
    setError("")
    if (!navigator.geolocation) {
      setError("Perangkat ini tidak mendukung layanan lokasi.")
      return
    }

    setAbsen(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await submitPklAttendance(
          pos.coords.latitude,
          pos.coords.longitude
        )
        setAbsen(false)
        if (res.error) setError(res.error)
        else {
          beriToast(res.pesan || "Presensi PKL tercatat.")
          await load()
        }
      },
      async (err) => {
        // Izin lokasi ditolak: tetap kirim agar tercatat "tanpa lokasi" dan
        // bisa ditinjau pembimbing, sama seperti presensi sekolah.
        const res = await submitPklAttendance(NaN, NaN)
        setAbsen(false)
        if (res.error) setError(`${err.message}. ${res.error}`)
        else {
          beriToast(res.pesan || "Presensi tercatat tanpa data lokasi.")
          await load()
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat data PKL..." />
    )
  }

  const header = (
    <div className="flex items-center gap-2.5 pt-1">
      <Link
        href="/student"
        className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
      </Link>
      <div>
        <h2 className="text-base font-bold text-slate-900 leading-tight">
          Praktik Kerja Lapangan
        </h2>
        <p className="text-[11px] text-slate-500 font-medium">
          Jurnal harian & presensi di lokasi industri
        </p>
      </div>
    </div>
  )

  if (!data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {header}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-3">
          <Building2 className="w-12 h-12 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Penempatan</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Kamu belum ditempatkan di mitra industri mana pun. Hubungi guru
            pembimbing atau admin sekolah.
          </p>
        </div>
      </div>
    )
  }

  const presensiHariIni = data.attendances?.[0]
  const hariIni = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const sudahAbsen = presensiHariIni?.dateKey === hariIni

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2 max-w-[92vw]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {header}

      {/* Kartu penempatan */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-950 p-4 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-purple-300" />
          <span className="text-[10px] font-bold tracking-wider uppercase text-purple-200">
            Mitra Industri
          </span>
        </div>
        <h3 className="text-sm font-bold text-white">{data.partner.name}</h3>
        {data.partner.address && (
          <p className="text-[11px] text-purple-200/90 mt-0.5 flex items-start gap-1">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
            {data.partner.address}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs pt-3 mt-3 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-2">
            <span className="text-[10px] text-purple-200 block">Periode</span>
            <span className="text-[11px] font-bold text-white">
              {new Date(data.startDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}{" "}
              –{" "}
              {new Date(data.endDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2">
            <span className="text-[10px] text-purple-200 block">
              Pembimbing Sekolah
            </span>
            <span className="text-[11px] font-bold text-white">
              {data.supervisor?.name || "Belum ditentukan"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Presensi */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Presensi Hari Ini</h3>
            <p className="text-[10px] text-slate-500">
              Divalidasi terhadap lokasi industri (radius {data.partner.radius} m)
            </p>
          </div>
        </div>

        {sudahAbsen ? (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-[11px]">
              <strong className="text-emerald-800 capitalize">
                {presensiHariIni.status.replace(/_/g, " ")}
              </strong>
              <span className="text-emerald-700">
                {presensiHariIni.distance != null &&
                  ` • ${presensiHariIni.distance} m dari lokasi industri`}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={presensi}
            disabled={absen}
            className="py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {absen ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span>{absen ? "Mengambil lokasi..." : "Presensi Sekarang"}</span>
          </button>
        )}
      </div>

      {/* Form jurnal */}
      <form
        onSubmit={kirimJurnal}
        className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
            <BookText className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Tulis Jurnal Harian</h3>
        </div>

        <textarea
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          rows={3}
          placeholder="Uraian kegiatan hari ini..."
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y"
          required
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Catatan/kendala (opsional)"
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y"
        />
        <input
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="Tautan foto/dokumentasi (opsional)"
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        />

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{saving ? "Mengirim..." : "Kirim Jurnal"}</span>
        </button>
      </form>

      {/* Riwayat jurnal */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-indigo-600" />
          Riwayat Jurnal ({data.journals.length})
        </h3>

        {data.journals.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            Belum ada jurnal. Mulai tulis kegiatan harianmu di atas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.journals.map((j: any) => {
              const b = BADGE[j.status] || BADGE.PENDING
              return (
                <div
                  key={j.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(j.date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${b.cls}`}
                    >
                      {b.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {j.activity}
                  </p>

                  {j.notes && (
                    <p className="text-[11px] text-slate-500 italic">{j.notes}</p>
                  )}

                  {j.mentorNote && (
                    <p
                      className={`text-[11px] rounded-xl px-2.5 py-2 border flex items-start gap-1.5 ${
                        j.status === "REJECTED"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-emerald-50 border-emerald-200 text-emerald-800"
                      }`}
                    >
                      {j.status === "REJECTED" ? (
                        <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      )}
                      <span>
                        <strong>Catatan pembimbing:</strong> {j.mentorNote}
                      </span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
