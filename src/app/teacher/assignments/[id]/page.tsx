"use client"

import React, { useState, useEffect, use as useUnwrap } from "react"
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
} from "lucide-react"
import { getAssignmentSubmissions, saveGrade } from "@/app/actions/teacher"

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

  // Nilai & catatan hanya dikirim untuk baris yang benar-benar disentuh guru.
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
      setError("Isi nilainya dulu.")
      return
    }

    setError("")
    setSaving(userId)
    const res = await saveGrade({
      userId,
      assignmentId: id,
      score: Number(d.score),
      description: d.note,
    })
    setSaving(null)

    if (res.error) {
      setError(res.error)
      return
    }

    setToast("Nilai tersimpan.")
    setTimeout(() => setToast(""), 3000)
    setDraft((p) => {
      const next = { ...p }
      delete next[userId]
      return next
    })
    await load()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-500">Memuat pengumpulan...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Link
          href="/teacher/grades"
          className="p-2 w-fit rounded-2xl bg-white border border-slate-200/80 text-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">{error || "Data tidak tersedia."}</p>
        </div>
      </div>
    )
  }

  const maxScore = data.assignment.maxScore ?? 100
  const terkumpul = data.rows.filter((r: any) => r.submission?.submittedAt).length
  const dinilai = data.rows.filter((r: any) => r.submission?.status === "GRADED").length

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
          href="/teacher/grades"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
            {data.assignment.title}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {data.assignment.classInfo?.name} • {data.assignment.subject?.name} • nilai
            maks {maxScore}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Siswa", value: data.rows.length, icon: Users },
          { label: "Terkumpul", value: terkumpul, icon: CheckCircle2 },
          { label: "Dinilai", value: dinilai, icon: Save },
        ].map((k) => {
          const Icon = k.icon
          return (
            <div
              key={k.label}
              className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm"
            >
              <Icon className="w-4 h-4 text-slate-400 mb-1" />
              <div className="text-lg font-black text-slate-900 leading-none">
                {k.value}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {k.label}
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex flex-col gap-2">
        {data.rows.map((r: any) => {
          const sub = r.submission
          const d = draft[r.student.id]
          const sudahNilai = sub?.status === "GRADED"

          return (
            <div
              key={r.student.id}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {r.student.name}
                  </p>
                  <p className="text-[10px] text-slate-500">@{r.student.username}</p>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    sudahNilai
                      ? "bg-emerald-100 text-emerald-700"
                      : sub?.submittedAt
                        ? sub.isLate
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {sudahNilai
                    ? `NILAI ${sub.score}`
                    : sub?.submittedAt
                      ? sub.isLate
                        ? "TERLAMBAT"
                        : "TERKUMPUL"
                      : "BELUM KUMPUL"}
                </span>
              </div>

              {sub?.submittedAt && (
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(sub.submittedAt).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {/* Jawaban siswa — sebelumnya tidak pernah bisa dilihat guru
                  karena siswa tidak punya cara mengumpulkan tugas. */}
              {(sub?.answerText || sub?.fileUrl) && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                  {sub.answerText && (
                    <p className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {sub.answerText}
                    </p>
                  )}
                  {sub.fileUrl && (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 break-all"
                    >
                      <Paperclip className="w-3 h-3 shrink-0" />
                      {sub.fileName || sub.fileUrl}
                    </a>
                  )}
                </div>
              )}

              {!sub?.submittedAt && (
                <p className="text-[11px] text-slate-400 italic">
                  Siswa belum mengumpulkan apa pun.
                </p>
              )}

              <div className="flex gap-2 items-end">
                <label className="w-24 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Nilai
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={maxScore}
                    value={
                      d?.score ?? (sub?.score != null ? String(sub.score) : "")
                    }
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        [r.student.id]: {
                          score: e.target.value,
                          note: p[r.student.id]?.note ?? sub?.description ?? "",
                        },
                      }))
                    }
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </label>

                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Catatan
                  </span>
                  <input
                    value={d?.note ?? sub?.description ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        [r.student.id]: {
                          score:
                            p[r.student.id]?.score ??
                            (sub?.score != null ? String(sub.score) : ""),
                          note: e.target.value,
                        },
                      }))
                    }
                    placeholder="Umpan balik untuk siswa"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </label>

                <button
                  onClick={() => nilai(r.student.id)}
                  disabled={saving === r.student.id || !d}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-40"
                >
                  {saving === r.student.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
