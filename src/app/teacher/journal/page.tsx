"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getTeacherClasses, getTeacherJournals, createJournal } from "@/app/actions/teacher"
import { 
  ArrowLeft, 
  PenTool, 
  CheckCircle2, 
  BookOpen, 
  Send, 
  Sparkles,
  Loader2
} from "lucide-react"

export default function TeacherJournalPage() {
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [journals, setJournals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formClassId, setFormClassId] = useState("")
  const [formSubjectId, setFormSubjectId] = useState("")
  const [formTopic, setFormTopic] = useState("")
  const [formSummary, setFormSummary] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const [cls, jrnls] = await Promise.all([getTeacherClasses(), getTeacherJournals()])
      setTeacherClasses(cls)
      setJournals(jrnls)
      if (cls.length > 0) {
        setFormClassId(cls[0].classId)
        setFormSubjectId(cls[0].subjectId)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  // Auto-set subject when class changes
  const handleClassChange = (classId: string) => {
    setFormClassId(classId)
    const match = teacherClasses.find((tc: any) => tc.classId === classId)
    if (match) setFormSubjectId(match.subjectId)
  }

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTopic.trim() || !formSummary.trim() || !formClassId || !formSubjectId) return

    setIsSaving(true)
    const res = await createJournal({
      title: formTopic,
      content: formSummary,
      classId: formClassId,
      subjectId: formSubjectId
    })
    setIsSaving(false)

    if (res.error) {
      alert(res.error)
    } else {
      setIsSaved(true)
      const jrnls = await getTeacherJournals()
      setJournals(jrnls)
      setTimeout(() => {
        setIsSaved(false)
        setFormTopic("")
        setFormSummary("")
      }, 1500)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-500">Memuat jurnal...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link 
            href="/teacher"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Jurnal Pembelajaran</h2>
            <p className="text-[11px] text-slate-500 font-medium">Buku Administrasi Mengajar Harian</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          E-Jurnal
        </span>
      </div>

      {/* Form Pengisian Jurnal */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Form Jurnal Sesi Pembelajaran</h3>
            <p className="text-[10px] text-slate-500">Wajib diisi setiap selesai tatap muka/praktikum</p>
          </div>
        </div>

        <form onSubmit={handleAddJournal} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-600">Rombel / Kelas:</label>
              <select
                value={formClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Pilih Kelas</option>
                {teacherClasses.map((tc: any, i: number) => (
                  <option key={i} value={tc.classId}>{tc.classInfo.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-600">Mata Pelajaran:</label>
              <select
                value={formSubjectId}
                onChange={(e) => setFormSubjectId(e.target.value)}
                className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Pilih Mapel</option>
                {teacherClasses.map((tc: any, i: number) => (
                  <option key={i} value={tc.subjectId}>{tc.subject.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600">Materi Pokok / KD:</label>
            <input
              type="text"
              value={formTopic}
              onChange={(e) => setFormTopic(e.target.value)}
              placeholder="Contoh: Pembuatan REST API Geotagging Presensi"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-600">Ringkasan Kegiatan & Ketercapaian:</label>
            <textarea
              rows={2}
              value={formSummary}
              onChange={(e) => setFormSummary(e.target.value)}
              placeholder="Tuliskan aktivitas praktikum, kendala siswa, dan tindak lanjut..."
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 mt-1 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan Catatan Jurnal"}</span>
          </button>
        </form>

        {isSaved && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Jurnal mengajar berhasil ditambahkan!</span>
          </div>
        )}
      </div>

      {/* Riwayat Jurnal */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Riwayat Jurnal Terdata ({journals.length} Sesi)
        </h3>

        {journals.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            Belum ada jurnal yang tercatat. Mulai isi jurnal mengajar Anda.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {journals.map((j: any) => (
              <div key={j.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        {j.classInfo?.name || "-"}
                      </span>
                      <span className="text-[10px] text-slate-500">{j.subject?.name || "-"}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 mt-1">{j.title}</h4>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/60">
                  {j.content}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>{new Date(j.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
