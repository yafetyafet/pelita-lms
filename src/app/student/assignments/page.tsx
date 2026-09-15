"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getStudentAssignments } from "@/app/actions/student"
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Send,
  Award,
  Sparkles
} from "lucide-react"

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getStudentAssignments()
      setAssignments(data)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-xs text-slate-500">Memuat tugas...</span>
      </div>
    )
  }

  const pendingCount = assignments.filter(a => !a.mySubmission || a.mySubmission?.status === "PENDING").length

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link href="/student" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Tugas & Penilaian</h2>
            <p className="text-[11px] text-slate-500 font-medium">Evaluasi Formatif Berkala</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            {pendingCount} Menunggu
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
              Guru belum memberikan tugas untuk kelas Anda. Tugas baru akan muncul di sini secara otomatis.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((a: any) => {
            const submission = a.mySubmission
            const isGraded = submission?.status === "GRADED"
            const isPending = !submission || submission.status === "PENDING"
            const isSubmitted = submission?.status === "SUBMITTED"

            return (
              <div 
                key={a.id}
                className={`bg-white rounded-3xl p-4 border shadow-sm flex flex-col gap-2.5 ${
                  isPending ? "border-2 border-blue-500" : "border-slate-200/80 opacity-90"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                      {a.subject?.name || "Umum"}
                    </span>
                    <h3 className={`font-bold text-slate-900 mt-1.5 leading-snug ${isPending ? "text-sm" : "text-xs"}`}>
                      {a.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Guru: {a.author?.name || "-"}</p>
                  </div>

                  <div className="text-right">
                    {isGraded && submission?.score != null && (
                      <>
                        <span className="text-[10px] text-slate-500 block">Nilai</span>
                        <span className="text-base font-black text-emerald-600">{submission.score} <span className="text-sm text-slate-400 font-bold">/ 100</span></span>
                      </>
                    )}
                    {isPending && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                        Belum Selesai
                      </span>
                    )}
                    {isSubmitted && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                        Menunggu Nilai
                      </span>
                    )}
                  </div>
                </div>

                {a.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {a.description}
                  </p>
                )}

                {isGraded && submission?.description && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                    <strong>Catatan Guru:</strong> {submission.description}
                  </div>
                )}

                {a.dueDate && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Tenggat: {new Date(a.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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
