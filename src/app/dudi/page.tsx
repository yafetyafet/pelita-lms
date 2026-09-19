"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import { getCurrentUser, logout } from "@/app/actions/auth"
import { getMentorDashboard, verifyPklJournal } from "@/app/actions/pkl"
import { getMyBroadcasts } from "@/app/actions/broadcast"
import {
  Building2,
  MapPin,
  Sparkles,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Megaphone,
  Clock,
} from "lucide-react"

export default function DudiDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [dash, setDash] = useState<any>(null)
  const [pengumuman, setPengumuman] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const load = async () => {
    const [user, d, b] = await Promise.all([
      getCurrentUser(),
      getMentorDashboard(),
      getMyBroadcasts(5),
    ])
    setCurrentUser(user)
    setDash(d)
    setPengumuman(b)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const verifikasi = async (
    journalId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    setError("")
    setBusy(journalId)
    const res = await verifyPklJournal({
      journalId,
      status,
      mentorNote: notes[journalId],
    })
    setBusy(null)

    if (res.error) {
      setError(res.error)
      return
    }
    setToast(status === "APPROVED" ? "Jurnal disetujui." : "Jurnal ditolak.")
    setTimeout(() => setToast(""), 3500)
    await load()
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat data bimbingan..." />
    )
  }

  const totalSiswa = dash?.totalSiswa ?? 0
  const hadirHariIni = dash?.hadirHariIni ?? 0
  const jurnalMenunggu = dash?.jurnalMenunggu ?? []

  return (
    <div className="flex flex-col gap-4 p-4 pb-16">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-purple-600/20 ring-2 ring-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {currentUser?.name || "Mitra Industri"}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {currentUser?.username
                ? `@${currentUser.username} • Pembimbing Industri`
                : "Pembimbing Lapangan DUDI"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-lg">
            Mitra DUDI
          </span>
          <button
            onClick={() => logout()}
            className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
            title="Keluar / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-950 p-4 text-white shadow-lg shadow-purple-900/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-200">
              Monitoring Praktik Kerja Lapangan
            </span>
          </div>
          <span className="text-xs text-purple-300 font-medium">
            {dash?.dateKey}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white mb-1">
          {dash?.partners?.length
            ? dash.partners.map((p: any) => p.name).join(", ")
            : "Belum ada industri terhubung ke akun Anda"}
        </h3>
        <p className="text-xs text-purple-200/90 leading-relaxed mb-3">
          {totalSiswa > 0
            ? `${totalSiswa} siswa sedang menjalani PKL di bawah bimbingan Anda.`
            : "Admin sekolah belum menempatkan siswa PKL ke industri Anda."}
        </p>

        <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-white/10">
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] text-purple-200 block">Siswa</span>
            <span className="text-base font-bold text-white">{totalSiswa}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] text-purple-200 block">Hadir</span>
            <span className="text-base font-bold text-emerald-300">
              {hadirHariIni}
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center">
            <span className="text-[10px] text-purple-200 block">Jurnal</span>
            <span className="text-base font-bold text-amber-300">
              {jurnalMenunggu.length}
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

      {/* Pengumuman sekolah */}
      {pengumuman.length > 0 && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-purple-600" />
            Pengumuman Sekolah
          </h3>
          {pengumuman.map((b) => (
            <div
              key={b.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"
            >
              <p className="text-[11px] font-bold text-slate-800">{b.title}</p>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {b.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Presensi siswa PKL */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Presensi GPS Siswa PKL
            </h3>
            <p className="text-[10px] text-slate-500">
              Terverifikasi terhadap geofence perusahaan
            </p>
          </div>
        </div>

        {totalSiswa === 0 ? (
          <div className="text-center text-xs text-slate-400 italic py-4">
            Belum ada siswa PKL yang terdaftar di lokasi industri Anda.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dash.partners.map((p: any) =>
              p.siswa.map((s: any) => {
                const a = s.presensiHariIni
                return (
                  <div
                    key={s.placementId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {s.student.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        @{s.student.username}
                        {s.supervisor?.name && ` • Pembimbing ${s.supervisor.name}`}
                      </p>
                    </div>

                    {a ? (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded capitalize">
                          {a.status.replace(/_/g, " ")}
                        </span>
                        {a.distance != null && (
                          <span className="text-[9px] text-slate-400 block mt-0.5">
                            {a.distance} m
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shrink-0">
                        Belum absen
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Verifikasi jurnal */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Jurnal Menunggu Verifikasi
            </h3>
            <p className="text-[10px] text-slate-500">
              Setujui atau tolak laporan harian siswa
            </p>
          </div>
        </div>

        {jurnalMenunggu.length === 0 ? (
          <div className="text-center text-xs text-slate-400 italic py-4">
            Tidak ada jurnal yang menunggu verifikasi.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {jurnalMenunggu.map((j: any) => (
              <div
                key={j.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {j.placement.student.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(j.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {j.activity}
                </p>
                {j.notes && (
                  <p className="text-[11px] text-slate-500 italic">{j.notes}</p>
                )}
                {j.fileUrl && (
                  <a
                    href={j.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:underline break-all"
                  >
                    Lihat dokumentasi
                  </a>
                )}

                <input
                  value={notes[j.id] || ""}
                  onChange={(e) =>
                    setNotes((p) => ({ ...p, [j.id]: e.target.value }))
                  }
                  placeholder="Catatan pembimbing (opsional)"
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px]"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => verifikasi(j.id, "APPROVED")}
                    disabled={busy === j.id}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {busy === j.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Setujui
                  </button>
                  <button
                    onClick={() => verifikasi(j.id, "REJECTED")}
                    disabled={busy === j.id}
                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
