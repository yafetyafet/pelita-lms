"use client"

import React, { useState, useMemo } from "react"
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
  Search,
  Award,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { TampilanDeskripsiTugas } from "@/components/TampilanDeskripsiTugas"
import { deteksiTipeTugas, hitungSisaWaktu } from "@/lib/logic/assignment-helper"

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

export function IsiTugas({
  awal,
}: {
  awal: Awaited<ReturnType<typeof getStudentAssignments>>
}) {
  const [assignments, setAssignments] = useState<any[]>(awal)
  const [isLoading, setIsLoading] = useState(false)

  // Filter & Tab
  const [tabAktif, setTabAktif] = useState<"belum" | "menunggu" | "selesai" | "semua">("belum")
  const [mapelFilter, setMapelFilter] = useState<string>("semua")
  const [cari, setCari] = useState("")

  // Form pengumpulan
  const [openId, setOpenId] = useState<string | null>(null)
  const [modeInput, setModeInput] = useState<"teks" | "berkas" | "keduanya">("teks")
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

  const bukaForm = (a: any) => {
    const sub: Submission | null = a.mySubmission
    setOpenId(a.id)
    const existingText = sub?.answerText || ""
    const existingFile = sub?.fileUrl || ""
    setAnswerText(existingText)
    setFileUrl(existingFile)

    if (existingFile && !existingText) {
      setModeInput("berkas")
    } else if (existingFile && existingText) {
      setModeInput("keduanya")
    } else {
      setModeInput("teks")
    }

    setFormError("")
  }

  const kirim = async (assignmentId: string) => {
    setFormError("")
    if (!answerText.trim() && !fileUrl.trim()) {
      setFormError("Mohon isi teks jawaban atau cantumkan tautan berkas tugas terlebih dahulu.")
      return
    }

    if (!confirm("Kumpulkan jawaban tugas ini sekarang?")) return

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
    setToast(res.pesan || "Tugas berhasil dikumpulkan!")
    setTimeout(() => setToast(""), 4000)
    await load()
  }

  // Daftar mapel unik untuk filter
  const daftarMapel = useMemo(() => {
    const set = new Set<string>()
    assignments.forEach((a) => {
      if (a.subject?.name) set.add(a.subject.name)
    })
    return Array.from(set)
  }, [assignments])

  // Hitung jumlah tiap kategori
  const stats = useMemo(() => {
    let belum = 0
    let menunggu = 0
    let selesai = 0

    assignments.forEach((a) => {
      const sub = a.mySubmission
      if (!sub || sub.status === "PENDING") {
        belum++
      } else if (sub.status === "GRADED") {
        selesai++
      } else {
        menunggu++
      }
    })

    return { belum, menunggu, selesai, total: assignments.length }
  }, [assignments])

  // Filter daftar tugas
  const tugasTerfilter = useMemo(() => {
    return assignments.filter((a) => {
      const sub = a.mySubmission
      const isBelum = !sub || sub.status === "PENDING"
      const isMenunggu = sub && (sub.status === "SUBMITTED" || sub.status === "LATE")
      const isSelesai = sub && sub.status === "GRADED"

      if (tabAktif === "belum" && !isBelum) return false
      if (tabAktif === "menunggu" && !isMenunggu) return false
      if (tabAktif === "selesai" && !isSelesai) return false

      if (mapelFilter !== "semua" && a.subject?.name !== mapelFilter) return false

      if (cari.trim()) {
        const q = cari.toLowerCase()
        const cocokJudul = a.title?.toLowerCase().includes(q)
        const cocokMapel = a.subject?.name?.toLowerCase().includes(q)
        const cocokGuru = a.author?.name?.toLowerCase().includes(q)
        const cocokDesc = a.description?.toLowerCase().includes(q)
        if (!cocokJudul && !cocokMapel && !cocokGuru && !cocokDesc) return false
      }

      return true
    })
  }, [assignments, tabAktif, mapelFilter, cari])

  if (isLoading) {
    return <PemuatData pesan="Memuat tugas & kuis..." />
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-28 max-w-4xl mx-auto">
      {/* Toast Notifikasi */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/student"
            className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              Tugas &amp; Kuis Siswa
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Lihat petunjuk, kerjakan latihan, dan kumpulkan berkas
            </p>
          </div>
        </div>

        {stats.belum > 0 && (
          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {stats.belum} Belum Dikerjakan
          </span>
        )}
      </div>

      {/* Tab Navigasi Status */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-2xl text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setTabAktif("belum")}
          className={`py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
            tabAktif === "belum"
              ? "bg-white text-rose-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Belum Dikerjakan</span>
          {stats.belum > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                tabAktif === "belum"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              {stats.belum}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("menunggu")}
          className={`py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
            tabAktif === "menunggu"
              ? "bg-white text-amber-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Menunggu Nilai</span>
          {stats.menunggu > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                tabAktif === "menunggu"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              {stats.menunggu}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("selesai")}
          className={`py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
            tabAktif === "selesai"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Sudah Dinilai</span>
          {stats.selesai > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                tabAktif === "selesai"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              {stats.selesai}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("semua")}
          className={`py-2 px-1 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
            tabAktif === "semua"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Semua Tugas</span>
          <span className="text-[9px] opacity-75 font-normal">({stats.total})</span>
        </button>
      </div>

      {/* Filter Mata Pelajaran & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <button
            type="button"
            onClick={() => setMapelFilter("semua")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              mapelFilter === "semua"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Semua Mapel
          </button>
          {daftarMapel.map((mp) => (
            <button
              key={mp}
              type="button"
              onClick={() => setMapelFilter(mp)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                mapelFilter === mp
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {mp}
            </button>
          ))}
        </div>

        <div className="relative shrink-0 sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari tugas / instruksi..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Daftar Tugas */}
      {tugasTerfilter.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-3 mt-1">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {tabAktif === "belum"
                ? "Tidak Ada Tugas yang Perlu Dikerjakan"
                : tabAktif === "menunggu"
                ? "Tidak Ada Tugas Menunggu Nilai"
                : tabAktif === "selesai"
                ? "Belum Ada Tugas yang Dinilai"
                : "Tidak Ada Tugas Ditemukan"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              {tabAktif === "belum"
                ? "Hebat! Semua tugas yang diberikan telah selesai Anda kumpulkan."
                : "Coba ubah tab atau kata kunci pencarian untuk melihat daftar tugas lainnya."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {tugasTerfilter.map((a: any) => {
            const sub: Submission | null = a.mySubmission
            const dinilai = sub?.status === "GRADED"
            const terkumpul = sub?.status === "SUBMITTED" || sub?.status === "LATE"
            const belum = !sub || sub.status === "PENDING"
            const tenggatLewat = a.dueDate && new Date(a.dueDate) < new Date()
            const bisaKirim = !dinilai && (!tenggatLewat || a.allowLateSubmission)

            const infoTipe = deteksiTipeTugas(a.title, a.description)
            const infoWaktu = hitungSisaWaktu(a.dueDate)

            return (
              <div
                key={a.id}
                className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col gap-3 transition-all ${
                  belum
                    ? "border-amber-300 ring-2 ring-amber-100/60"
                    : "border-slate-200/80"
                }`}
              >
                {/* Header Kartu Tugas */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {a.subject?.name || "Umum"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${infoTipe.badgeColor}`}
                      >
                        {infoTipe.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${infoWaktu.badgeColor}`}>
                        <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                        {infoWaktu.teks}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 mt-1 text-base leading-snug">
                      {a.title}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Guru Pengampu: <span className="font-semibold text-slate-700">{a.author?.name || "-"}</span>
                    </p>
                  </div>

                  {/* Badge Status & Nilai */}
                  <div className="text-right shrink-0">
                    {dinilai && sub?.score != null ? (
                      <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl flex flex-col items-end">
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3 h-3 text-emerald-600" /> Nilai Tugas
                        </span>
                        <div className="text-lg font-black text-emerald-700 leading-tight">
                          {sub.score}{" "}
                          <span className="text-xs text-emerald-500 font-bold">
                            / {a.maxScore ?? 100}
                          </span>
                        </div>
                      </div>
                    ) : belum ? (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" /> Belum Dikumpulkan
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {sub?.isLate ? "Terkumpul (Terlambat)" : "Terkumpul • Menunggu Nilai"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tanggal Batas Waktu */}
                {a.dueDate && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Batas Pengumpulan:{" "}
                      <strong className="text-slate-700">
                        {new Date(a.dueDate).toLocaleString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                    {!a.allowLateSubmission && (
                      <span className="text-rose-600 font-bold text-[10px] ml-auto">
                        (Tidak menerima susulan)
                      </span>
                    )}
                  </div>
                )}

                {/* 📋 Soal & Petunjuk Guru */}
                {a.description && (
                  <div className="flex flex-col gap-2 pt-1">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Petunjuk &amp; Berkas Soal:
                    </h4>
                    <TampilanDeskripsiTugas description={a.description} />
                  </div>
                )}

                {/* Catatan / Feedback dari Guru jika sudah dinilai */}
                {dinilai && sub?.description && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-col gap-1">
                    <strong className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Catatan &amp; Umpan Balik Guru:
                    </strong>
                    <p className="leading-relaxed whitespace-pre-wrap pl-5 text-emerald-800">
                      {sub.description}
                    </p>
                  </div>
                )}

                {/* Riwayat Jawaban Siswa jika sudah pernah mengumpulkan */}
                {sub && (sub.answerText || sub.fileUrl) && openId !== a.id && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col gap-2 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Jawaban yang Sudah Kamu Kumpulkan
                      </span>
                      {sub.submittedAt && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(sub.submittedAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    {sub.answerText && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {sub.answerText}
                      </div>
                    )}

                    {sub.fileUrl && (
                      <div className="flex flex-col gap-1.5">
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 flex items-center justify-between gap-2 transition"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                            {sub.fileName || "Tautan Berkas Tugas Anda"}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                        <TampilanDeskripsiTugas description={sub.fileUrl} />
                      </div>
                    )}
                  </div>
                )}

                {/* Form Pengerjaan / Pengumpulan */}
                {openId === a.id ? (
                  <div className="flex flex-col gap-3 pt-3 border-t border-slate-200 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-blue-600" />
                        Lembar Pengerjaan Tugas
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        Pilih cara pengumpulan di bawah:
                      </span>
                    </div>

                    {/* Pilihan Metode Pengumpulan */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-white border border-slate-200 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setModeInput("teks")}
                        className={`py-1.5 px-2 rounded-lg transition ${
                          modeInput === "teks"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        ✍️ Ketik Teks
                      </button>
                      <button
                        type="button"
                        onClick={() => setModeInput("berkas")}
                        className={`py-1.5 px-2 rounded-lg transition ${
                          modeInput === "berkas"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        📎 Tautan File/Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => setModeInput("keduanya")}
                        className={`py-1.5 px-2 rounded-lg transition ${
                          modeInput === "keduanya"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        🌟 Teks &amp; File
                      </button>
                    </div>

                    {/* Kolom Teks Jawaban */}
                    {(modeInput === "teks" || modeInput === "keduanya") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Jawaban / Uraian Tugas:
                        </label>
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          rows={5}
                          placeholder="Tuliskan jawaban pertanyaan, ringkasan, atau penjelasan tugasmu di sini secara lengkap..."
                          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs resize-y focus:outline-none focus:border-blue-500 shadow-2xs leading-relaxed"
                        />
                      </div>
                    )}

                    {/* Kolom Tautan Berkas */}
                    {(modeInput === "berkas" || modeInput === "keduanya") && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Tautan Berkas (Google Drive / PDF / Dokumen):
                        </label>
                        <input
                          type="url"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder="Contoh: https://drive.google.com/file/d/... atau tautan dokumen tugasmu"
                          className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                        />
                        <p className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60 leading-relaxed">
                          💡 <strong>Tips Google Drive:</strong> Pastikan izin tautan berkas diatur ke{" "}
                          <strong>&quot;Siapa saja yang memiliki link&quot;</strong> agar guru pengampu dapat membuka dan memeriksa hasil tugasmu.
                        </p>
                      </div>
                    )}

                    {formError && (
                      <p className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </p>
                    )}

                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => kirim(a.id)}
                        disabled={saving}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{saving ? "Mengirimkan Jawaban..." : "Kirimkan Jawaban Sekarang"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenId(null)}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  bisaKirim && (
                    <button
                      type="button"
                      onClick={() => bukaForm(a)}
                      className={`w-full py-2.5 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs ${
                        terkumpul
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {terkumpul ? (
                        <>
                          <Pencil className="w-3.5 h-3.5 text-slate-600" />
                          <span>Perbaiki / Kirim Ulang Jawaban</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-white" />
                          <span>Mulai Kerjakan &amp; Kumpulkan Tugas</span>
                        </>
                      )}
                    </button>
                  )
                )}

                {!bisaKirim && !dinilai && (
                  <p className="text-[10px] text-slate-400 italic text-center py-1">
                    Batas waktu pengumpulan tugas ini sudah berakhir dan tidak menerima pengumpulan susulan.
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
