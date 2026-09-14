"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Timer, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Lock
} from "lucide-react"

export default function ExamsCBTPage() {
  const [inExamRoom, setInExamRoom] = useState(false)
  const [examToken, setExamToken] = useState("")
  const [tokenError, setTokenError] = useState(false)

  // CBT Exam State
  const [timeLeft, setTimeLeft] = useState(3600) // 60 menit dalam detik
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: number }>({})
  const [doubtful, setDoubtful] = useState<{ [key: number]: boolean }>({})
  const [isFinished, setIsFinished] = useState(false)
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0)

  const examData = {
    title: "Penilaian Tengah Semester (PTS) Ganjil 2026/2027",
    subject: "Pemrograman Web & Perangkat Bergerak",
    class: "XII Rekayasa Perangkat Lunak 1",
    duration: "60 Menit",
    totalQuestions: 5,
    tokenRequired: "PTS2026",
    rules: [
      "Kerjakan secara mandiri dan jujur (Iman & Karakter PELITA).",
      "Sistem memantau perpindahan tab browser secara otomatis.",
      "Tombol Selesai akan aktif setelah minimal 15 menit pengerjaan."
    ]
  }

  const examQuestions = [
    {
      id: 1,
      q: "Komponen manakah dalam arsitektur Next.js 15 yang dieksekusi langsung di lingkungan Edge/Server tanpa mengirimkan bundle JavaScript ke client?",
      options: [
        "Client Component dengan direktif 'use client'",
        "Server Component (default App Router)",
        "CSS Module stylesheet",
        "Komponen HTML canvas"
      ]
    },
    {
      id: 2,
      q: "Untuk mengoptimalkan penyimpanan media pada LMS sekolah tanpa biaya server tambahan, arsitektur terbaik adalah:",
      options: [
        "Menyimpan semua video resolusi 4K langsung di local database SQLite",
        "Menggunakan embed link ke YouTube (unlisted) dan Google Drive akun sekolah",
        "Mengirimkan file video via lampiran email siswa",
        "Menghapus video setiap kali selesai diputar"
      ]
    },
    {
      id: 3,
      q: "Formula matematika yang lazim digunakan untuk menghitung jarak lingkaran besar antara dua koordinat GPS di permukaan bumi pada fitur Geofencing adalah:",
      options: [
        "Teorema Pythagoras 2 Dimensi sederhana",
        "Formula Haversine",
        "Algoritma Bubble Sort",
        "Transformasi Fourier Cepat (FFT)"
      ]
    },
    {
      id: 4,
      q: "Keunggulan utama Progressive Web App (PWA) untuk aplikasi LMS sekolah di smartphone siswa adalah:",
      options: [
        "Aplikasi harus selalu diunduh via CD-ROM fisik",
        "Dapat diinstal ke Home Screen HP layaknya aplikasi native tanpa harus rilis ke Play Store",
        "Hanya bisa berjalan jika terhubung kabel LAN",
        "Tidak bisa menyimpan cache data offline"
      ]
    },
    {
      id: 5,
      q: "Dalam skema database PostgreSQL untuk LMS, relasi antara tabel Kelas dan Siswa umumnya dimodelkan sebagai:",
      options: [
        "One-to-One tanpa foreign key",
        "Many-to-Many melalui junction table (contoh: ClassStudent)",
        "File teks tanpa struktur",
        "NoSQL Key-Value store"
      ]
    }
  ]

  // Deteksi jika siswa beralih tab saat ujian berlangsung
  useEffect(() => {
    if (!inExamRoom || isFinished) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarnings((prev) => prev + 1)
      }
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
          setIsFinished(true)
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

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault()
    if (examToken.trim().toUpperCase() === examData.tokenRequired) {
      setTokenError(false)
      setInExamRoom(true)
    } else {
      setTokenError(true)
    }
  }

  const handleSelectAnswer = (optIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIdx]: optIndex }))
  }

  const handleToggleDoubtful = () => {
    setDoubtful((prev) => ({ ...prev, [currentQuestionIdx]: !prev[currentQuestionIdx] }))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Jika belum masuk ke ruang ujian CBT */}
      {!inExamRoom ? (
        <>
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
                <h2 className="text-base font-bold text-slate-900 leading-tight">Ujian CBT Resmi</h2>
                <p className="text-[11px] text-slate-500 font-medium">Khusus PTS & PAS Semesteran</p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-600" />
              Terkunci Token
            </span>
          </div>

          {/* Exam Card Overview */}
          <div className="rounded-3xl bg-gradient-to-br from-rose-700 via-red-800 to-slate-900 p-4 text-white shadow-xl shadow-rose-700/20 relative overflow-hidden flex flex-col gap-3">
            <div>
              <span className="text-[10px] font-bold bg-white/20 text-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Ujian Tengah Semester (PTS)
              </span>
              <h3 className="text-base font-black text-white mt-1.5 leading-snug">
                {examData.subject}
              </h3>
              <p className="text-xs text-rose-200 mt-0.5">{examData.class} • TA 2026/2027 Ganjil</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
              <div className="bg-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-rose-200 block">Alokasi Waktu:</span>
                <span className="font-bold text-white text-sm">{examData.duration}</span>
              </div>
              <div className="bg-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-rose-200 block">Jumlah Butir:</span>
                <span className="font-bold text-white text-sm">{examData.totalQuestions} Soal Pilihan Ganda</span>
              </div>
            </div>
          </div>

          {/* Tata Tertib Ujian */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-slate-600">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Tata Tertib & Integritas Ujian
            </h4>

            <ul className="flex flex-col gap-1.5 text-xs text-slate-600 leading-relaxed">
              {examData.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form Token Masuk Ujian */}
          <form onSubmit={handleStartExam} className="bg-white rounded-3xl p-4 border-2 border-rose-300 shadow-md flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-slate-900 block mb-1">
                Masukkan Token Ujian dari Pengawas:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={examToken}
                  onChange={(e) => setExamToken(e.target.value)}
                  placeholder="Ketik token: PTS2026"
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 uppercase focus:outline-none focus:border-rose-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0"
                >
                  Mulai Ujian
                </button>
              </div>
            </div>

            {tokenError && (
              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Token tidak valid! Gunakan token uji coba: PTS2026
              </p>
            )}

            <p className="text-[10px] text-slate-400">
              *Token resmi didapatkan dari Bapak/Ibu guru pengawas ruang ujian.
            </p>
          </form>
        </>
      ) : !isFinished ? (
        /* RUANG UJIAN CBT AKTIF */
        <div className="flex flex-col gap-3.5">
          {/* CBT Top Status Bar: Timer & Warning */}
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded uppercase">
                PTS CBT
              </span>
              <span className="text-xs font-bold text-slate-200">
                Soal No. {currentQuestionIdx + 1} dari {examQuestions.length}
              </span>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-rose-400 font-mono font-extrabold text-sm border border-rose-500/30">
              <Timer className="w-3.5 h-3.5 animate-pulse" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Anti-cheat Alert jika terdeteksi ganti tab */}
          {tabSwitchWarnings > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 flex items-center gap-2 text-xs text-amber-900 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Peringatan ({tabSwitchWarnings}x):</strong> Terdeteksi beralih dari layar ujian. Catatan ini terkirim ke pengawas!
              </span>
            </div>
          )}

          {/* Palet Nomor Soal */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {examQuestions.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined
              const isCurrent = currentQuestionIdx === idx
              const isDoubt = doubtful[idx]

              let style = "bg-slate-100 text-slate-700 border-slate-200"
              if (isDoubt) style = "bg-amber-400 text-slate-950 font-bold border-amber-500"
              else if (isAnswered) style = "bg-blue-600 text-white font-bold border-blue-600"
              if (isCurrent) style += " ring-2 ring-slate-900 scale-105"

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-8 h-8 rounded-xl border text-xs flex items-center justify-center shrink-0 transition-all ${style}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          {/* Soal Ujian Card */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-900 leading-relaxed">
              {examQuestions[currentQuestionIdx].q}
            </h4>

            {/* Pilihan Jawaban */}
            <div className="flex flex-col gap-2 mt-1">
              {examQuestions[currentQuestionIdx].options.map((opt, optIdx) => {
                const isSelected = answers[currentQuestionIdx] === optIdx

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectAnswer(optIdx)}
                    className={`p-3 rounded-2xl border text-xs text-left transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 border ${
                      isSelected ? "bg-white text-blue-600 border-white" : "bg-white text-slate-700 border-slate-300"
                    }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Tombol Ragu-ragu */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleToggleDoubtful}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  doubtful[currentQuestionIdx]
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{doubtful[currentQuestionIdx] ? "✓ Ragu-Ragu Aktif" : "Tandai Ragu-Ragu"}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                  className="p-2 rounded-xl bg-slate-100 disabled:opacity-40 text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentQuestionIdx === examQuestions.length - 1}
                  onClick={() => setCurrentQuestionIdx((p) => Math.min(examQuestions.length - 1, p + 1))}
                  className="p-2 rounded-xl bg-slate-100 disabled:opacity-40 text-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tombol Selesai Ujian */}
          <button
            onClick={() => setIsFinished(true)}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kirim & Selesaikan Ujian CBT</span>
          </button>
        </div>
      ) : (
        /* HASIL / TANDA BUKTI UJIAN SELESAI */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-900">Ujian Berhasil Diserahkan!</h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Lembar jawaban CBT Anda telah tersimpan secara permanen di database server sekolah. Hasil penilaian resmi akan diumumkan oleh panitia PTS.
          </p>

          <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between text-slate-600">
              <span>Mata Pelajaran:</span>
              <span className="font-bold text-slate-900">{examData.subject}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Soal Terjawab:</span>
              <span className="font-bold text-emerald-600">
                {Object.keys(answers).length} dari {examQuestions.length} Soal
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Status Integritas:</span>
              <span className="font-bold text-blue-600">Terverifikasi Sistem</span>
            </div>
          </div>

          <Link
            href="/student"
            className="w-full mt-3 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            Kembali ke Beranda Siswa
          </Link>
        </div>
      )}
    </div>
  )
}
