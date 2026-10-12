"use client"

import React, { useState, useEffect, useMemo, use as useUnwrap } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  Clock,
  Users,
  FileText,
  Search,
  ExternalLink,
  Award,
  Filter,
} from "lucide-react"
import { getAssignmentSubmissions, saveGrade } from "@/app/actions/teacher"
import { TampilanDeskripsiTugas } from "@/components/TampilanDeskripsiTugas"

export default function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = useUnwrap(params)

  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  // Filter & Pencarian
  const [tabAktif, setTabAktif] = useState<"semua" | "menunggu" | "dinilai" | "belum">("semua")
  const [cari, setCari] = useState("")

  // Nilai & catatan per baris
  const [draft, setDraft] = useState<Record<string, { score: string; note: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const load = async () => {
    const res = await getAssignmentSubmissions(id)
    if (!res) {
      setError("Tugas tidak ditemukan atau kamu tidak berhak membukanya.")
      setIsLoading(false)
      return
    }
    setData(res)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const nilai = async (userId: string) => {
    const d = draft[userId]
    if (!d || d.score === "") {
      setError("Isi nilainya terlebih dahulu.")
      return
    }

    const skorAngka = Number(d.score)
    if (isNaN(skorAngka) || skorAngka < 0) {
      setError("Nilai harus berupa angka yang valid.")
      return
    }

    setError("")
    setSaving(userId)
    const res = await saveGrade({
      userId,
      assignmentId: id,
      score: skorAngka,
      description: d.note,
    })
    setSaving(null)

    if (res.error) {
      setError(res.error)
      return
    }

    setToast("Nilai berhasil disimpan!")
    setTimeout(() => setToast(""), 3000)
    setDraft((p) => {
      const next = { ...p }
      delete next[userId]
      return next
    })
    await load()
  }

  const setNilaiCepat = (userId: string, nilaiCepat: number, catatanLama: string) => {
    setDraft((p) => ({
      ...p,
      [userId]: {
        score: String(nilaiCepat),
        note: p[userId]?.note ?? catatanLama ?? "",
      },
    }))
  }

  // Statistik pengumpulan
  const stats = useMemo(() => {
    if (!data?.rows) return { total: 0, terkumpul: 0, dinilai: 0, belum: 0, menunggu: 0 }
    let terkumpul = 0
    let dinilai = 0
    let belum = 0
    let menunggu = 0

    data.rows.forEach((r: any) => {
      const sub = r.submission
      if (!sub || !sub.submittedAt) {
        belum++
      } else if (sub.status === "GRADED") {
        terkumpul++
        dinilai++
      } else {
        terkumpul++
        menunggu++
      }
    })

    return { total: data.rows.length, terkumpul, dinilai, belum, menunggu }
  }, [data])

  // Filter baris siswa
  const siswaTerfilter = useMemo(() => {
    if (!data?.rows) return []

    return data.rows.filter((r: any) => {
      const sub = r.submission
      const isBelum = !sub || !sub.submittedAt
      const isDinilai = sub?.status === "GRADED"
      const isMenunggu = sub && sub.submittedAt && sub.status !== "GRADED"

      if (tabAktif === "belum" && !isBelum) return false
      if (tabAktif === "dinilai" && !isDinilai) return false
      if (tabAktif === "menunggu" && !isMenunggu) return false

      if (cari.trim()) {
        const q = cari.toLowerCase()
        const matchNama = r.student.name?.toLowerCase().includes(q)
        const matchUsername = r.student.username?.toLowerCase().includes(q)
        if (!matchNama && !matchUsername) return false
      }

      return true
    })
  }, [data, tabAktif, cari])

  if (isLoading) {
    return <PemuatData pesan="Memuat lembar pengumpulan tugas siswa..." />
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
        <Link
          href="/teacher/assignments"
          className="p-2.5 w-fit rounded-2xl bg-white border border-slate-200/80 text-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">{error || "Data tugas tidak ditemukan."}</p>
        </div>
      </div>
    )
  }

  const maxScore = data.assignment.maxScore ?? 100

  return (
    <div className="flex flex-col gap-4 p-4 pb-28 max-w-4xl mx-auto">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href="/teacher/assignments"
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
            {data.assignment.title}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {data.assignment.classInfo?.name} • {data.assignment.subject?.name} • Nilai Maks: {maxScore}
          </p>
        </div>
      </div>

      {/* Statistik Cepat */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Siswa</span>
          <span className="text-lg font-black text-slate-900 mt-0.5">{stats.total}</span>
        </div>

        <div
          onClick={() => setTabAktif("menunggu")}
          className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col items-center text-center ${
            stats.menunggu > 0
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-100"
              : "bg-white border-slate-200/80"
          }`}
        >
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Menunggu Nilai</span>
          <span className="text-lg font-black text-amber-800 mt-0.5">{stats.menunggu}</span>
        </div>

        <div
          onClick={() => setTabAktif("dinilai")}
          className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition"
        >
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Sudah Dinilai</span>
          <span className="text-lg font-black text-emerald-700 mt-0.5">{stats.dinilai}</span>
        </div>

        <div
          onClick={() => setTabAktif("belum")}
          className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 transition"
        >
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Belum Kumpul</span>
          <span className="text-lg font-black text-rose-700 mt-0.5">{stats.belum}</span>
        </div>
      </div>

      {/* Lembar Soal / Instruksi yang Diberikan Guru */}
      {data.assignment.description && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-emerald-600" />
            Instruksi / Lembar Soal Tugas Ini:
          </h3>
          <TampilanDeskripsiTugas description={data.assignment.description} />
        </div>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Filter Tab & Pencarian Siswa */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTabAktif("semua")}
            className={`py-1.5 px-2 rounded-lg transition text-center ${
              tabAktif === "semua" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setTabAktif("menunggu")}
            className={`py-1.5 px-2 rounded-lg transition text-center ${
              tabAktif === "menunggu" ? "bg-white text-amber-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Menunggu ({stats.menunggu})
          </button>
          <button
            type="button"
            onClick={() => setTabAktif("dinilai")}
            className={`py-1.5 px-2 rounded-lg transition text-center ${
              tabAktif === "dinilai" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dinilai ({stats.dinilai})
          </button>
          <button
            type="button"
            onClick={() => setTabAktif("belum")}
            className={`py-1.5 px-2 rounded-lg transition text-center ${
              tabAktif === "belum" ? "bg-white text-rose-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Belum ({stats.belum})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Daftar Pengumpulan Siswa */}
      <div className="flex flex-col gap-3">
        {siswaTerfilter.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-xs text-slate-500 italic">
            Tidak ada siswa dalam kategori ini.
          </div>
        ) : (
          siswaTerfilter.map((r: any) => {
            const sub = r.submission
            const d = draft[r.student.id]
            const sudahNilai = sub?.status === "GRADED"
            const sudahKumpul = Boolean(sub?.submittedAt)

            return (
              <div
                key={r.student.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition"
              >
                {/* Header Siswa & Status */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <span>{r.student.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">@{r.student.username}</span>
                    </p>

                    {sudahKumpul && sub?.submittedAt && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Dikumpulkan:{" "}
                        <strong className="text-slate-600">
                          {new Date(sub.submittedAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </strong>
                        {sub.isLate && (
                          <span className="text-amber-700 font-bold ml-1 bg-amber-100 px-1.5 py-0.2 rounded text-[9px]">
                            Terlambat
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg shrink-0 border ${
                      sudahNilai
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : sudahKumpul
                        ? sub.isLate
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {sudahNilai
                      ? `NILAI: ${sub.score} / ${maxScore}`
                      : sudahKumpul
                      ? "MENUNGGU NILAI"
                      : "BELUM KUMPUL"}
                  </span>
                </div>

                {/* Lembar Jawaban Siswa */}
                {sudahKumpul ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3 text-blue-600" />
                      Jawaban Siswa:
                    </span>

                    {sub.answerText && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                        {sub.answerText}
                      </div>
                    )}

                    {sub.fileUrl && (
                      <div className="flex flex-col gap-1.5">
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 flex items-center justify-between gap-2 transition"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                            {sub.fileName || "Tautan Berkas Jawaban Siswa"}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                        <TampilanDeskripsiTugas description={sub.fileUrl} />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-1">
                    Siswa belum mengumpulkan jawaban tugas ini.
                  </p>
                )}

                {/* Form Input Penilaian & Catatan Feedback */}
                <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-600" /> Form Penilaian Guru:
                    </span>

                    {/* Tombol Cepat Nilai */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Skor Cepat:</span>
                      {[100, 95, 90, 85, 80].map((quickVal) => (
                        <button
                          key={quickVal}
                          type="button"
                          onClick={() => setNilaiCepat(r.student.id, quickVal, sub?.description || "")}
                          className="px-1.5 py-0.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded text-[10px] font-bold transition"
                        >
                          {quickVal}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                    <label className="w-full sm:w-28 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500">Nilai (Maks {maxScore})</span>
                      <input
                        type="number"
                        min={0}
                        max={maxScore}
                        value={d?.score ?? (sub?.score != null ? String(sub.score) : "")}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            [r.student.id]: {
                              score: e.target.value,
                              note: p[r.student.id]?.note ?? sub?.description ?? "",
                            },
                          }))
                        }
                        placeholder="0-100"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </label>

                    <label className="flex-1 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500">Catatan / Umpan Balik untuk Siswa</span>
                      <input
                        value={d?.note ?? sub?.description ?? ""}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            [r.student.id]: {
                              score: p[r.student.id]?.score ?? (sub?.score != null ? String(sub.score) : ""),
                              note: e.target.value,
                            },
                          }))
                        }
                        placeholder="Contoh: Sangat baik, penjelasan lengkap dan rapi!"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </label>

                    <button
                      onClick={() => nilai(r.student.id)}
                      disabled={saving === r.student.id || (!d && sub?.score != null)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 shrink-0"
                    >
                      {saving === r.student.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{saving === r.student.id ? "Menyimpan..." : "Simpan Nilai"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
