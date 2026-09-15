"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Timer, ShieldAlert, CheckCircle2, AlertTriangle, Clock, Award, 
  ChevronLeft, ChevronRight, Lock, Loader2 
} from "lucide-react"
import { getStudentExams, validateCbtToken, submitExam } from "@/app/actions/student"

export default function ExamsCBTPage() {
  const [examList, setExamList] = useState<any[]>([])
  const [activeExam, setActiveExam] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [inExamRoom, setInExamRoom] = useState(false)
  const [examToken, setExamToken] = useState("")
  const [tokenError, setTokenError] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // CBT Exam State
  const [timeLeft, setTimeLeft] = useState(3600) // 60 menit dalam detik
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: number }>({})
  const [doubtful, setDoubtful] = useState<{ [key: string]: boolean }>({})
  const [isFinished, setIsFinished] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0)

  useEffect(() => {
    const loadExams = async () => {
      setIsLoading(true)
      const data = await getStudentExams()
      setExamList(data)
      if (data.length > 0) {
        setActiveExam(data[0]) // Select first available exam
        setTimeLeft(data[0].duration * 60 || 3600)
      }
      setIsLoading(false)
    }
    loadExams()
  }, [])

  // Deteksi jika siswa beralih tab saat ujian berlangsung
  useEffect(() => {
    if (!inExamRoom || isFinished) return
    const handleVisibilityChange = () => {
      if (document.hidden) setTabSwitchWarnings((prev) => prev + 1)
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [inExamRoom, isFinished])

  // Timer Countdown
  useEffect(() => {
    if (!inExamRoom || isFinished) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinishExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [inExamRoom, isFinished])

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    const isValid = await validateCbtToken(examToken.trim().toUpperCase())
    if (isValid) {
      setTokenError(false)
      setInExamRoom(true)
    } else {
      setTokenError(true)
    }
    setIsVerifying(false)
  }

  const handleSelectAnswer = (qId: string, optIndex: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIndex }))
  }

  const handleToggleDoubtful = (qId: string) => {
    setDoubtful((prev) => ({ ...prev, [qId]: !prev[qId] }))
  }

  const handleFinishExam = async () => {
    if (!activeExam) return
    setIsSubmitting(true)
    
    // Calculate Score
    let correctCount = 0
    activeExam.questions.forEach((q: any) => {
      const selectedIndex = answers[q.id]
      if (selectedIndex !== undefined) {
        let optionsArr = []
        try { optionsArr = JSON.parse(q.options) } catch (e) { optionsArr = q.options.split(',') }
        const selectedText = optionsArr[selectedIndex]
        if (selectedText === q.correctAnswer) correctCount++
      }
    })
    
    const finalScore = activeExam.questions.length > 0 
      ? (correctCount / activeExam.questions.length) * 100 
      : 0

    await submitExam(activeExam.id, JSON.stringify(answers), finalScore)
    setIsFinished(true)
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
        <span className="text-sm font-bold text-slate-600">Memuat Jadwal Ujian CBT...</span>
      </div>
    )
  }

  if (examList.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2.5 pt-1 mb-2">
          <Link href="/student" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="text-base font-bold text-slate-900">Ujian CBT Resmi</h2>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3">
          <Award className="w-12 h-12 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Ujian Aktif</h3>
          <p className="text-xs text-slate-500 max-w-xs">Tidak ada jadwal ujian CBT (PTS/PAS) untuk kelas Anda saat ini.</p>
        </div>
      </div>
    )
  }

  const currentQ = activeExam.questions[currentQuestionIdx]
  let currentOptions: string[] = []
  if (currentQ) {
    try {
      currentOptions = JSON.parse(currentQ.options)
    } catch {
      currentOptions = currentQ.options.split(',')
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {!inExamRoom ? (
        <>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <Link href="/student" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">Ujian CBT Resmi</h2>
                <p className="text-[11px] text-slate-500 font-medium">Khusus PTS & PAS Semesteran</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-600" /> Terkunci
            </span>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-rose-700 via-red-800 to-slate-900 p-4 text-white shadow-xl shadow-rose-700/20 relative overflow-hidden flex flex-col gap-3">
            <div>
              <span className="text-[10px] font-bold bg-white/20 text-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {activeExam.type} CBT
              </span>
              <h3 className="text-base font-black text-white mt-1.5 leading-snug">{activeExam.title}</h3>
              <p className="text-xs text-rose-200 mt-0.5">{activeExam.subject?.name} • {activeExam.classInfo?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
              <div className="bg-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-rose-200 block">Alokasi Waktu:</span>
                <span className="font-bold text-white text-sm">{activeExam.duration} Menit</span>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-rose-200 block">Jumlah Butir:</span>
                <span className="font-bold text-white text-sm">{activeExam.questions.length} Soal</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Tata Tertib & Integritas
            </h4>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>Kerjakan secara mandiri dan jujur (Iman & Karakter PELITA).</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>Sistem memantau perpindahan tab browser secara otomatis.</li>
            </ul>
          </div>

          <form onSubmit={handleStartExam} className="bg-white rounded-3xl p-4 border-2 border-rose-300 shadow-md flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">Masukkan Token Ujian (Dari Pengawas):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={examToken}
                  onChange={(e) => setExamToken(e.target.value)}
                  placeholder="Ketik token..."
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 uppercase focus:outline-none focus:border-rose-500"
                  required
                />
                <button
                  type="submit" disabled={isVerifying}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0 flex items-center gap-2 disabled:opacity-70"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mulai Ujian"}
                </button>
              </div>
            </div>
            {tokenError && (
              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Token CBT salah atau tidak aktif!
              </p>
            )}
          </form>
        </>
      ) : !isFinished ? (
        <div className="flex flex-col gap-3.5">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded uppercase">CBT RUNNING</span>
              <span className="text-xs font-bold text-slate-200">Soal {currentQuestionIdx + 1} / {activeExam.questions.length}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-rose-400 font-mono font-extrabold text-sm border border-rose-500/30">
              <Timer className="w-3.5 h-3.5 animate-pulse" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {tabSwitchWarnings > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 flex items-center gap-2 text-xs text-amber-900 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Peringatan ({tabSwitchWarnings}x):</strong> Beralih layar terdeteksi!</span>
            </div>
          )}

          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {activeExam.questions.map((q: any, idx: number) => {
              const isAnswered = answers[q.id] !== undefined
              const isCurrent = currentQuestionIdx === idx
              const isDoubt = doubtful[q.id]
              let style = "bg-slate-100 text-slate-700 border-slate-200"
              if (isDoubt) style = "bg-amber-400 text-slate-950 font-bold border-amber-500"
              else if (isAnswered) style = "bg-blue-600 text-white font-bold border-blue-600"
              if (isCurrent) style += " ring-2 ring-slate-900 scale-105"
              return (
                <button key={idx} onClick={() => setCurrentQuestionIdx(idx)} className={`w-8 h-8 rounded-xl border text-xs flex items-center justify-center shrink-0 transition-all ${style}`}>
                  {idx + 1}
                </button>
              )
            })}
          </div>

          {currentQ && (
            <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-900 leading-relaxed">{currentQ.question}</h4>
              <div className="flex flex-col gap-2 mt-1">
                {currentOptions.map((opt: string, optIdx: number) => {
                  const isSelected = answers[currentQ.id] === optIdx
                  return (
                    <button
                      key={optIdx} onClick={() => handleSelectAnswer(currentQ.id, optIdx)}
                      className={`p-3 rounded-2xl border text-xs text-left transition-all flex items-start gap-2.5 ${isSelected ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm" : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800"}`}
                    >
                      <span className={`w-5 h-5 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 border ${isSelected ? "bg-white text-blue-600 border-white" : "bg-white text-slate-700 border-slate-300"}`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button onClick={() => handleToggleDoubtful(currentQ.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${doubtful[currentQ.id] ? "bg-amber-400 text-slate-950 shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  <span>{doubtful[currentQ.id] ? "✓ Ragu-Ragu Aktif" : "Tandai Ragu-Ragu"}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))} className="p-2 rounded-xl bg-slate-100 disabled:opacity-40 text-slate-700"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={currentQuestionIdx === activeExam.questions.length - 1} onClick={() => setCurrentQuestionIdx((p) => Math.min(activeExam.questions.length - 1, p + 1))} className="p-2 rounded-xl bg-slate-100 disabled:opacity-40 text-slate-700"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          )}

          <button onClick={() => { if(confirm("Kirim jawaban sekarang? Ujian akan diselesaikan.")) handleFinishExam() }} disabled={isSubmitting} className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin"/> Menyimpan...</> : <><CheckCircle2 className="w-4 h-4" /> Kirim & Selesaikan Ujian CBT</>}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Ujian Berhasil Diserahkan!</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Lembar jawaban CBT Anda telah tersimpan secara permanen di database server sekolah. Hasil penilaian resmi akan diumumkan oleh panitia.
          </p>
          <Link href="/student" className="w-full mt-3 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition">
            Kembali ke Beranda Siswa
          </Link>
        </div>
      )}
    </div>
  )
}
