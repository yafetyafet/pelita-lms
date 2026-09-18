"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getCurrentUser } from "@/app/actions/auth"
import {
  getTeacherClasses,
  getClassAttendanceToday,
  getTeachingOptions,
  claimTeaching,
  releaseTeaching
} from "@/app/actions/teacher"
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Award, 
  Loader2,
  Sparkles,
  MapPin,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BookMarked
} from "lucide-react"

export default function TeacherClassesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceToday, setAttendanceToday] = useState<any[]>([])

  // Pengambilan mapel oleh guru sendiri. Sebelumnya relasi pengampu
  // (guru + rombel + mapel) tidak punya UI sama sekali di seluruh aplikasi,
  // sehingga semua fitur guru mustahil terisi.
  const [showAmpu, setShowAmpu] = useState(false)
  const [opsi, setOpsi] = useState<{ classes: any[]; subjects: any[]; mine: any[] }>({
    classes: [],
    subjects: [],
    mine: []
  })
  const [pilihKelas, setPilihKelas] = useState("")
  const [pilihMapel, setPilihMapel] = useState("")
  const [ampuSaving, setAmpuSaving] = useState(false)
  const [ampuError, setAmpuError] = useState("")
  const [toast, setToast] = useState("")

  useEffect(() => {
    async function load() {
      const [user, cls, opt] = await Promise.all([
        getCurrentUser(),
        getTeacherClasses(),
        getTeachingOptions()
      ])
      setCurrentUser(user)
      setTeacherClasses(cls)
      setOpsi(opt)
      setIsLoading(false)
    }
    load()
  }, [])

  const muatUlangAmpu = async () => {
    const [cls, opt] = await Promise.all([getTeacherClasses(), getTeachingOptions()])
    setTeacherClasses(cls)
    setOpsi(opt)
  }

  const beriToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(""), 4000)
  }

  const handleAmbil = async (e: React.FormEvent) => {
    e.preventDefault()
    setAmpuError("")
    setAmpuSaving(true)
    const res = await claimTeaching(pilihKelas, pilihMapel)
    setAmpuSaving(false)

    if (res.error) {
      setAmpuError(res.error)
      return
    }
    setPilihMapel("")
    beriToast(`Kamu kini mengampu ${res.subjectName} di ${res.className}.`)
    await muatUlangAmpu()
  }

  const handleLepas = async (classId: string, subjectId: string, label: string) => {
    if (
      !confirm(
        `Lepas ${label}?\n\nJurnal, materi, tugas, dan ujian yang sudah kamu buat tidak terhapus, tetapi kamu tidak bisa lagi membukanya sampai mengambil kelas ini kembali.`
      )
    )
      return

    const res = await releaseTeaching(classId, subjectId)
    if (res.error) {
      setAmpuError(res.error)
      return
    }
    beriToast(
      res.terkait
        ? `${label} dilepas. ${res.terkait} data terkait kini tidak bisa kamu buka.`
        : `${label} dilepas.`
    )
    await muatUlangAmpu()
  }

  // Load attendance when active class changes
  useEffect(() => {
    if (teacherClasses.length > 0) {
      const classId = teacherClasses[activeIdx]?.classId
      if (classId) {
        getClassAttendanceToday(classId).then(setAttendanceToday)
      }
    }
  }, [activeIdx, teacherClasses])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-500">Memuat data kelas...</span>
      </div>
    )
  }

  const activeClass = teacherClasses[activeIdx]
  const students = activeClass?.classInfo?.students || []
  const attendedIds = new Set(attendanceToday.map((a: any) => a.userId))

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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Manajemen Kelas</h2>
            <p className="text-[11px] text-slate-500 font-medium">{currentUser?.name || "Guru"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
            {teacherClasses.length} Kelas
          </span>
          <button
            onClick={() => {
              setShowAmpu(!showAmpu)
              setAmpuError("")
            }}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
          >
            {showAmpu ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{showAmpu ? "Tutup" : "Atur Mapel"}</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Panel: guru menentukan sendiri mapel & rombel yang diampu */}
      {showAmpu && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <BookMarked className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Mapel & Rombel yang Saya Ampu</h3>
              <p className="text-[10px] text-slate-500">
                Perubahan langsung berlaku tanpa persetujuan admin
              </p>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 leading-relaxed">
            Penugasan inilah yang menentukan rombel mana yang bisa kamu absen,
            nilai, dan beri materi, tugas, jurnal, serta ujian. Ambil hanya kelas
            yang benar-benar kamu ajar.
          </p>

          {ampuError && (
            <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{ampuError}</span>
            </p>
          )}

          {opsi.classes.length === 0 || opsi.subjects.length === 0 ? (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
              {opsi.classes.length === 0
                ? "Belum ada rombel di sistem. "
                : "Belum ada mata pelajaran di sistem. "}
              Minta admin mengisinya dulu di menu master data.
            </p>
          ) : (
            <form onSubmit={handleAmbil} className="flex flex-col gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Rombel
                  </span>
                  <select
                    value={pilihKelas}
                    onChange={(e) => setPilihKelas(e.target.value)}
                    required
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="">— Pilih rombel —</option>
                    {opsi.classes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mata Pelajaran
                  </span>
                  <select
                    value={pilihMapel}
                    onChange={(e) => setPilihMapel(e.target.value)}
                    required
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="">— Pilih mapel —</option>
                    {opsi.subjects.map((sb: any) => (
                      <option key={sb.id} value={sb.id}>{sb.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={ampuSaving || !pilihKelas || !pilihMapel}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {ampuSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{ampuSaving ? "Menyimpan..." : "Ambil Penugasan Ini"}</span>
              </button>
            </form>
          )}

          {/* Daftar penugasan milik guru ini */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Penugasan saya ({opsi.mine.length})
            </span>

            {opsi.mine.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">
                Belum ada. Pilih rombel dan mapel di atas untuk mulai.
              </p>
            ) : (
              opsi.mine.map((m: any) => {
                const label = `${m.subject.name} di ${m.classInfo.name}`
                return (
                  <div
                    key={`${m.classId}|${m.subjectId}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-800">
                        {m.subject.name}
                      </span>
                      <span className="text-[10px] text-slate-500"> • {m.classInfo.name}</span>
                    </div>
                    <button
                      onClick={() => handleLepas(m.classId, m.subjectId, label)}
                      title="Lepas penugasan ini"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {teacherClasses.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-3">
          <Users className="w-10 h-10 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Kelas</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Anda belum mengampu kelas mana pun. Klik <strong>Atur Mapel</strong> di
            atas untuk memilih sendiri rombel dan mata pelajaran yang Anda ajar.
          </p>
        </div>
      ) : (
        <>
          {/* Class Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {teacherClasses.map((tc: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeIdx === idx
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                }`}
              >
                {tc.classInfo.name}
              </button>
            ))}
          </div>

          {/* Active Class Showcase Card */}
          {activeClass && (
            <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 p-4 text-white shadow-lg flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase">
                    {activeClass.classInfo.wali?.id === currentUser?.id ? "Wali Kelas & Guru Pengampu" : "Guru Pengampu"}
                  </span>
                  <h3 className="text-base font-black text-white mt-1 leading-snug">
                    {activeClass.classInfo.name}
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">{activeClass.subject.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                <div className="bg-white/10 rounded-2xl p-2.5">
                  <span className="text-[10px] text-emerald-200 block">Total Siswa:</span>
                  <span className="font-bold text-white text-sm">{students.length} Siswa</span>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5">
                  <span className="text-[10px] text-emerald-200 block">Presensi Hari Ini:</span>
                  <span className="font-bold text-emerald-300 text-sm">
                    {attendanceToday.length > 0 
                      ? `${attendanceToday.length} Hadir` 
                      : students.length > 0 ? "Belum ada" : "-"}
                  </span>
                </div>
              </div>

              {/* Quick Buttons for Class */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/teacher/grades"
                  className="py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs text-center hover:bg-emerald-50 transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Rekap Nilai</span>
                </Link>
                <Link
                  href="/teacher/journal"
                  className="py-2.5 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-white font-bold text-xs text-center hover:bg-emerald-500/40 transition flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Isi Jurnal Kelas</span>
                </Link>
              </div>
            </div>
          )}

          {/* Roster Siswa & Status Kehadiran */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                Daftar Siswa ({students.length})
              </h3>
            </div>

            {students.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                Belum ada siswa di kelas ini. Admin perlu menambahkan siswa.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {students.map((std: any, idx: number) => {
                  const isAttended = attendedIds.has(std.user.id)
                  return (
                    <div 
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900">{std.user.name}</h4>
                        <p className="text-[10px] text-slate-500">@{std.user.username}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isAttended 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {isAttended ? "Hadir Hari Ini" : "Belum Presensi"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
