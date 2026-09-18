"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  AlertOctagon,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Users,
} from "lucide-react"
import { updateViolationStatus } from "@/app/actions/teacher"
import {
  getViolationRecords,
  getViolationSummary,
  deleteViolation,
} from "@/app/actions/kesiswaan"

const STATUS = [
  { key: "OPEN", label: "Belum ditindak", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "FOLLOW_UP", label: "Sedang ditindak", cls: "bg-blue-50 text-blue-800 border-blue-200" },
  { key: "CLOSED", label: "Selesai", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
]

export default function TeacherPelanggaranPage() {
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  const load = async () => {
    const [r, s] = await Promise.all([getViolationRecords(), getViolationSummary()])
    setRecords(r)
    setSummary(s)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const beriToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(""), 3500)
  }

  const ubahStatus = async (id: string, status: string) => {
    setError("")
    setBusy(id)
    const res = await updateViolationStatus({ id, status, followUp: followUp[id] })
    setBusy(null)
    if (res.error) {
      setError(res.error)
      return
    }
    beriToast("Status tindak lanjut diperbarui.")
    await load()
  }

  const hapus = async (id: string, nama: string) => {
    if (
      !confirm(
        `Hapus catatan pelanggaran ${nama}?\n\nPoinnya dikembalikan dan nilai karakter siswa naik lagi.`
      )
    )
      return
    setBusy(id)
    const res = await deleteViolation(id)
    setBusy(null)
    if (res.error) {
      setError(res.error)
      return
    }
    beriToast("Catatan dihapus.")
    await load()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-red-600" />
        <span className="text-xs text-slate-500">Memuat catatan pelanggaran...</span>
      </div>
    )
  }

  const belum = records.filter((r) => r.status === "OPEN").length

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href="/teacher"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Catatan Pelanggaran Saya
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {records.length} catatan • {belum} belum ditindak
          </p>
        </div>
      </div>

      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
        Daftar ini hanya memuat catatan yang <strong>Anda sendiri</strong> laporkan.
        Untuk mencatat pelanggaran baru, gunakan menu <strong>Catatan Disiplin</strong>{" "}
        di beranda guru. Jenis dan poinnya diatur admin di menu Kesiswaan.
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {records.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center flex flex-col items-center gap-3">
          <AlertOctagon className="w-10 h-10 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Catatan</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Anda belum mencatat pelanggaran siswa mana pun.
          </p>
        </div>
      ) : (
        <>
          {/* Rekap poin siswa yang Anda laporkan */}
          {summary.length > 0 && (
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-red-600" />
                Rekap Poin ({summary.length} siswa)
              </h3>
              {summary.slice(0, 8).map((s) => (
                <div
                  key={s.student.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <span className="min-w-0 truncate">
                    <strong className="text-slate-800">{s.student.name}</strong>
                    {s.kelas && <span className="text-slate-400"> · {s.kelas}</span>}
                  </span>
                  <span className="shrink-0 font-bold text-red-600">
                    −{s.totalPoin}{" "}
                    <span className="text-slate-400 font-normal">
                      (sisa {s.sisaPoin})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {records.map((r) => {
              const st = STATUS.find((x) => x.key === r.status) || STATUS[0]
              const kelas = r.student?.studentClasses?.[0]?.classInfo?.name
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {r.student?.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {kelas ? `${kelas} • ` : ""}
                        {new Date(r.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-red-600">
                        −{r.points}
                      </span>
                      <span className="text-[9px] text-slate-400 block">poin</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2">
                    {r.description}
                    {r.category && <span className="text-slate-400"> · {r.category}</span>}
                  </p>

                  {r.followUp && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-2">
                      <strong>Tindak lanjut:</strong> {r.followUp}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border self-start ${st.cls}`}
                    >
                      {st.label}
                    </span>

                    <input
                      value={followUp[r.id] ?? r.followUp ?? ""}
                      onChange={(e) =>
                        setFollowUp((p) => ({ ...p, [r.id]: e.target.value }))
                      }
                      placeholder="Catatan tindak lanjut (mis. sudah dipanggil wali)"
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
                    />

                    <div className="flex gap-1.5">
                      {STATUS.filter((x) => x.key !== r.status).map((x) => (
                        <button
                          key={x.key}
                          onClick={() => ubahStatus(r.id, x.key)}
                          disabled={busy === r.id}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition disabled:opacity-50"
                        >
                          {busy === r.id ? "..." : `→ ${x.label}`}
                        </button>
                      ))}
                      <button
                        onClick={() => hapus(r.id, r.student?.name || "siswa ini")}
                        disabled={busy === r.id}
                        title="Hapus catatan (salah input)"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
