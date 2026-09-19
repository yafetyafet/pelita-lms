"use client"

import React, { useState, useEffect, useMemo } from "react"
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
} from "lucide-react"
import {
  getTeacherClasses,
  getTeacherAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "@/app/actions/teacher"

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
        getTeacherClasses(),
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
      // Kelas dan mapel tidak bisa dipindah setelah tugas dibuat: pengumpulan
      // siswa sudah terikat ke rombel itu.
      penugasan: `${t.classInfo.id}|${t.subject.id}`,
      dueDate: toLocalInput(t.dueDate),
      maxScore: t.maxScore,
      allowLateSubmission: t.allowLateSubmission,
    })
    setBukaForm(true)
    setError("")
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
    beriToast(suntingId ? "Tugas diperbarui." : "Tugas dibuat dan langsung tampil di akun siswa.")
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
    beriToast("Tugas dihapus.")
    await muat()
  }

  const perluDinilai = useMemo(
    () => tugas.reduce((n, t) => n + (t.jumlahTerkumpul - t.jumlahDinilai), 0),
    [tugas]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-500">Memuat tugas...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/teacher"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Tugas &amp; Penilaian
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {tugas.length} tugas
              {perluDinilai > 0 && ` • ${perluDinilai} pengumpulan belum dinilai`}
            </p>
          </div>
        </div>

        <button
          onClick={mulaiBuat}
          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Beri Tugas
        </button>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {kelas.length === 0 && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 leading-relaxed">
          Kamu belum mengampu kelas mana pun, jadi belum bisa memberi tugas.
          Pilih mapel dan kelas yang kamu ampu di menu <strong>Kelas Saya</strong>{" "}
          dulu.
        </p>
      )}

      {/* ---------------- Form ---------------- */}
      {bukaForm && (
        <form
          onSubmit={simpan}
          className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              {suntingId ? "Ubah Tugas" : "Tugas Baru"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setBukaForm(false)
                setSuntingId(null)
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Kelas &amp; Mapel
            </span>
            <select
              value={form.penugasan}
              onChange={(e) => setForm({ ...form, penugasan: e.target.value })}
              disabled={Boolean(suntingId)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-60"
            >
              <option value="">Pilih Kelas &amp; Mapel</option>
              {kelas.map((tc: any) => (
                <option
                  key={`${tc.classId}|${tc.subjectId}`}
                  value={`${tc.classId}|${tc.subjectId}`}
                >
                  {tc.classInfo.name} — {tc.subject.name}
                </option>
              ))}
            </select>
            {suntingId && (
              <span className="text-[10px] text-slate-400">
                Kelas dan mapel tidak bisa dipindah karena pengumpulan siswa sudah
                terikat ke rombel ini.
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Judul Tugas
            </span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Latihan Soal Bab 3 — Persamaan Kuadrat"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Instruksi / Soal
            </span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tulis perintah kerjanya. Bisa juga menempel tautan Google Drive, YouTube, atau gambar."
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Batas Pengumpulan
              </span>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Nilai Maksimal
              </span>
              <input
                type="number"
                min={1}
                value={form.maxScore}
                onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() =>
              setForm({ ...form, allowLateSubmission: !form.allowLateSubmission })
            }
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[11px] font-semibold text-left transition ${
              form.allowLateSubmission
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <CalendarClock className="w-4 h-4 shrink-0" />
            <span className="flex-1">
              {form.allowLateSubmission
                ? "Terlambat masih boleh mengumpulkan (ditandai TERLAMBAT)"
                : "Tertutup setelah batas waktu"}
            </span>
            <span
              className={`w-9 h-5 rounded-full relative transition shrink-0 ${
                form.allowLateSubmission ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  form.allowLateSubmission ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? "Menyimpan..." : suntingId ? "Simpan Perubahan" : "Beri Tugas"}
          </button>
        </form>
      )}

      {/* ---------------- Daftar ---------------- */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-600" />
          Daftar Tugas ({tugas.length})
        </h3>

        {tugas.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            Belum ada tugas. Tekan <strong>Beri Tugas</strong> di atas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {tugas.map((t: any) => {
              const lewat = new Date(t.dueDate).getTime() < Date.now()
              const belumDinilai = t.jumlahTerkumpul - t.jumlahDinilai

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {t.classInfo?.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.subject?.name}
                        </span>
                        {belumDinilai > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {belumDinilai} BELUM DINILAI
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                        {t.title}
                      </h4>
                      <p
                        className={`text-[10px] mt-1 flex items-center gap-1 ${
                          lewat ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        <CalendarClock className="w-3 h-3" />
                        {lewat ? "Ditutup" : "Batas"} {tglPanjang(t.dueDate)} · maks{" "}
                        {t.maxScore}
                        {!t.allowLateSubmission && " · tanpa susulan"}
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => mulaiSunting(t)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                        title="Ubah tugas"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => hapus(t)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Hapus tugas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <Link
                    href={`/teacher/assignments/${t.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
                  >
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {t.jumlahTerkumpul} dari {t.jumlahSiswa} siswa mengumpulkan
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">
                      Periksa &amp; Nilai →
                    </span>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
