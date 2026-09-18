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
  Settings2,
  FileSpreadsheet,
  Download,
  CalendarClock,
  ListChecks,
  CheckSquare
} from "lucide-react"
import * as XLSX from "xlsx"

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
  // Jendela pelaksanaan ujian. Sebelumnya hanya bisa diatur setelah ujian
  // dibuat, lewat halaman Kelola.
  const [examStartAt, setExamStartAt] = useState("")
  const [examEndAt, setExamEndAt] = useState("")
  const [examPublish, setExamPublish] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  // Import state
  const [importMode, setImportMode] = useState<"manual" | "paste" | "excel">("manual")
  const [pasteText, setPasteText] = useState("")
  const [importError, setImportError] = useState("")

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

  /** Lima opsi A–E sesuai format ujian nasional. */
  const OPSI_KOSONG = () => ["", "", "", "", ""]

  const addQuestion = () => {
    setQuestions([...questions, {
      question: "",
      imageUrl: "",
      type: "PG",
      options: OPSI_KOSONG(),
      correctAnswer: "0",
      points: 10
    }])
  }

  /**
   * Untuk PG kompleks, kunci jawaban disimpan sebagai daftar indeks dipisah
   * koma ("0,2,4"). Fungsi ini menyalakan/mematikan satu opsi.
   */
  const toggleKunciKompleks = (idx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q
      const dipilih = new Set(
        String(q.correctAnswer || "").split(",").map((x: string) => x.trim()).filter(Boolean)
      )
      const kunci = String(oIdx)
      if (dipilih.has(kunci)) dipilih.delete(kunci)
      else dipilih.add(kunci)
      return {
        ...q,
        correctAnswer: Array.from(dipilih).sort((a, b) => Number(a) - Number(b)).join(",")
      }
    }))
  }

  const kunciAktif = (q: any, oIdx: number) =>
    String(q.correctAnswer || "")
      .split(",")
      .map((x: string) => x.trim())
      .includes(String(oIdx))

  /** Tambah/kurangi jumlah opsi per soal (minimal 2, maksimal 8). */
  const ubahJumlahOpsi = (idx: number, delta: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q
      const opts = [...q.options]
      if (delta > 0 && opts.length < 8) opts.push("")
      if (delta < 0 && opts.length > 2) opts.pop()
      // Buang kunci yang menunjuk opsi yang sudah tidak ada.
      const kunci = String(q.correctAnswer || "")
        .split(",").map((x: string) => x.trim()).filter(Boolean)
        .filter((k: string) => Number(k) < opts.length)
      return { ...q, options: opts, correctAnswer: kunci.join(",") || "0" }
    }))
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

  /**
   * Templat Excel untuk menyusun soal di luar aplikasi.
   *
   * Kolom "URL Gambar" menerima tautan gambar biasa maupun tautan embed —
   * gambar ditampilkan langsung di atas soal, baik saat guru meninjau maupun
   * saat siswa mengerjakan.
   */
  const handleDownloadTemplateSoal = () => {
    const contoh = [
      {
        "Tipe": "PG",
        "Pertanyaan": "Perangkat pada gambar berikut berfungsi untuk?",
        "URL Gambar": "https://contoh.com/gambar-router.jpg",
        "Opsi A": "Menghubungkan antar jaringan",
        "Opsi B": "Menyimpan data",
        "Opsi C": "Mencetak dokumen",
        "Opsi D": "Menguatkan sinyal listrik",
        "Opsi E": "Mendinginkan prosesor",
        "Jawaban Benar": "A",
        "Poin": 10
      },
      {
        "Tipe": "PG_KOMPLEKS",
        "Pertanyaan": "Manakah yang termasuk topologi jaringan? (jawaban bisa lebih dari satu)",
        "URL Gambar": "",
        "Opsi A": "Star",
        "Opsi B": "Bus",
        "Opsi C": "HTTP",
        "Opsi D": "Ring",
        "Opsi E": "SMTP",
        "Jawaban Benar": "A,B,D",
        "Poin": 15
      },
      {
        "Tipe": "ESAI",
        "Pertanyaan": "Jelaskan perbedaan HUB dan SWITCH beserta contoh penggunaannya.",
        "URL Gambar": "",
        "Opsi A": "", "Opsi B": "", "Opsi C": "", "Opsi D": "", "Opsi E": "",
        "Jawaban Benar": "",
        "Poin": 20
      }
    ]

    const petunjuk = [
      { Kolom: "Tipe", Keterangan: "PG = satu jawaban benar; PG_KOMPLEKS = boleh lebih dari satu; ESAI = dinilai guru" },
      { Kolom: "Pertanyaan", Keterangan: "Wajib diisi" },
      { Kolom: "URL Gambar", Keterangan: "Opsional. Tautan gambar (jpg/png) atau tautan embed; ditampilkan di atas soal" },
      { Kolom: "Opsi A–E", Keterangan: "Isi minimal 2 opsi untuk PG dan PG_KOMPLEKS. Kosongkan untuk ESAI" },
      { Kolom: "Jawaban Benar", Keterangan: "Huruf opsi. PG: satu huruf (mis. A). PG_KOMPLEKS: dipisah koma (mis. A,B,D). ESAI: kosongkan" },
      { Kolom: "Poin", Keterangan: "Bobot nilai soal. Kosong berarti 10" },
      { Kolom: "", Keterangan: "" },
      { Kolom: "Catatan", Keterangan: "PG kompleks dinilai utuh: semua jawaban benar harus dipilih dan tidak boleh ada yang salah" }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contoh), "Soal")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(petunjuk), "Petunjuk")
    XLSX.writeFile(wb, "Template_Soal_Ujian.xlsx")
  }

  /** Baca berkas Excel/CSV berisi soal lalu masukkan ke daftar. */
  const handleFileSoal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError("")

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" })
        // Ambil lembar "Soal" bila ada; kalau tidak, lembar pertama.
        const nama = wb.SheetNames.includes("Soal") ? "Soal" : wb.SheetNames[0]
        const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[nama], { defval: "" })

        if (rows.length === 0) {
          setImportError("Lembar soal kosong.")
          return
        }

        const ambil = (row: any, ...kunci: string[]) => {
          for (const k of Object.keys(row)) {
            const bersih = k.trim().toLowerCase()
            if (kunci.some(x => bersih === x || bersih.includes(x))) {
              return String(row[k]).trim()
            }
          }
          return ""
        }

        const hasil: any[] = []
        const dilewati: string[] = []

        rows.forEach((row, i) => {
          const pertanyaan = ambil(row, "pertanyaan", "soal")
          if (!pertanyaan) {
            dilewati.push(`baris ${i + 2} (pertanyaan kosong)`)
            return
          }

          let tipe = ambil(row, "tipe", "type").toUpperCase().replace(/[\s-]/g, "_")
          if (tipe.includes("KOMPLEK")) tipe = "PG_KOMPLEKS"
          else if (tipe.startsWith("ESAI") || tipe.startsWith("URAIAN")) tipe = "ESAI"
          else tipe = "PG"

          const opsi = ["a", "b", "c", "d", "e", "f", "g", "h"]
            .map(h => ambil(row, `opsi ${h}`))
          // Buang opsi kosong di ujung, sisakan minimal 5 kolom untuk PG.
          while (opsi.length > 0 && opsi[opsi.length - 1] === "") opsi.pop()

          const jawabanMentah = ambil(row, "jawaban benar", "jawaban", "kunci")
          // Huruf opsi -> indeks. "A,B,D" menjadi "0,1,3".
          const indeks = jawabanMentah
            .split(",")
            .map(x => x.trim().toUpperCase())
            .filter(Boolean)
            .map(x => (/^[A-H]$/.test(x) ? x.charCodeAt(0) - 65 : Number(x) - 1))
            .filter(n => Number.isInteger(n) && n >= 0 && n < Math.max(opsi.length, 1))
            .sort((a, b) => a - b)

          if (tipe !== "ESAI") {
            if (opsi.filter(Boolean).length < 2) {
              dilewati.push(`baris ${i + 2} (opsi kurang dari 2)`)
              return
            }
            if (indeks.length === 0) {
              dilewati.push(`baris ${i + 2} (jawaban benar tidak dikenali)`)
              return
            }
            if (tipe === "PG" && indeks.length > 1) tipe = "PG_KOMPLEKS"
          }

          const poin = parseInt(ambil(row, "poin", "bobot"), 10)

          hasil.push({
            question: pertanyaan,
            imageUrl: ambil(row, "url gambar", "gambar", "image"),
            type: tipe,
            options: tipe === "ESAI" ? OPSI_KOSONG() : (opsi.length >= 5 ? opsi : [...opsi, ...Array(5 - opsi.length).fill("")]),
            correctAnswer: tipe === "ESAI" ? "" : indeks.join(","),
            points: Number.isFinite(poin) && poin > 0 ? poin : 10
          })
        })

        if (hasil.length === 0) {
          setImportError(`Tidak ada soal yang bisa dibaca. ${dilewati.slice(0, 3).join("; ")}`)
          return
        }

        setQuestions(prev => [...prev, ...hasil])
        setImportError(
          dilewati.length > 0
            ? `${hasil.length} soal masuk. Dilewati: ${dilewati.slice(0, 5).join("; ")}${dilewati.length > 5 ? ", dst." : ""}`
            : ""
        )
        setImportMode("manual")
      } catch (err: any) {
        setImportError("Gagal membaca berkas: " + (err?.message || "format tidak valid"))
      }
    }
    reader.readAsBinaryString(file)
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

    // Soal pilihan ganda tanpa kunci jawaban mustahil dijawab benar, jadi
    // dicegah di sini daripada ketahuan setelah ujian berjalan.
    const tanpaKunci = questions
      .map((q, i) => ({ q, no: i + 1 }))
      .filter(({ q }) => q.type !== "ESAI" && !String(q.correctAnswer || "").trim())
      .map(({ no }) => no)
    if (tanpaKunci.length > 0) {
      alert(`Kunci jawaban belum dipilih pada soal nomor: ${tanpaKunci.join(", ")}`)
      return
    }

    const opsiKurang = questions
      .map((q, i) => ({ q, no: i + 1 }))
      .filter(({ q }) => q.type !== "ESAI" && q.options.filter((o: string) => o.trim()).length < 2)
      .map(({ no }) => no)
    if (opsiKurang.length > 0) {
      alert(`Minimal 2 opsi jawaban harus diisi pada soal nomor: ${opsiKurang.join(", ")}`)
      return
    }

    setCreating(true)
    const adaEsai = questions.some(q => q.type === "ESAI")
    const adaKompleks = questions.some(q => q.type === "PG_KOMPLEKS")

    const res = await createExam({
      title: examTitle,
      type: adaEsai ? "CAMPURAN" : adaKompleks ? "PG_KOMPLEKS" : "PG",
      classId: examClassId,
      subjectId: examSubjectId,
      duration: examDuration,
      startAt: examStartAt ? new Date(examStartAt).toISOString() : undefined,
      endAt: examEndAt ? new Date(examEndAt).toISOString() : undefined,
      isPublished: examPublish,
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
      setExamStartAt("")
      setExamEndAt("")
      setExamPublish(false)
      setImportError("")
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

              <div className="grid grid-cols-2 gap-2">
                {/* Kelas dan mapel dipilih sebagai satu pasangan penugasan.
                    Dua select terpisah sebelumnya tidak saling menyaring, jadi
                    guru bisa memilih kombinasi kelas+mapel yang tidak
                    diampunya — lalu ditolak server saat disimpan. */}
                <select
                  value={examClassId && examSubjectId ? `${examClassId}|${examSubjectId}` : ""}
                  onChange={e => {
                    const [c, sb] = e.target.value.split("|")
                    setExamClassId(c || "")
                    setExamSubjectId(sb || "")
                  }}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="">Pilih Kelas &amp; Mapel</option>
                  {teacherClasses.map((tc: any) => (
                    <option
                      key={`${tc.classId}|${tc.subjectId}`}
                      value={`${tc.classId}|${tc.subjectId}`}
                    >
                      {tc.classInfo.name} — {tc.subject.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input type="number" value={examDuration} onChange={e => setExamDuration(parseInt(e.target.value) || 60)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                  <span className="text-[10px] text-slate-500 shrink-0">mnt</span>
                </div>
              </div>

              {/* Tanggal & jam pelaksanaan. Sebelumnya hanya bisa diatur
                  setelah ujian dibuat, lewat halaman Kelola. */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <CalendarClock className="w-3.5 h-3.5 text-rose-600" />
                  Tanggal &amp; Jam Ujian
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dibuka</span>
                    <input
                      type="datetime-local"
                      value={examStartAt}
                      onChange={e => setExamStartAt(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ditutup</span>
                    <input
                      type="datetime-local"
                      value={examEndAt}
                      onChange={e => setExamEndAt(e.target.value)}
                      className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none"
                    />
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Kosongkan bila ujian boleh dikerjakan kapan saja. Durasi tetap
                  dihitung dari saat siswa mulai, dan diverifikasi di server.
                </p>

                <label className="flex items-center gap-2 pt-1 border-t border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examPublish}
                    onChange={e => setExamPublish(e.target.checked)}
                  />
                  <span className="text-[11px] text-slate-700">
                    <strong>Terbitkan sekarang</strong> — tanpa ini ujian tersimpan
                    sebagai draf dan tidak tampil ke siswa.
                  </span>
                </label>
              </div>

              {/* Import mode tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-xl font-bold text-[11px]">
                <button type="button" onClick={() => setImportMode("manual")} className={`py-1.5 rounded-lg transition ${importMode === "manual" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600"}`}>
                  Input Manual
                </button>
                <button type="button" onClick={() => setImportMode("paste")} className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${importMode === "paste" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600"}`}>
                  <ClipboardPaste className="w-3 h-3" /> Tempel
                </button>
                <button type="button" onClick={() => setImportMode("excel")} className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${importMode === "excel" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600"}`}>
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
              </div>

              {importMode === "excel" && (
                <div className="flex flex-col gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <p className="text-[10px] text-emerald-900 leading-relaxed">
                    Templat berisi kolom <strong>URL Gambar</strong> (soal bergambar),
                    <strong> Opsi A–E</strong>, dan tipe <strong>PG_KOMPLEKS</strong>
                    untuk soal berjawaban lebih dari satu. Ada lembar
                    <strong> Petunjuk</strong> di dalamnya.
                  </p>

                  <button
                    type="button"
                    onClick={handleDownloadTemplateSoal}
                    className="py-2 bg-white border border-emerald-300 text-emerald-800 font-bold rounded-xl transition hover:bg-emerald-100 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh Templat Soal (.xlsx)
                  </button>

                  <label className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Pilih Berkas Soal
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSoal}
                      className="hidden"
                    />
                  </label>

                  {importError && (
                    <p className="text-[10px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded-xl px-2.5 py-2">
                      {importError}
                    </p>
                  )}
                </div>
              )}

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
                          <option value="PG">PG (1 jawaban)</option>
                          <option value="PG_KOMPLEKS">PG Kompleks (&gt;1 jawaban)</option>
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

                    {q.type !== "ESAI" && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            {q.type === "PG_KOMPLEKS" ? (
                              <><CheckSquare className="w-3 h-3 text-emerald-600" /> Centang SEMUA jawaban benar</>
                            ) : (
                              <><ListChecks className="w-3 h-3 text-emerald-600" /> Pilih satu jawaban benar</>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <button type="button" onClick={() => ubahJumlahOpsi(idx, -1)} title="Kurangi opsi"
                              className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold text-[11px] leading-none hover:bg-slate-300">−</button>
                            <span className="text-[10px] text-slate-500 w-10 text-center">{q.options.length} opsi</span>
                            <button type="button" onClick={() => ubahJumlahOpsi(idx, 1)} title="Tambah opsi"
                              className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold text-[11px] leading-none hover:bg-slate-300">+</button>
                          </span>
                        </div>

                        {q.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            {q.type === "PG_KOMPLEKS" ? (
                              <input
                                type="checkbox"
                                checked={kunciAktif(q, oIdx)}
                                onChange={() => toggleKunciKompleks(idx, oIdx)}
                                className="accent-emerald-600"
                              />
                            ) : (
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={q.correctAnswer === String(oIdx)}
                                onChange={() => updateQuestion(idx, "correctAnswer", String(oIdx))}
                                className="accent-emerald-600"
                              />
                            )}
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