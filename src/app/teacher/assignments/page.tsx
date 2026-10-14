"use client"

import React, { useState, useEffect, useMemo } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  FileText,
  CalendarClock,
  Users,
  Pencil,
  Save,
  X,
  Search,
  Sparkles,
  ExternalLink,
  Clock,
  Check,
  Award,
} from "lucide-react"
import {
  getPenugasanSaya,
  getTeacherAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "@/app/actions/teacher"
import { TampilanDeskripsiTugas } from "@/components/TampilanDeskripsiTugas"
import { deteksiTipeTugas, hitungSisaWaktu } from "@/lib/logic/assignment-helper"

/** Ubah Date/ISO ke nilai yang diterima <input type="datetime-local">. */
function toLocalInput(value: string | Date | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

const tglPanjang = (d: string | Date) =>
  new Date(d).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

/** Tenggat seminggu dari sekarang, sebagai isian awal yang masuk akal. */
function tenggatDefault() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(23, 59, 0, 0)
  return toLocalInput(d)
}

export default function TeacherAssignmentsPage() {
  const [kelas, setKelas] = useState<any[]>([])
  const [tugas, setTugas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState("")
  const [error, setError] = useState("")

  // Tab & Filter
  const [tabAktif, setTabAktif] = useState<"semua" | "perlu_nilai" | "selesai">("semua")
  const [filterKelas, setFilterKelas] = useState<string>("semua")
  const [cari, setCari] = useState("")

  const [bukaForm, setBukaForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [suntingId, setSuntingId] = useState<string | null>(null)

  const kosong = {
    title: "",
    description: "",
    penugasan: "",
    dueDate: tenggatDefault(),
    maxScore: 100,
    allowLateSubmission: true,
  }
  const [form, setForm] = useState(kosong)

  const muat = async () => setTugas(await getTeacherAssignments())

  useEffect(() => {
    async function load() {
      const [cls, list] = await Promise.all([
        getPenugasanSaya(),
        getTeacherAssignments(),
      ])
      setKelas(cls)
      setTugas(list)
      if (cls.length > 0) {
        setForm((f) => ({ ...f, penugasan: `${cls[0].classId}|${cls[0].subjectId}` }))
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const beriToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(""), 3500)
  }

  const mulaiBuat = () => {
    setSuntingId(null)
    setForm({
      ...kosong,
      penugasan: kelas.length > 0 ? `${kelas[0].classId}|${kelas[0].subjectId}` : "",
    })
    setBukaForm(true)
    setError("")
  }

  const mulaiSunting = (t: any) => {
    setSuntingId(t.id)
    setForm({
      title: t.title,
      description: t.description || "",
      penugasan: `${t.classInfo.id}|${t.subject.id}`,
      dueDate: toLocalInput(t.dueDate),
      maxScore: t.maxScore,
      allowLateSubmission: t.allowLateSubmission,
    })
    setBukaForm(true)
    setError("")
  }

  const sisipkanTemplate = (jenis: "uraian" | "kuis" | "drive") => {
    let teksTambahan = ""
    if (jenis === "uraian") {
      teksTambahan =
        "Petunjuk Pengerjaan:\n1. Bacalah materi yang telah dipelajari dengan seksama.\n2. Jawab pertanyaan di bawah ini dengan jelas dan tepat.\n\nPertanyaan:\n1. Jelaskan ...\n2. Sebutkan dan uraikan ..."
    } else if (jenis === "kuis") {
      teksTambahan =
        "Petunjuk Kuis:\nSilakan buka dan kerjakan kuis online melalui tautan berikut:\nhttps://docs.google.com/forms/d/...\n\nSetelah selesai, tekan tombol 'Kumpulkan Jawaban' di bawah untuk konfirmasi pengerjaan."
    } else if (jenis === "drive") {
      teksTambahan =
        "Petunjuk Tugas:\nUnduh atau buka lembar soal tugas pada tautan Google Drive berikut:\nhttps://drive.google.com/file/d/...\n\nKerjakan pada buku catatan/dokumen Word, lalu kumpulkan tautan berkas jawabanmu di halaman ini."
    }

    setForm((f) => ({
      ...f,
      description: f.description ? `${f.description}\n\n${teksTambahan}` : teksTambahan,
    }))
  }

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.title.trim()) {
      setError("Judul tugas harus diisi.")
      return
    }
    if (!suntingId && !form.penugasan) {
      setError("Pilih kelas dan mapel dulu.")
      return
    }

    setSaving(true)
    const [classId, subjectId] = form.penugasan.split("|")

    const res = suntingId
      ? await updateAssignment({
          id: suntingId,
          title: form.title,
          description: form.description,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          maxScore: Number(form.maxScore),
          allowLateSubmission: form.allowLateSubmission,
        })
      : await createAssignment({
          title: form.title,
          description: form.description,
          classId,
          subjectId,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
          maxScore: Number(form.maxScore),
          allowLateSubmission: form.allowLateSubmission,
        })

    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }

    setBukaForm(false)
    setSuntingId(null)
    beriToast(suntingId ? "Tugas berhasil diperbarui." : "Tugas berhasil dibuat dan langsung tampil di siswa!")
    await muat()
  }

  const hapus = async (t: any) => {
    if (
      !confirm(
        `Hapus tugas "${t.title}"?\n\n${t.jumlahTerkumpul} pengumpulan siswa beserta nilainya ikut terhapus dan tidak bisa dikembalikan.`
      )
    )
      return
    const res = await deleteAssignment(t.id)
    if (res.error) {
      setError(res.error)
      return
    }
    beriToast("Tugas berhasil dihapus.")
    await muat()
  }

  // Statistik
  const perluDinilai = useMemo(
    () => tugas.reduce((n, t) => n + (t.jumlahTerkumpul - t.jumlahDinilai), 0),
    [tugas]
  )

  const daftarKelasMapel = useMemo(() => {
    const map = new Map<string, string>()
    tugas.forEach((t) => {
      if (t.classInfo?.id) {
        map.set(t.classInfo.id, t.classInfo.name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [tugas])

  // Filter tugas
  const tugasTerfilter = useMemo(() => {
    return tugas.filter((t) => {
      const belumNilai = t.jumlahTerkumpul - t.jumlahDinilai

      if (tabAktif === "perlu_nilai" && belumNilai <= 0) return false
      if (tabAktif === "selesai" && (t.jumlahTerkumpul === 0 || belumNilai > 0)) return false

      if (filterKelas !== "semua" && t.classInfo?.id !== filterKelas) return false

      if (cari.trim()) {
        const q = cari.toLowerCase()
        const matchTitle = t.title?.toLowerCase().includes(q)
        const matchMapel = t.subject?.name?.toLowerCase().includes(q)
        const matchKelas = t.classInfo?.name?.toLowerCase().includes(q)
        if (!matchTitle && !matchMapel && !matchKelas) return false
      }

      return true
    })
  }, [tugas, tabAktif, filterKelas, cari])

  if (isLoading) {
    return <PemuatData pesan="Memuat data tugas guru..." />
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 pb-28 w-full min-w-0 max-w-7xl mx-auto">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/teacher"
            className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              Kelola Tugas &amp; Kuis
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Buat penugasan baru, latihan kuis, dan periksa lembar jawaban siswa
            </p>
          </div>
        </div>

        <button
          onClick={mulaiBuat}
          disabled={kelas.length === 0}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition shadow-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Buat Tugas Baru
        </button>
      </div>

      {/* Ringkasan Status Guru */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Tugas</span>
          <span className="text-xl font-black text-slate-900 mt-1">{tugas.length}</span>
          <span className="text-[10px] text-slate-400">Aktif &amp; Riwayat</span>
        </div>

        <div
          onClick={() => setTabAktif("perlu_nilai")}
          className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col ${
            perluDinilai > 0
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-100"
              : "bg-white border-slate-200/80"
          }`}
        >
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Perlu Dinilai</span>
          <span className={`text-xl font-black mt-1 ${perluDinilai > 0 ? "text-amber-800" : "text-slate-900"}`}>
            {perluDinilai}
          </span>
          <span className="text-[10px] text-amber-700">Pengumpulan baru</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kelas Diampu</span>
          <span className="text-xl font-black text-slate-900 mt-1">{kelas.length}</span>
          <span className="text-[10px] text-slate-400">Rombel pengajaran</span>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {kelas.length === 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 leading-relaxed">
          Kamu belum memiliki kelas yang diampu. Hubungi admin atau atur mata pelajaran dan kelasmu di menu{" "}
          <strong>Master Mapel</strong> terlebih dahulu.
        </p>
      )}

      {/* ---------------- Form Buat / Edit Tugas ---------------- */}
      {bukaForm && (
        <form
          onSubmit={simpan}
          className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-md flex flex-col gap-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                {suntingId ? "Ubah Informasi Tugas" : "Buat Tugas / Kuis Baru"}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tugas akan langsung muncul di halaman beranda siswa kelas yang dipilih
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBukaForm(false)
                setSuntingId(null)
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Rombel & Mapel */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-700">
              Kelas &amp; Mata Pelajaran Sasaran: <span className="text-rose-500">*</span>
            </span>
            <select
              value={form.penugasan}
              onChange={(e) => setForm({ ...form, penugasan: e.target.value })}
              disabled={Boolean(suntingId)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-60 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">Pilih Kelas &amp; Mapel</option>
              {kelas.map((tc: any) => (
                <option key={`${tc.classId}|${tc.subjectId}`} value={`${tc.classId}|${tc.subjectId}`}>
                  {tc.classInfo.name} — {tc.subject.name}
                </option>
              ))}
            </select>
          </label>

          {/* Judul Tugas */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-700">
              Judul Tugas / Kuis: <span className="text-rose-500">*</span>
            </span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Latihan Soal Bab 3 — Eksponen dan Logaritma"
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </label>

          {/* Instruksi & Petunjuk Soal */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-bold text-slate-700">
                Instruksi, Soal, atau Tautan Dokumen:
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-medium mr-1">Bantuan Format:</span>
                <button
                  type="button"
                  onClick={() => sisipkanTemplate("uraian")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-semibold transition"
                >
                  + Soal Uraian
                </button>
                <button
                  type="button"
                  onClick={() => sisipkanTemplate("drive")}
                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[10px] font-semibold transition"
                >
                  + Google Drive
                </button>
                <button
                  type="button"
                  onClick={() => sisipkanTemplate("kuis")}
                  className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-[10px] font-semibold transition"
                >
                  + Google Form / Kuis
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tuliskan petunjuk pengerjaan dan daftar pertanyaan di sini. Anda juga dapat menempelkan tautan Google Drive, Google Docs, atau Google Form secara langsung."
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
            />

            <p className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200 leading-relaxed">
              💡 <strong>Tips Google Drive / Google Form:</strong> Cukup tempelkan tautan publik berkas atau kuis di atas. Sistem Pelita akan secara otomatis merendernya menjadi lembar dokumen tugas interaktif yang siap dilihat siswa.
            </p>
          </div>

          {/* Pratinjau Tampilan Siswa */}
          {form.description && (
            <div className="flex flex-col gap-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Pratinjau Tampilan Dokumen di Layar Siswa:
              </span>
              <TampilanDeskripsiTugas description={form.description} />
            </div>
          )}

          {/* Pengaturan Batas Waktu & Skor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Batas Pengumpulan (Tenggat):</span>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Nilai Maksimal:</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) || 100 })}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          {/* Opsi Susulan */}
          <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={form.allowLateSubmission}
              onChange={(e) => setForm({ ...form, allowLateSubmission: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Izinkan siswa mengumpulkan susulan setelah tenggat waktu terlewati (akan ditandai <i>Terlambat</i>)</span>
          </label>

          {/* Tombol Simpan */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? "Menyimpan Tugas..." : suntingId ? "Simpan Perubahan Tugas" : "Terbitkan Tugas"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBukaForm(false)
                setSuntingId(null)
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* ---------------- Filter & Navigasi Daftar Tugas ---------------- */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl text-xs font-bold w-fit">
          <button
            type="button"
            onClick={() => setTabAktif("semua")}
            className={`px-3 py-1.5 rounded-lg transition ${
              tabAktif === "semua" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({tugas.length})
          </button>
          <button
            type="button"
            onClick={() => setTabAktif("perlu_nilai")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              tabAktif === "perlu_nilai" ? "bg-white text-amber-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Perlu Diperiksa</span>
            {perluDinilai > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-black">
                {perluDinilai}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTabAktif("selesai")}
            className={`px-3 py-1.5 rounded-lg transition ${
              tabAktif === "selesai" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Selesai Dinilai
          </button>
        </div>

        {/* Filter Kelas & Pencarian */}
        <div className="flex items-center gap-2">
          {daftarKelasMapel.length > 1 && (
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-2xs focus:outline-none"
            >
              <option value="semua">Semua Rombel</option>
              {daftarKelasMapel.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari tugas..."
              className="pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 shadow-2xs w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* ---------------- Daftar Tugas ---------------- */}
      <div className="flex flex-col gap-3">
        {tugasTerfilter.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Tidak Ada Tugas</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                {tugas.length === 0
                  ? "Anda belum membuat tugas untuk kelas Anda. Klik tombol 'Buat Tugas Baru' di atas untuk memulai."
                  : "Tidak ada tugas yang sesuai dengan filter yang Anda pilih."}
              </p>
            </div>
          </div>
        ) : (
          tugasTerfilter.map((t: any) => {
            const lewat = new Date(t.dueDate).getTime() < Date.now()
            const belumDinilai = t.jumlahTerkumpul - t.jumlahDinilai
            const infoTipe = deteksiTipeTugas(t.title, t.description)

            return (
              <div
                key={t.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col gap-3 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                        {t.classInfo?.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {t.subject?.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${infoTipe.badgeColor}`}>
                        {infoTipe.label}
                      </span>
                      {belumDinilai > 0 && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                          {belumDinilai} BELUM DINILAI
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                      {t.title}
                    </h4>

                    <p
                      className={`text-[11px] flex items-center gap-1.5 ${
                        lewat ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {lewat ? "Ditutup" : "Batas"}: <strong>{tglPanjang(t.dueDate)}</strong> · Maks {t.maxScore} poin
                        {!t.allowLateSubmission && " · tanpa susulan"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => mulaiSunting(t)}
                      className="p-2 text-slate-500 hover:text-emerald-700 rounded-xl hover:bg-slate-100 transition"
                      title="Ubah tugas"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => hapus(t)}
                      className="p-2 text-slate-500 hover:text-red-700 rounded-xl hover:bg-red-50 transition"
                      title="Hapus tugas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {t.description && (
                  <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 text-xs text-slate-600">
                    <TampilanDeskripsiTugas description={t.description} />
                  </div>
                )}

                {/* Tombol Periksa Siswa */}
                <Link
                  href={`/teacher/assignments/${t.id}`}
                  className="mt-1 flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 hover:from-slate-100 hover:to-emerald-100/50 border border-slate-200/90 transition shadow-2xs group"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>
                      <strong>{t.jumlahTerkumpul}</strong> dari <strong>{t.jumlahSiswa}</strong> siswa sudah mengumpulkan
                    </span>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Periksa &amp; Beri Nilai</span>
                    <span>→</span>
                  </span>
                </Link>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
