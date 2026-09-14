"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UploadCloud, 
  Send, 
  Award, 
  Sparkles,
  ChevronRight,
  HelpCircle,
  RotateCcw
} from "lucide-react"

export default function AssignmentsAndQuizzesPage() {
  const [activeTab, setActiveTab] = useState<"tugas" | "kuis">("tugas")
  
  // State Pengumpulan Tugas
  const [submissionLink, setSubmissionLink] = useState("")
  const [submittedTask1, setSubmittedTask1] = useState(false)

  // State Kuis Interaktif
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)

  const quizQuestions = [
    {
      id: 1,
      question: "Manakah metode HTTP yang paling tepat digunakan untuk menyimpan data presensi baru ke server?",
      options: ["GET", "POST", "DELETE", "PATCH"],
      correct: 1, // POST
      explanation: "Metode POST digunakan untuk mengirim entitas baru ke sumber daya yang ditentukan."
    },
    {
      id: 2,
      question: "Mengapa embed link (YouTube & Drive) lebih direkomendasikan untuk LMS sekolah?",
      options: [
        "Supaya tampilan lebih lambat",
        "Menghemat kapasitas storage server & tidak membebani bandwidth sekolah",
        "Wajib bayar langganan bulanan",
        "Hanya bisa dibuka di laptop"
      ],
      correct: 1,
      explanation: "Dengan embed link, video dan file tersimpan di cloud eksternal sehingga server sekolah tetap ringan dan gratis."
    },
    {
      id: 3,
      question: "Dalam geofencing presensi, data apa yang dikirimkan perangkat siswa untuk divalidasi?",
      options: [
        "Nomor IMEI dan Foto KTP",
        "Koordinat Lintang (Latitude) dan Bujur (Longitude)",
        "Daftar kontak telepon",
        "Password email pribadi"
      ],
      correct: 1,
      explanation: "Sistem mencocokkan koordinat Latitude & Longitude siswa dengan titik pusat koordinat sekolah."
    }
  ]

  const handleSelectQuizAnswer = (qIndex: number, optionIndex: number) => {
    if (quizSubmitted) return
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }))
  }

  const handleSubmitQuiz = () => {
    let score = 0
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) {
        score += 1
      }
    })
    const finalScore = Math.round((score / quizQuestions.length) * 100)
    setQuizScore(finalScore)
    setQuizSubmitted(true)
  }

  const handleResetQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(null)
  }

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!submissionLink.trim()) return
    setSubmittedTask1(true)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Tugas & Kuis Harian</h2>
            <p className="text-[11px] text-slate-500 font-medium">Evaluasi Formatif Berkala</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-600" />
          1 Menunggu
        </span>
      </div>

      {/* Tab Segmented Control */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab("tugas")}
          className={`py-2 rounded-xl transition-all ${
            activeTab === "tugas" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tugas Terstruktur (1)
        </button>
        <button
          onClick={() => setActiveTab("kuis")}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "kuis" 
              ? "bg-white text-blue-600 shadow-sm" 
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Kuis Harian</span>
          <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.2 rounded-full">Baru</span>
        </button>
      </div>

      {/* TAB 1: TUGAS MANDIRI / TERSTRUKTUR */}
      {activeTab === "tugas" && (
        <div className="flex flex-col gap-3">
          {/* Card Tugas 1 - Menunggu Pengumpulan */}
          <div className="bg-white rounded-3xl p-4 border-2 border-blue-500 shadow-md flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                  Pemrograman Web
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                  Praktikum 03: Desain Komponen UI Mobile dengan Tailwind CSS
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Guru: Bpk. Kurniawan S, S.Kom</p>
              </div>

              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg shrink-0">
                Tenggat: Besok, 23:59
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              Buat antarmuka mobile-first untuk menu jadwal atau materi. Sisipkan komponen tombol, card, dan status bar. Kumpulkan dalam bentuk link GitHub Repository atau tautan Google Drive proyek.
            </p>

            {/* Form Pengumpulan Tugas */}
            {!submittedTask1 ? (
              <form onSubmit={handleSubmitTask} className="flex flex-col gap-2 pt-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Tautan Pengumpulan (GitHub / Google Drive):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://github.com/username/project atau link Drive"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold block">Tugas Berhasil Dikumpulkan!</span>
                    <span className="text-[10px] text-emerald-600">Menunggu penilaian dari guru.</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded">
                  Status: Terkirim
                </span>
              </div>
            )}
          </div>

          {/* Card Tugas 2 - Sudah Dinilai */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5 opacity-90">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                  Basis Data Lanjut
                </span>
                <h3 className="text-xs font-bold text-slate-900 mt-1">
                  Praktikum 02: Normalisasi Tabel 1NF - 3NF
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Dikumpulkan: 08 Sept 2026</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Nilai</span>
                <span className="text-base font-black text-emerald-600">95 / 100</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
              <strong>Catatan Guru:</strong> Skema relasi sangat rapi, pemisahan foreign key dan indexing sudah tepat.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KUIS HARIAN INTERAKTIF */}
      {activeTab === "kuis" && (
        <div className="flex flex-col gap-3">
          {/* Header Card Kuis */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-700 to-blue-800 p-4 text-white shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold bg-white/20 text-blue-100 px-2 py-0.5 rounded-full uppercase">
                Kuis Harian Sesi 4
              </span>
              <h3 className="text-sm font-bold text-white mt-1">Latihan Konsep Web & Geotagging</h3>
              <p className="text-[11px] text-blue-200 mt-0.5">3 Soal Pilihan Ganda • Penilaian Instan</p>
            </div>
            <Award className="w-8 h-8 text-blue-200 shrink-0" />
          </div>

          {/* Soal-soal Kuis */}
          {quizQuestions.map((q, qIndex) => {
            const selected = quizAnswers[qIndex]
            const isCorrect = selected === q.correct

            return (
              <div 
                key={q.id} 
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5"
              >
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {q.id}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {q.question}
                  </h4>
                </div>

                {/* Option Buttons */}
                <div className="flex flex-col gap-1.5 mt-1">
                  {q.options.map((opt, optIndex) => {
                    const isOptionSelected = selected === optIndex
                    
                    let btnStyle = "bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100"
                    if (isOptionSelected) {
                      btnStyle = "bg-blue-600 text-white border-blue-600 font-semibold"
                    }
                    if (quizSubmitted) {
                      if (optIndex === q.correct) {
                        btnStyle = "bg-emerald-600 text-white border-emerald-600 font-bold"
                      } else if (isOptionSelected && !isCorrect) {
                        btnStyle = "bg-red-500 text-white border-red-500 font-semibold"
                      }
                    }

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleSelectQuizAnswer(qIndex, optIndex)}
                        disabled={quizSubmitted}
                        className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {isOptionSelected && !quizSubmitted && (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {quizSubmitted && optIndex === q.correct && (
                          <span className="text-[10px] font-bold uppercase tracking-wider">Benar</span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Penjelasan jika sudah disubmit */}
                {quizSubmitted && (
                  <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed mt-1 ${
                    isCorrect ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    <strong>Penjelasan:</strong> {q.explanation}
                  </div>
                )}
              </div>
            )
          })}

          {/* Tombol Selesai & Hasil Skor Kuis */}
          {!quizSubmitted ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={Object.keys(quizAnswers).length < quizQuestions.length}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                Object.keys(quizAnswers).length === quizQuestions.length
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {Object.keys(quizAnswers).length === quizQuestions.length
                  ? "Kirim Jawaban Kuis"
                  : `Jawab Semua Soal (${Object.keys(quizAnswers).length}/${quizQuestions.length})`}
              </span>
            </button>
          ) : (
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-md flex flex-col items-center text-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Hasil Evaluasi Kuis</span>
              <div className="text-3xl font-black text-blue-600">
                {quizScore} <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {quizScore === 100 ? "Luar biasa! Seluruh konsep dijawab dengan sempurna 🎉" : "Bagus! Silakan ulangi untuk memperkuat pemahaman konsep."}
              </p>
              <button
                onClick={handleResetQuiz}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi Kuis</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
