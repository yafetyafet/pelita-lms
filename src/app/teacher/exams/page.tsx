"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import { getPenugasanSaya, getTeacherExams, createExam, deleteExam, updateExamSettings } from "@/app/actions/teacher"
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
import { muatXlsx } from "@/lib/xlsx"
import { parseSoalTempel } from "@/lib/logic/parser-soal"
import { normalisasiUrlGambar, peringatanUrlGambar } from "@/lib/logic/gambar-url"

export default function TeacherExamsPage() {
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [examTitle, setExamTitle] = useState("")
  // Satu ujian bisa dipakai beberapa rombel sekaligus asalkan mapelnya sama,
  // jadi yang dipilih adalah SATU mapel dan BEBERAPA rombel - bukan lagi satu
  // pasangan kelas+mapel.
  const [examClassIds, setExamClassIds] = useState<string[]>([])
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
      const [cls, exm] = await Promise.all([getPenugasanSaya(), getTeacherExams()])
      setTeacherClasses(cls)
      setExams(exm)
      if (cls.length > 0) {
        setExamSubjectId(cls[0].subjectId)
        setExamClassIds([cls[0].classId])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  // Mapel yang diampu guru ini, tanpa duplikat.
  const mapelSaya = Array.from(
    new Map(
      teacherClasses.map((tc: any) => [tc.subjectId, { id: tc.subjectId, name: tc.subject.name }])
    ).values()
  )

  // Rombel yang diampu guru ini UNTUK mapel yang sedang dipilih. Daftar ini
  // yang membatasi pilihan, sehingga guru tidak bisa memilih rombel yang
  // tidak diampunya lalu ditolak server saat menyimpan.
  const rombelUntukMapel = teacherClasses.filter(
    (tc: any) => tc.subjectId === examSubjectId
  )

  const toggleRombel = (classId: string) => {
    setExamClassIds(prev =>
      prev.includes(classId) ? prev.filter(c => c !== classId) : [...prev, classId]
    )
  }

  // Total bobot seluruh soal. Guru perlu angka ini saat menyusun soal supaya
  // totalnya pas (mis. 100) tanpa menjumlahkan sendiri di kertas.
  const totalPoin = questions.reduce(
    (t, q) => t + (Number.isFinite(Number(q.points)) ? Number(q.points) : 0),
    0
  )
  // Penjumlahan pecahan biner meninggalkan ekor seperti 7.500000000000001;
  // dibulatkan ke 2 desimal supaya yang terbaca guru adalah 7.5.
  const totalPoinRapi = Math.round(totalPoin * 100) / 100

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

  /**
   * Buang pernyataan Benar/Salah yang kosong BERSAMA nilai kunci di posisinya.
   * Tanpa ini baris kosong ikut tersimpan sebagai pernyataan hampa, dan
   * kuncinya bergeser satu posisi dari yang dimaksud guru.
   */
  const rapikanBS = (q: any) => {
    const k = kunciBS(q)
    const options: string[] = []
    const kunci: string[] = []
    ;(q.options as string[]).forEach((o, i) => {
      if (String(o).trim()) { options.push(String(o).trim()); kunci.push(k[i]) }
    })
    return { options, correctAnswer: kunci.join(",") }
  }

  /** Kunci Benar/Salah sebagai daftar sepanjang jumlah pernyataan. */
  const kunciBS = (q: any): string[] => {
    const n = String(q.correctAnswer || "").split(",").map((x: string) => x.trim().toUpperCase())
    return (q.options as string[]).map((_: string, i: number) => (n[i] === "S" ? "S" : "B"))
  }

  const setKunciBS = (idx: number, oIdx: number, v: "B" | "S") => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q
      const k = kunciBS(q)
      k[oIdx] = v
      return { ...q, correctAnswer: k.join(",") }
    }))
  }

  /**
   * Bentuk kunci tiap tipe berbeda - indeks untuk PG, posisional B/S untuk
   * Benar/Salah - jadi saat tipe berganti kunci lama tidak lagi bermakna.
   */
  const gantiTipe = (idx: number, tipeBaru: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q
      if (tipeBaru === "BENAR_SALAH") {
        return { ...q, type: tipeBaru, correctAnswer: (q.options as string[]).map(() => "B").join(",") }
      }
      if (q.type === "BENAR_SALAH") return { ...q, type: tipeBaru, correctAnswer: "0" }
      return { ...q, type: tipeBaru }
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
      if (q.type === "BENAR_SALAH") {
        const k = kunciBS(q).slice(0, opts.length)
        while (k.length < opts.length) k.push("B")
        return { ...q, options: opts, correctAnswer: k.join(",") }
      }
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
  /** "b, Salah ,true" -> ["B","S","B"]; nilai tak dikenal dibiarkan apa adanya. */
  const normalisasiBS = (raw: string): string[] =>
    raw
      .split(/[,;/ ]+/)
      .map(x => x.trim().toUpperCase())
      .filter(Boolean)
      .map(x => (x === "BENAR" || x === "TRUE" || x === "T" || x === "1" ? "B" : x === "SALAH" || x === "FALSE" || x === "F" || x === "0" ? "S" : x))

  const handleDownloadTemplateSoal = async () => {
    const XLSX = await muatXlsx()

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
        "Tipe": "BENAR_SALAH",
        "Pertanyaan": "Perhatikan pernyataan tentang jaringan komputer berikut. Tentukan Benar atau Salah untuk setiap pernyataan.",
        "URL Gambar": "",
        "Opsi A": "Switch bekerja pada lapisan data link",
        "Opsi B": "Alamat IPv4 terdiri dari 128 bit",
        "Opsi C": "Router menghubungkan dua jaringan berbeda",
        "Opsi D": "HTTP berjalan di atas UDP",
        "Opsi E": "",
        "Jawaban Benar": "B,S,B,S",
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
      { Kolom: "Tipe", Keterangan: "PG = satu jawaban benar; PG_KOMPLEKS = boleh lebih dari satu; BENAR_SALAH = tiap pernyataan dinilai B/S (bentuk TKA); ESAI = dinilai guru" },
      { Kolom: "Pertanyaan", Keterangan: "Wajib diisi" },
      { Kolom: "URL Gambar", Keterangan: "Opsional. Tautan gambar (jpg/png) atau tautan embed; ditampilkan di atas soal" },
      { Kolom: "Opsi A–E", Keterangan: "PG/PG_KOMPLEKS: minimal 2 opsi. BENAR_SALAH: isi dengan PERNYATAAN, satu per kolom (minimal 2). ESAI: kosongkan" },
      { Kolom: "Jawaban Benar", Keterangan: "PG: satu huruf (mis. A). PG_KOMPLEKS: huruf dipisah koma (mis. A,B,D). BENAR_SALAH: B atau S per pernyataan, urut (mis. B,S,B,S). ESAI: kosongkan" },
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
    reader.onload = async (ev) => {
      try {
        const XLSX = await muatXlsx()
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
          else if (tipe.includes("BENAR") || tipe === "BS" || tipe === "B/S") tipe = "BENAR_SALAH"
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

          // Benar/Salah: kunci posisional, satu B/S per pernyataan.
          let kunciBS = ""
          if (tipe === "BENAR_SALAH") {
            const pernyataan = opsi.filter(Boolean)
            const nilai = normalisasiBS(jawabanMentah)
            if (pernyataan.length < 2) {
              dilewati.push(`baris ${i + 2} (pernyataan kurang dari 2)`)
              return
            }
            if (nilai.length !== pernyataan.length || nilai.some(x => x !== "B" && x !== "S")) {
              dilewati.push(`baris ${i + 2} (kunci Benar/Salah harus ${pernyataan.length} nilai B/S, urut)`)
              return
            }
            kunciBS = nilai.join(",")
          } else if (tipe !== "ESAI") {
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

          const poin = parseFloat(ambil(row, "poin", "bobot"))

          hasil.push({
            question: pertanyaan,
            imageUrl: ambil(row, "url gambar", "gambar", "image"),
            type: tipe,
            options:
              tipe === "ESAI"
                ? OPSI_KOSONG()
                : tipe === "BENAR_SALAH"
                  ? opsi.filter(Boolean)
                  : (opsi.length >= 5 ? opsi : [...opsi, ...Array(5 - opsi.length).fill("")]),
            correctAnswer: tipe === "ESAI" ? "" : tipe === "BENAR_SALAH" ? kunciBS : indeks.join(","),
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

  /**
   * Impor soal dari teks tempel. Aturannya ada di src/lib/logic/parser-soal.ts
   * (modul murni yang diuji terpisah): tanda * pada jawaban benar, tanda
   * (B)/(S) pada pernyataan, dan deteksi tipe otomatis.
   */
  const handlePasteImport = () => {
    if (!pasteText.trim()) return

    const { soal: imported, catatan } = parseSoalTempel(pasteText)

    if (imported.length === 0) {
      setImportError("Tidak ada soal terdeteksi. Pastikan setiap soal diawali nomor, misalnya \"1.\"")
      return
    }

    const berGambar = imported.filter(q => q.imageUrl).length
    const kompleks = imported.filter(q => q.type === "PG_KOMPLEKS").length
    const benarSalah = imported.filter(q => q.type === "BENAR_SALAH").length
    const esai = imported.filter(q => q.type === "ESAI").length

    const ringkas = [`${imported.length} soal masuk`]
    if (berGambar) ringkas.push(`${berGambar} bergambar`)
    if (kompleks) ringkas.push(`${kompleks} PG kompleks`)
    if (benarSalah) ringkas.push(`${benarSalah} Benar/Salah`)
    if (esai) ringkas.push(`${esai} esai`)

    setImportError(
      catatan.length > 0
        ? `${ringkas.join(", ")}. Perlu dicek: ${catatan.slice(0, 4).join("; ")}${catatan.length > 4 ? ", dst." : ""}`
        : `${ringkas.join(", ")}.`
    )

    setQuestions(prev => [...prev, ...imported])
    setPasteText("")
    setImportMode("manual")
  }

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examTitle || examClassIds.length === 0 || !examSubjectId || questions.length === 0) {
      alert("Lengkapi judul, mapel, minimal 1 rombel, dan minimal 1 soal")
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
    const adaKompleks = questions.some(q => q.type === "PG_KOMPLEKS" || q.type === "BENAR_SALAH")

    const res = await createExam({
      title: examTitle,
      type: adaEsai ? "CAMPURAN" : adaKompleks ? "PG_KOMPLEKS" : "PG",
      classIds: examClassIds,
      subjectId: examSubjectId,
      duration: examDuration,
      startAt: examStartAt ? new Date(examStartAt).toISOString() : undefined,
      endAt: examEndAt ? new Date(examEndAt).toISOString() : undefined,
      isPublished: examPublish,
      questions: questions.map(q => ({
        question: q.question,
        imageUrl: q.imageUrl || undefined,
        type: q.type,
        // Perbandingan sebelumnya `q.type === "PG"` membuat soal PG KOMPLEKS
        // tersimpan tanpa opsi dan tanpa kunci jawaban sama sekali — tampil ke
        // siswa sebagai soal tanpa pilihan, dan mustahil dinilai benar.
        // Yang membedakan adalah punya-opsi atau tidak, yaitu bukan ESAI.
        options:
          q.type === "ESAI"
            ? undefined
            : JSON.stringify(q.type === "BENAR_SALAH" ? rapikanBS(q).options : q.options),
        correctAnswer:
          q.type === "ESAI"
            ? undefined
            : q.type === "BENAR_SALAH" ? rapikanBS(q).correctAnswer : q.correctAnswer,
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

  // Status terbit sebelumnya hanya berupa label di daftar ujian; satu-satunya
  // cara menerbitkan adalah membuka Kelola lalu menggeser sakelar di sana.
  // Sekarang labelnya menjadi tombol.
  const [publishing, setPublishing] = useState<string | null>(null)
  const [pesanTerbit, setPesanTerbit] = useState("")

  const handleTogglePublish = async (exam: any) => {
    const menerbitkan = !exam.isPublished

    if (menerbitkan && (exam.questions?.length || 0) === 0) {
      alert("Ujian ini belum punya soal, jadi belum bisa diterbitkan.")
      return
    }
    if (
      !menerbitkan &&
      !confirm(
        `Tarik kembali "${exam.title}" menjadi draf?\n\nUjian akan hilang dari perangkat siswa. Pengerjaan yang sudah masuk tidak terhapus.`
      )
    ) {
      return
    }

    setPesanTerbit("")
    setPublishing(exam.id)
    const res = await updateExamSettings({ examId: exam.id, isPublished: menerbitkan })
    setPublishing(null)

    if (res.error) {
      alert(res.error)
      return
    }

    setPesanTerbit(
      res.peringatan ||
        (menerbitkan
          ? `"${exam.title}" diterbitkan — sekarang tampil di perangkat siswa.`
          : `"${exam.title}" ditarik kembali menjadi draf.`)
    )
    setExams(await getTeacherExams())
  }

  const handleDeleteExam = async (examId: string) => {
    if (!confirm("Yakin hapus ujian ini?")) return
    await deleteExam(examId)
    const exm = await getTeacherExams()
    setExams(exm)
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat data ujian..." />
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

        {pesanTerbit && (
          <p className="text-[11px] font-semibold text-slate-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {pesanTerbit}
          </p>
        )}

        {exams.length > 0 && exams.some((e: any) => !e.isPublished) && (
          <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
            Ujian berstatus <strong>DRAF</strong> tidak tampil di perangkat siswa.
            Klik labelnya untuk menerbitkan. Pastikan tokennya sudah diisi —
            lewat <strong>Kelola</strong> untuk token khusus ujian, atau menu admin
            untuk token CBT global.
          </p>
        )}

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
                    {/* Status terbit menentukan apakah siswa bisa melihat
                        ujian — jadi dibuat bisa diklik langsung di sini. */}
                    <button
                      onClick={() => handleTogglePublish(exam)}
                      disabled={publishing === exam.id}
                      title={
                        exam.isPublished
                          ? "Klik untuk menarik kembali menjadi draf"
                          : "Klik untuk menerbitkan agar tampil di perangkat siswa"
                      }
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border transition disabled:opacity-50 ${
                        exam.isPublished
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                      }`}
                    >
                      {publishing === exam.id
                        ? "..."
                        : exam.isPublished
                          ? "TERBIT"
                          : "DRAF · klik untuk terbitkan"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {/* Satu ujian bisa dipakai beberapa rombel; semuanya
                        disebutkan agar guru tahu ujian ini menjangkau siapa. */}
                    {(exam.classes ?? [])
                      .map((c: any) => c.classInfo?.name)
                      .filter(Boolean)
                      .join(", ") || "Tanpa rombel"}{" "}
                    • {exam.subject?.name}
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
          <div
            className={`w-full bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto transition-[max-width] ${
              // Mode tempel butuh ruang: petunjuk di kiri, teks soal di kanan.
              // Modal 512 px yang lama memaksa keduanya bertumpuk sempit.
              importMode === "paste" ? "max-w-lg md:max-w-5xl" : "max-w-lg md:max-w-2xl"
            }`}
          >
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
                  value={examSubjectId}
                  onChange={e => {
                    // Ganti mapel berarti daftar rombel ikut berganti, jadi
                    // pilihan rombel lama dikosongkan agar tidak tersimpan
                    // rombel yang tidak mengajarkan mapel ini.
                    setExamSubjectId(e.target.value)
                    setExamClassIds([])
                  }}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {mapelSaya.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <input type="number" value={examDuration} onChange={e => setExamDuration(parseInt(e.target.value) || 60)} className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                  <span className="text-[10px] text-slate-500 shrink-0">mnt</span>
                </div>
              </div>

              {/* Rombel peserta. Satu ujian dipakai beberapa rombel paralel
                  sekaligus: soalnya ditulis sekali, dan perbaikan salah ketik
                  cukup dilakukan di satu tempat. */}
              {examSubjectId && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      Rombel Peserta
                    </span>
                    {rombelUntukMapel.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExamClassIds(
                            examClassIds.length === rombelUntukMapel.length
                              ? []
                              : rombelUntukMapel.map((tc: any) => tc.classId)
                          )
                        }
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        {examClassIds.length === rombelUntukMapel.length
                          ? "Kosongkan"
                          : "Pilih semua"}
                      </button>
                    )}
                  </div>

                  {rombelUntukMapel.length === 0 ? (
                    <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-2">
                      Kamu belum diampukan rombel mana pun untuk mapel ini.
                      Hubungi admin.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {rombelUntukMapel.map((tc: any) => {
                        const aktif = examClassIds.includes(tc.classId)
                        return (
                          <button
                            key={tc.classId}
                            type="button"
                            onClick={() => toggleRombel(tc.classId)}
                            aria-pressed={aktif}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                              aktif
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            {tc.classInfo.name}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {examClassIds.length > 1 && (
                    <p className="text-[10px] text-slate-500">
                      Soal yang sama akan dipakai {examClassIds.length} rombel.
                      Token, jadwal, dan hasilnya tetap satu ujian.
                    </p>
                  )}
                </div>
              )}

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
                    <strong> Opsi A–E</strong>, tipe <strong>PG_KOMPLEKS</strong>
                    untuk soal berjawaban lebih dari satu, dan tipe{" "}
                    <strong>BENAR_SALAH</strong> untuk soal bentuk TKA (tiap
                    pernyataan dinilai Benar/Salah). Ada lembar
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
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  {/* Petunjuk: kolom kiri di laptop. Di HP diletakkan di BAWAH
                      kotak tempel (order-2) supaya kotaknya langsung terlihat. */}
                  <div className="order-2 md:order-none text-[11px] text-amber-900 leading-relaxed md:pr-3 md:border-r md:border-amber-200">
                    <strong className="block mb-1.5 text-xs">Format per baris</strong>
                    <table className="w-full">
                      <tbody>
                        <tr><td className="pr-2 font-mono font-bold align-top whitespace-nowrap">1.</td><td>soal baru</td></tr>
                        <tr><td className="pr-2 font-mono font-bold align-top whitespace-nowrap">A. s.d. H.</td><td>opsi jawaban</td></tr>
                        <tr><td className="pr-2 font-mono font-bold align-top whitespace-nowrap">*</td><td><strong>tanda jawaban benar</strong> — tulis di akhir atau awal opsi: <code>A. Semarang *</code> atau <code>*A. Semarang</code>. Satu bintang = PG, dua atau lebih = PG Kompleks. Tidak perlu baris Jawaban lagi</td></tr>
                        <tr><td className="pr-2 font-mono font-bold align-top whitespace-nowrap">- pernyataan</td><td>soal <strong>Benar/Salah</strong>: kalau soalnya berbunyi "tentukan benar atau salah", tiap baris <code>-</code> adalah pernyataan; beri <code>*</code> pada yang <em>benar</em>, atau tulis <code>(B)</code>/<code>(S)</code> di akhir</td></tr>
                        <tr><td className="pr-2 font-mono font-bold align-top whitespace-nowrap">Gambar:</td><td>tautan gambar soal — boleh juga ditempel sebagai <code>![](url)</code> atau tautannya sendirian di satu baris</td></tr>
                        <tr><td className="pr-2 font-mono font-bold align-top whitespace-nowrap">Jawaban:</td><td>cara lama, tetap bisa: <code>A</code>, <code>A,B,D</code>, atau <code>B,S,B</code> untuk Benar/Salah</td></tr>
                        <tr><td className="pr-2 font-mono font-bold align-top whitespace-nowrap">Poin:</td><td>bobot soal (bawaan 10)</td></tr>
                        <tr><td className="pr-2 font-mono font-bold align-top whitespace-nowrap">Esai</td><td>tidak perlu ditulis — soal <strong>tanpa opsi</strong> otomatis jadi uraian. Tulis kalau ingin memaksa</td></tr>
                      </tbody>
                    </table>
                    <p className="mt-2">
                      <strong>Gambar dari Google Drive:</strong> salin tautan berkasnya
                      apa adanya — aplikasi mengubahnya sendiri menjadi tautan gambar
                      langsung. Yang wajib Anda lakukan: buka <em>Bagikan</em> di Drive
                      dan setel ke <strong>&quot;Siapa saja yang memiliki link&quot;</strong>,
                      kalau tidak gambarnya tetap tidak muncul di HP siswa.
                    </p>
                  </div>

                  <div className="order-1 md:order-none flex flex-col gap-2 min-w-0">
                  <textarea
                    rows={18}
                    spellCheck={false}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={"1. Apa itu HTML?\nA. Bahasa markup *\nB. Bahasa pemrograman\nC. Database\nD. Sistem operasi\nE. Protokol jaringan\n\n2. Perangkat pada gambar berikut berfungsi untuk?\nGambar: https://contoh.com/router.jpg\nA. Menghubungkan antar jaringan\nB. Menyimpan data\nC. Mencetak dokumen\nD. Mendinginkan prosesor\nE. Menguatkan listrik\nJawaban: A\nPoin: 15\n\n3. Manakah yang termasuk topologi jaringan?\nA. Star *\nB. Bus *\nC. HTTP\nD. Ring *\nE. SMTP\n\n4. Tentukan benar atau salah pernyataan berikut.\n- Switch bekerja pada lapisan data link *\n- Alamat IPv4 terdiri dari 128 bit\n- Router menghubungkan dua jaringan berbeda *\nPoin: 15\n\n5. Jelaskan perbedaan HUB dan SWITCH.\nPoin: 20"}
                    className="w-full min-h-[22rem] px-3.5 py-3 bg-white border border-amber-200 rounded-xl text-sm leading-relaxed text-slate-800 resize-y focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-mono"
                  />
                  {importError && (
                    <p className="text-[11px] font-semibold text-slate-800 bg-white border border-amber-300 rounded-xl px-3 py-2">
                      {importError}
                    </p>
                  )}

                  <button type="button" onClick={handlePasteImport} className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition">
                    Import Soal ({pasteText.split("\n").filter(l => l.trim().match(/^\d+[\.\)]/)).length} soal terdeteksi)
                  </button>
                  </div>
                </div>
              )}

              {/* Ringkasan bobot. Ditempel di atas daftar soal supaya guru
                  melihat totalnya sambil mengetik, bukan setelah selesai.
                  Tanpa ini satu-satunya cara mengetahui total adalah
                  menjumlahkan sendiri semua kotak poin. */}
              {questions.length > 0 && (
                <div
                  className={`sticky top-0 z-10 px-3 py-2 rounded-2xl border flex items-center justify-between gap-2 ${
                    totalPoinRapi === 100
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="text-[11px] font-bold">
                    {questions.length} soal &middot; total {totalPoinRapi} poin
                  </span>
                  <span className="text-[10px] opacity-80">
                    {totalPoinRapi === 100
                      ? "pas 100"
                      : `${totalPoinRapi > 100 ? "lebih" : "kurang"} ${Math.round(Math.abs(100 - totalPoinRapi) * 100) / 100} dari 100`}
                  </span>
                </div>
              )}

              {/* Questions list */}
              <div className="flex flex-col gap-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">Soal #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <select value={q.type} onChange={e => gantiTipe(idx, e.target.value)} className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-white">
                          <option value="PG">PG (1 jawaban)</option>
                          <option value="PG_KOMPLEKS">PG Kompleks (&gt;1 jawaban)</option>
                          <option value="BENAR_SALAH">Benar/Salah (tiap pernyataan)</option>
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
                        placeholder="Tautan gambar (opsional) — tautan Drive otomatis disesuaikan"
                        className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none"
                      />
                    </div>
                    {peringatanUrlGambar(q.imageUrl) && (
                      <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                        {peringatanUrlGambar(q.imageUrl)}
                      </p>
                    )}
                    {q.imageUrl && !peringatanUrlGambar(q.imageUrl) && (
                      /* Pratinjau memakai tautan yang SUDAH dinormalkan, jadi
                         apa yang guru lihat di sini sama dengan yang dilihat
                         siswa nanti. */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={normalisasiUrlGambar(q.imageUrl)}
                        alt=""
                        className="max-h-28 rounded-lg border border-slate-200 object-contain self-start bg-white"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                        onLoad={e => { (e.currentTarget as HTMLImageElement).style.display = "block" }}
                      />
                    )}

                    {q.type !== "ESAI" && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            {q.type === "BENAR_SALAH" ? (
                              <><CheckSquare className="w-3 h-3 text-emerald-600" /> Tulis pernyataan, tandai kunci tiap baris</>
                            ) : q.type === "PG_KOMPLEKS" ? (
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
                            {q.type === "BENAR_SALAH" ? (
                              <span className="flex gap-0.5 shrink-0">
                                {(["B", "S"] as const).map(v => {
                                  const aktif = kunciBS(q)[oIdx] === v
                                  return (
                                    <button
                                      key={v}
                                      type="button"
                                      onClick={() => setKunciBS(idx, oIdx, v)}
                                      title={v === "B" ? "Kunci: Benar" : "Kunci: Salah"}
                                      className={`w-6 h-6 rounded-md text-[10px] font-bold border transition ${
                                        aktif
                                          ? v === "B" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-rose-600 border-rose-600 text-white"
                                          : "bg-white border-slate-300 text-slate-400"
                                      }`}
                                    >
                                      {v}
                                    </button>
                                  )
                                })}
                              </span>
                            ) : q.type === "PG_KOMPLEKS" ? (
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
                            <span className="text-[10px] font-bold text-slate-500 w-4">
                              {q.type === "BENAR_SALAH" ? `${oIdx + 1}.` : `${String.fromCharCode(65 + oIdx)}.`}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => updateOption(idx, oIdx, e.target.value)}
                              placeholder={q.type === "BENAR_SALAH" ? `Pernyataan ${oIdx + 1}` : `Opsi ${String.fromCharCode(65 + oIdx)}`}
                              className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Poin:</span>
                      {/* `step="any"` + parseFloat: bobot pecahan seperti 2.5
                          diperlukan untuk membagi total menjadi angka bulat
                          (40 soal x 2.5 = 100). parseInt sebelumnya memangkas
                          2.5 menjadi 2 tanpa peringatan apa pun. */}
                      <input
                        type="number"
                        step="any"
                        min="0"
                        inputMode="decimal"
                        value={q.points}
                        onChange={e => {
                          const n = parseFloat(e.target.value)
                          updateQuestion(idx, "points", Number.isFinite(n) && n >= 0 ? n : 0)
                        }}
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-center focus:outline-none"
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
                <span>
                  {creating
                    ? "Membuat Ujian..."
                    : `Buat Ujian (${questions.length} Soal, ${totalPoinRapi} Poin${
                        examClassIds.length > 1 ? `, ${examClassIds.length} Rombel` : ""
                      })`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}