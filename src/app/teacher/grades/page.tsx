"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getTeacherClasses, getGradesByClass, createAssignment, saveGrade } from "@/app/actions/teacher"
import { 
  ArrowLeft, 
  Award, 
  Save, 
  CheckCircle2, 
  Plus, 
  Loader2,
  Sparkles,
  X,
  FileSearch
} from "lucide-react"

export default function TeacherGradesPage() {
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [assignments, setAssignments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<{ [key: string]: { score: number; description: string } }>({})
  // Hanya baris yang benar-benar disunting guru yang dikirim saat menyimpan.
  // Sebelumnya `handleSaveAll` mengirim SELURUH peta nilai, sehingga sekali
  // klik "Simpan" akan menandai semua siswa GRADED dengan nilai 0 — termasuk
  // yang belum pernah dinilai.
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Modal for adding new assessment
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAssignmentTitle, setNewAssignmentTitle] = useState("")
  const [newAssignmentDesc, setNewAssignmentDesc] = useState("")
  const [addingAssignment, setAddingAssignment] = useState(false)

  useEffect(() => {
    async function load() {
      const cls = await getTeacherClasses()
      setTeacherClasses(cls)
      setIsLoading(false)
    }
    load()
  }, [])

  // Load grades when active class changes
  useEffect(() => {
    if (teacherClasses.length > 0) {
      const tc = teacherClasses[activeIdx]
      if (tc) {
        loadGrades(tc.classId, tc.subjectId)
      }
    }
  }, [activeIdx, teacherClasses])

  const loadGrades = async (classId: string, subjectId: string) => {
    const data = await getGradesByClass(classId, subjectId)
    setAssignments(data.assignments)
    setStudents(data.students)

    // Build grades map
    const gradeMap: { [key: string]: { score: number; description: string } } = {}
    data.assignments.forEach((a: any) => {
      a.submissions.forEach((s: any) => {
        gradeMap[`${s.user.id}_${a.id}`] = { score: s.score || 0, description: s.description || "" }
      })
    })
    setGrades(gradeMap)
    setDirty(new Set())
  }

  const maxScoreOf = (assignmentId: string) =>
    assignments.find((a: any) => a.id === assignmentId)?.maxScore ?? 100

  const handleScoreChange = (studentId: string, assignmentId: string, val: string) => {
    const num = parseInt(val) || 0
    const key = `${studentId}_${assignmentId}`
    const batas = maxScoreOf(assignmentId)
    setGrades(prev => ({
      ...prev,
      [key]: { ...prev[key], score: Math.min(batas, Math.max(0, num)), description: prev[key]?.description || "" }
    }))
    setDirty(prev => new Set(prev).add(key))
  }

  const handleDescChange = (studentId: string, assignmentId: string, val: string) => {
    const key = `${studentId}_${assignmentId}`
    setGrades(prev => ({
      ...prev,
      [key]: { ...prev[key], score: prev[key]?.score || 0, description: val }
    }))
    setDirty(prev => new Set(prev).add(key))
  }

  const handleSaveAll = async () => {
    if (dirty.size === 0) {
      setSaveError("Belum ada nilai yang diubah.")
      setTimeout(() => setSaveError(""), 3000)
      return
    }

    setSaving(true)
    setSaveError("")

    const hasil = await Promise.all(
      Array.from(dirty).map(key => {
        const [userId, assignmentId] = key.split("_")
        const val = grades[key]
        return saveGrade({
          userId,
          assignmentId,
          score: val?.score ?? 0,
          description: val?.description,
        })
      })
    )
    setSaving(false)

    const galat = hasil.find(r => r.error)
    if (galat) {
      setSaveError(galat.error || "Sebagian nilai gagal disimpan.")
      return
    }

    setDirty(new Set())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssignmentTitle.trim()) return
    const tc = teacherClasses[activeIdx]
    if (!tc) return

    setAddingAssignment(true)
    const res = await createAssignment({
      title: newAssignmentTitle,
      description: newAssignmentDesc,
      classId: tc.classId,
      subjectId: tc.subjectId
    })
    setAddingAssignment(false)

    if (res.error) {
      alert(res.error)
    } else {
      setShowAddModal(false)
      setNewAssignmentTitle("")
      setNewAssignmentDesc("")
      await loadGrades(tc.classId, tc.subjectId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-500">Memuat data penilaian...</span>
      </div>
    )
  }

  const activeClass = teacherClasses[activeIdx]

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Rekap Penilaian Siswa</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {activeClass ? `${activeClass.classInfo.name} • ${activeClass.subject.name}` : "Pilih kelas"}
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saving ? "..." : dirty.size > 0 ? `Simpan (${dirty.size})` : "Simpan"}</span>
        </button>
      </div>

      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold">
          {saveError}
        </div>
      )}

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Seluruh perubahan nilai berhasil disimpan!</span>
        </div>
      )}

      {/* Class Selector */}
      {teacherClasses.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {teacherClasses.map((tc: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeIdx === idx
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {tc.classInfo.name}
            </button>
          ))}
        </div>
      )}

      {/* Overview Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-800 to-slate-900 p-4 text-white shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-emerald-200 uppercase">Kolom Penilaian</span>
          <h3 className="text-base font-black text-white mt-0.5">{assignments.length} Penilaian</h3>
          <p className="text-[11px] text-emerald-100/80 mt-0.5">{students.length} Siswa Terdaftar</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition border border-white/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Penilaian</span>
        </button>
      </div>

      {/* Tabel Penilaian */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Daftar Nilai
          </h3>
          <span className="text-[10px] font-semibold text-slate-400">Edit nilai langsung di kolom</span>
        </div>

        {/* Pintasan ke lembar pengumpulan tiap tugas: di sana guru bisa
            membaca jawaban siswa, bukan hanya mengisi angka. */}
        {assignments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {assignments.map((a: any) => {
              const masuk = (a.submissions || []).filter((s: any) => s.submittedAt).length
              return (
                <Link
                  key={a.id}
                  href={`/teacher/assignments/${a.id}`}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center gap-1.5 transition"
                  title="Buka lembar pengumpulan & jawaban siswa"
                >
                  <FileSearch className="w-3 h-3" />
                  <span className="max-w-[9rem] truncate">{a.title}</span>
                  <span className="text-[9px] bg-white border border-slate-200 px-1 rounded">
                    {masuk}
                  </span>
                </Link>
              )
            })}
          </div>
        )}

        {students.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            Belum ada siswa di kelas ini.
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            Belum ada kolom penilaian. Klik &quot;Tambah Penilaian&quot; untuk memulai.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {students.map((student: any) => {
              const totalScore = assignments.reduce((sum: number, a: any) => {
                const key = `${student.id}_${a.id}`
                return sum + (grades[key]?.score || 0)
              }, 0)
              const avg = assignments.length > 0 ? Math.round(totalScore / assignments.length) : 0

              return (
                <div 
                  key={student.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{student.name}</h4>
                      <p className="text-[10px] text-slate-400">@{student.username}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Rata-rata</span>
                      <span className="text-sm font-black text-emerald-600">{avg}</span>
                    </div>
                  </div>

                  {/* Score Inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 pt-1 border-t border-slate-200/60">
                    {assignments.map((a: any) => {
                      const key = `${student.id}_${a.id}`
                      return (
                        <div key={a.id} className="flex flex-col">
                          <span className="text-[9px] font-semibold text-slate-500 mb-0.5 line-clamp-1" title={a.title}>
                            {a.title}
                          </span>
                          <input
                            type="number"
                            value={grades[key]?.score || ""}
                            onChange={(e) => handleScoreChange(student.id, a.id, e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            value={grades[key]?.description || ""}
                            onChange={(e) => handleDescChange(student.id, a.id, e.target.value)}
                            placeholder="Ket."
                            className="w-full text-center py-0.5 bg-white border border-slate-100 rounded-lg text-[9px] text-slate-500 focus:outline-none focus:border-emerald-400 mt-0.5"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah Penilaian Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Tambah Kolom Penilaian</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddAssignment} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Penilaian (Contoh: Tugas 3, Kuis 2, UTS, Praktikum)
                </label>
                <input
                  required
                  type="text"
                  value={newAssignmentTitle}
                  onChange={e => setNewAssignmentTitle(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition"
                  placeholder="Masukkan nama penilaian..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Keterangan (Opsional)</label>
                <input
                  type="text"
                  value={newAssignmentDesc}
                  onChange={e => setNewAssignmentDesc(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition"
                  placeholder="Misal: Penilaian formatif bab 3"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={addingAssignment} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50">
                  {addingAssignment ? "Menyimpan..." : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
