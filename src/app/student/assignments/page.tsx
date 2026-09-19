"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import { getStudentAssignments, submitAssignment } from "@/app/actions/student"
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  Paperclip,
  AlertTriangle,
  Pencil,
} from "lucide-react"

type Submission = {
  score: number | null
  status: string
  submittedAt: Date | null
  description: string | null
  answerText: string | null
  fileUrl: string | null
  fileName: string | null
  isLate: boolean
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form pengumpulan dibuka per tugas.
  const [openId, setOpenId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [toast, setToast] = useState("")

  const load = async () => {
    const data = await getStudentAssignments()
    setAssignments(data)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const bukaForm = (a: any) => {
    const sub: Submission | null = a.mySubmission
    setOpenId(a.id)
    setAnswerText(sub?.answerText || "")
    setFileUrl(sub?.fileUrl || "")
    setFormError("")
  }

  const kirim = async (assignmentId: string) => {
    setFormError("")
    if (!answerText.trim() && !fileUrl.trim()) {
      setFormError("Isi jawaban atau tempelkan tautan berkas dulu.")
      return
    }

    setSaving(true)
    const res = await submitAssignment({
      assignmentId,
      answerText: answerText.trim(),
      fileUrl: fileUrl.trim(),
    })
    setSaving(false)

    if (res.error) {
      setFormError(res.error)
      return
    }

    setOpenId(null)
    setToast(res.pesan || "Tugas berhasil dikumpulkan.")
    setTimeout(() => setToast(""), 4000)
    await load()
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat tugas..." />
    )
  }

  const belumKumpul = assignments.filter(
    (a) => !a.mySubmission || a.mySubmission.status === "PENDING"
  ).length

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/student"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Tugas & Penilaian
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Kumpulkan tugas dan lihat nilainya
            </p>
          </div>
        </div>

        {belumKumpul > 0 && (
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            {belumKumpul} Belum
          </span>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <FileText className="w-10 h-10 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Tugas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Guru belum memberikan tugas untuk kelas Anda. Tugas baru akan muncul di
              sini secara otomatis.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((a: any) => {
            const sub: Submission | null = a.mySubmission
            const dinilai = sub?.status === "GRADED"
            const terkumpul = sub?.status === "SUBMITTED" || sub?.status === "LATE"
            const belum = !sub || sub.status === "PENDING"
            const tenggatLewat = a.dueDate && new Date(a.dueDate) < new Date()
            const bisaKirim = !dinilai && (!tenggatLewat || a.allowLateSubmission)

            return (
              <div
                key={a.id}
                className={`bg-white rounded-3xl p-4 border shadow-sm flex flex-col gap-2.5 ${
                  belum ? "border-2 border-blue-500" : "border-slate-200/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                      {a.subject?.name || "Umum"}
                    </span>
                    <h3 className="font-bold text-slate-900 mt-1.5 leading-snug text-sm">
                      {a.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Guru: {a.author?.name || "-"}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {dinilai && sub?.score != null && (
                      <>
                        <span className="text-[10px] text-slate-500 block">Nilai</span>
                        <span className="text-base font-black text-emerald-600">
                          {sub.score}{" "}
                          <span className="text-sm text-slate-400 font-bold">
                            / {a.maxScore ?? 100}
                          </span>
                        </span>
                      </>
                    )}
                    {belum && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                        Belum Dikumpulkan
                      </span>
                    )}
                    {terkumpul && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                        {sub?.isLate ? "Terlambat" : "Menunggu Nilai"}
                      </span>
                    )}
                  </div>
                </div>

                {a.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {a.description}
                  </p>
                )}

                {a.dueDate && (
                  <p
                    className={`text-[10px] flex items-center gap-1 ${
                      tenggatLewat && belum ? "text-red-600 font-bold" : "text-slate-400"
                    }`}
                  >
                    <Clock className="w-3 h-3" /> Tenggat:{" "}
                    {new Date(a.dueDate).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {tenggatLewat && belum && " • sudah lewat"}
                  </p>
                )}

                {/* Jawaban yang sudah dikirim */}
                {sub && (sub.answerText || sub.fileUrl) && openId !== a.id && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Jawaban Anda
                    </span>
                    {sub.answerText && (
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
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
                    {sub.submittedAt && (
                      <span className="text-[10px] text-slate-400">
                        Dikirim{" "}
                        {new Date(sub.submittedAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                )}

                {dinilai && sub?.description && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
                    <strong>Catatan Guru:</strong> {sub.description}
                  </div>
                )}

                {/* Form pengumpulan */}
                {openId === a.id ? (
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={4}
                      placeholder="Tulis jawaban atau uraian tugasmu di sini..."
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y"
                    />
                    <input
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="Tautan berkas (Google Drive, dll) — opsional"
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />

                    {formError && (
                      <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => kirim(a.id)}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{saving ? "Mengirim..." : "Kumpulkan"}</span>
                      </button>
                      <button
                        onClick={() => setOpenId(null)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  bisaKirim && (
                    <button
                      onClick={() => bukaForm(a)}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      {terkumpul ? (
                        <>
                          <Pencil className="w-3.5 h-3.5" /> Perbaiki Jawaban
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" /> Kumpulkan Tugas
                        </>
                      )}
                    </button>
                  )
                )}

                {!bisaKirim && !dinilai && (
                  <p className="text-[10px] text-slate-400 italic">
                    Tenggat sudah lewat dan tugas ini tidak menerima keterlambatan.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
