"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getTeacherClasses, getTeacherExams, createExam, deleteExam } from "@/app/actions/teacher"
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  Image, 
  Clock, 
  Users, 
  X,
  Upload,
  Sparkles,
  ClipboardPaste,
  Settings2
} from "lucide-react"

export default function TeacherExamsPage() {
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [examTitle, setExamTitle] = useState("")
  const [examClassId, setExamClassId] = useState("")
  const [examSubjectId, setExamSubjectId] = useState("")
  const [examDuration, setExamDuration] = useState(60)
  const [questions, setQuestions] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  // Import state
  const [importMode, setImportMode] = useState<"manual" | "paste">("manual")
  const [pasteText, setPasteText] = useState("")

  useEffect(() => {
    async function load() {
      const [cls, exm] = await Promise.all([getTeacherClasses(), getTeacherExams()])
      setTeacherClasses(cls)
      setExams(exm)
      if (cls.length > 0) {
        setExamClassId(cls[0].classId)
        setExamSubjectId(cls[0].subjectId)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const addQuestion = () => {
    setQuestions([...questions, {
      question: "",
      imageUrl: "",
      type: "PG",
      options: ["", "", "", ""],
      correctAnswer: "0",
      points: 10
    }])
  }

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...q.options]
      opts[optIdx] = value
      return { ...q, options: opts }
    }))
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const handlePasteImport = () => {
    if (!pasteText.trim()) return
    const lines = pasteText.trim().split("\n").filter(l => l.trim())
    const imported: any[] = []
    
    let current: any = null
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.match(/^\d+[\.\)]/)) {
        if (current) imported.push(current)
        current = {
          question: trimmed.replace(/^\d+[\.\)]\s*/, ""),
          imageUrl: "",
          type: "PG",
          options: [],
          correctAnswer: "0",
          points: 10
        }
      } else if (trimmed.match(/^[A-D][\.\)]/i) && current) {
        current.options.push(trimmed.replace(/^[A-D][\.\)]\s*/i, ""))
      } else if (trimmed.toLowerCase().startsWith("jawaban:") && current) {
        const ans = trimmed.replace(/^jawaban:\s*/i, "").trim().toUpperCase()
        // indexOf mengembalikan -1 untuk jawaban di luar A-D; jangan simpan
        // itu sebagai kunci karena soalnya jadi mustahil dijawab benar.
        const idx = "ABCD".indexOf(ans)
        current.correctAnswer = String(idx >= 0 ? idx : 0)
      } else if (current && current.options.length === 0) {
        current.question += " " + trimmed
      }
    }
    if (current) imported.push(current)

    // Ensure each question has at least 4 options
    imported.forEach(q => {
      while (q.options.length < 4) q.options.push("")
    })

    setQuestions(prev => [...prev, ...imported])
    setPasteText("")
    setImportMode("manual")
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examTitle || !examClassId || !examSubjectId || questions.length === 0) {
      alert("Lengkapi judul, kelas, mapel, dan minimal 1 soal")
      return
    }

    setCreating(true)
    const res = await createExam({
      title: examTitle,
      type: questions.some(q => q.type === "ESAI") ? "CAMPURAN" : "PG",
      classId: examClassId,
      subjectId: examSubjectId,
      duration: examDuration,
      questions: questions.map(q => ({
        question: q.question,
        imageUrl: q.imageUrl || undefined,
        type: q.type,
        options: q.type === "PG" ? JSON.stringify(q.options) : undefined,
        correctAnswer: q.type === "PG" ? q.correctAnswer : undefined,
        points: q.points
      }))
    })
    setCreating(false)

    if (res.error) {
      alert(res.error)
    } else {
      setShowCreateModal(false)
      setExamTitle("")
      setQuestions([])
      const exm = await getTeacherExams()
      setExams(exm)
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Yakin hapus ujian ini?")) return
    await deleteExam(examId)
    const exm = await getTeacherExams()
    setExams(exm)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
        <span className="text-xs text-slate-500">Memuat data ujian...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link href="/teacher" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Ujian</h2>
            <p className="text-[11px] text-slate-500 font-medium">Buat & Kelola Ujian Online</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Ujian</span>
        </button>
      </div>

      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-700 via-red-700 to-slate-900 p-4 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-rose-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200">Manajemen Ujian</span>
        </div>
        <h3 className="text-sm font-bold">Buat Soal PG, Esai, & Bergambar</h3>
        <p className="text-[11px] text-rose-100/80 mt-1">
          Import soal via copy-paste atau input manual. Mendukung soal bergambar (URL gambar) dan esai.
        </p>
      </div>

      {/* Exam List */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-rose-600" />
          Daftar Ujian ({exams.length})
        </h3>

        {exams.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-slate-300" />
            <span>Belum ada ujian yang dibuat. Klik &quot;Buat Ujian&quot; untuk memulai.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {exams.map((exam: any) => (
              <div key={exam.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900">{exam.title}</h4>
                    {/* Status terbit menentukan apakah siswa bisa melihat ujian. */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      exam.isPublished
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}>
                      {exam.isPublished ? "TERBIT" : "DRAF"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {exam.classInfo?.name} • {exam.subject?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded">{exam.type}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {exam.questions?.length || 0} Soal
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {exam.duration} Menit
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {exam.submissions?.length || 0} Jawaban
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/teacher/exams/${exam.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 transition"
                  >
                    <Settings2 className="w-3 h-3" /> Kelola
                  </Link>
                  <button onClick={() => handleDeleteExam(exam.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Buat Ujian Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="flex flex-col gap-3 text-xs">
              <input
                type="text"
                value={examTitle}
                onChange={e => setExamTitle(e.target.value)}
                placeholder="Judul Ujian (Contoh: UTS Pemrograman Web)"
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-rose-500"
                required
              />

              <div className="grid grid-cols-3 gap-2">
                <select value={examClassId} onChange={e => setExamClassId(e.target.value)} className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                  {teacherClasses.map((tc: any, i: number) => (
                    <option key={i} value={tc.classId}>{tc.classInfo.name}</option>
                  ))}
                </select>
                <select value={examSubjectId} onChange={e => setExamSubjectId(e.target.value)} className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none">
                  {teacherClasses.map((tc: any, i: number) => (
                    <option key={i} value={tc.subjectId}>{tc.subject.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input type="number" value={examDuration} onChange={e => setExamDuration(parseInt(e.target.value) || 60)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                  <span className="text-[10px] text-slate-500 shrink-0">mnt</span>
                </div>
              </div>

              {/* Import mode tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl font-bold text-[11px]">
                <button type="button" onClick={() => setImportMode("manual")} className={`py-1.5 rounded-lg transition ${importMode === "manual" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600"}`}>
                  Input Manual
                </button>
                <button type="button" onClick={() => setImportMode("paste")} className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${importMode === "paste" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600"}`}>
                  <ClipboardPaste className="w-3 h-3" /> Copy-Paste
                </button>
              </div>

              {importMode === "paste" && (
                <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-[10px] text-amber-800">
                    <strong>Format:</strong> Baris soal diawali nomor (1. / 1)), opsi diawali huruf (A. / A)), jawaban dengan &quot;Jawaban: A&quot;
                  </p>
                  <textarea
                    rows={6}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={"1. Apa itu HTML?\nA. Bahasa markup\nB. Bahasa pemrograman\nC. Database\nD. Operating system\nJawaban: A\n\n2. CSS digunakan untuk?\nA. Struktur\nB. Styling\nC. Backend\nD. Testing\nJawaban: B"}
                    className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-[11px] text-slate-800 resize-none focus:outline-none font-mono"
                  />
                  <button type="button" onClick={handlePasteImport} className="py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition">
                    Import Soal ({pasteText.split("\n").filter(l => l.trim().match(/^\d+[\.\)]/)).length} soal terdeteksi)
                  </button>
                </div>
              )}

              {/* Questions list */}
              <div className="flex flex-col gap-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">Soal #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <select value={q.type} onChange={e => updateQuestion(idx, "type", e.target.value)} className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-white">
                          <option value="PG">Pilihan Ganda</option>
                          <option value="ESAI">Esai</option>
                        </select>
                        <button type="button" onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={q.question}
                      onChange={e => updateQuestion(idx, "question", e.target.value)}
                      placeholder="Tulis pertanyaan..."
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] resize-none focus:outline-none"
                    />

                    {/* Image URL */}
                    <div className="flex items-center gap-2">
                      <Image className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="url"
                        value={q.imageUrl}
                        onChange={e => updateQuestion(idx, "imageUrl", e.target.value)}
                        placeholder="URL Gambar (opsional)"
                        className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none"
                      />
                    </div>

                    {q.type === "PG" && (
                      <div className="flex flex-col gap-1">
                        {q.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name={`correct-${idx}`}
                              checked={q.correctAnswer === String(oIdx)}
                              onChange={() => updateQuestion(idx, "correctAnswer", String(oIdx))}
                              className="accent-emerald-600"
                            />
                            <span className="text-[10px] font-bold text-slate-500 w-4">{String.fromCharCode(65 + oIdx)}.</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => updateOption(idx, oIdx, e.target.value)}
                              placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`}
                              className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Poin:</span>
                      <input
                        type="number"
                        value={q.points}
                        onChange={e => updateQuestion(idx, "points", parseInt(e.target.value) || 10)}
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-center focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {importMode === "manual" && (
                <button type="button" onClick={addQuestion} className="py-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold text-xs hover:border-rose-400 hover:text-rose-600 transition flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Soal
                </button>
              )}

              <button
                type="submit"
                disabled={creating || questions.length === 0}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{creating ? "Membuat Ujian..." : `Buat Ujian (${questions.length} Soal)`}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}