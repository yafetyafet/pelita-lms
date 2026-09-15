"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getCurrentUser, logout } from "@/app/actions/auth"
import { getTeacherMaterials, createMaterial, getTeacherClasses, createViolation, getStudentsByClass } from "@/app/actions/teacher"
import { 
  Bell, 
  BookOpen, 
  FileText, 
  Timer, 
  Users, 
  PenTool, 
  AlertOctagon, 
  UploadCloud, 
  Link as LinkIcon, 
  CheckCircle2, 
  MapPin, 
  ChevronRight,
  Sparkles,
  Award,
  Clock,
  Send,
  Calendar,
  LogOut,
  Loader2,
  Eye
} from "lucide-react"

export default function TeacherDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasLoadedUser, setHasLoadedUser] = useState(false)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [classStudents, setClassStudents] = useState<any[]>([])

  useEffect(() => {
    async function loadUser() {
      const [user, cls, mats] = await Promise.all([
        getCurrentUser(),
        getTeacherClasses(),
        getTeacherMaterials()
      ])
      if (user) setCurrentUser(user)
      setTeacherClasses(cls)
      setMaterials(mats)
      setHasLoadedUser(true)
    }
    loadUser()
  }, [])

  const [showJournalModal, setShowJournalModal] = useState(false)
  const [showViolationModal, setShowViolationModal] = useState(false)
  const [journalSaved, setJournalSaved] = useState(false)
  const [violationSaved, setViolationSaved] = useState(false)

  const [materiTitle, setMateriTitle] = useState("")
  const [embedLink, setEmbedLink] = useState("")
  const [materiClassId, setMateriClassId] = useState("")
  const [materiSubjectId, setMateriSubjectId] = useState("")
  const [materiAdded, setMateriAdded] = useState(false)
  const [materiSaving, setMateriSaving] = useState(false)

  // State Pelanggaran
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [violationType, setViolationType] = useState("Keterlambatan Hadir (> 07:15 WIB)")
  const [violationPoints, setViolationPoints] = useState(5)
  const [violationClassId, setViolationClassId] = useState("")
  const [violationSaving, setViolationSaving] = useState(false)

  // Load students when violation class changes
  useEffect(() => {
    if (violationClassId) {
      getStudentsByClass(violationClassId).then(setClassStudents)
    }
  }, [violationClassId])

  // Set default class/subject when teacherClasses load
  useEffect(() => {
    if (teacherClasses.length > 0) {
      const first = teacherClasses[0]
      if (!materiClassId) setMateriClassId(first.classId)
      if (!materiSubjectId) setMateriSubjectId(first.subjectId)
      if (!violationClassId) setViolationClassId(first.classId)
    }
  }, [teacherClasses])

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault()
    setJournalSaved(true)
    setTimeout(() => {
      setShowJournalModal(false)
      setJournalSaved(false)
    }, 1200)
  }

  const handleSaveViolation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) return alert("Pilih siswa terlebih dahulu")
    setViolationSaving(true)
    const res = await createViolation({
      studentId: selectedStudentId,
      description: violationType,
      points: violationPoints
    })
    setViolationSaving(false)
    if (res.error) {
      alert(res.error)
    } else {
      setViolationSaved(true)
      setTimeout(() => {
        setShowViolationModal(false)
        setViolationSaved(false)
      }, 1200)
    }
  }

  const handleSaveMateri = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materiTitle || !materiClassId || !materiSubjectId) return
    setMateriSaving(true)
    const res = await createMaterial({
      title: materiTitle,
      url: embedLink,
      classId: materiClassId,
      subjectId: materiSubjectId
    })
    setMateriSaving(false)
    if (res.error) {
      alert(res.error)
    } else {
      setMateriAdded(true)
      // Reload materials
      const mats = await getTeacherMaterials()
      setMaterials(mats)
      setTimeout(() => {
        setMateriAdded(false)
        setMateriTitle("")
        setEmbedLink("")
      }, 2000)
    }
  }

  const teacherMenus = [
    { id: "jurnal", title: "Jurnal Mengajar", desc: "Isi Administrasi", icon: PenTool, color: "from-emerald-600 to-teal-600", count: "Wajib", href: "/teacher/journal" },
    { id: "materi", title: "Upload Materi", desc: "Embed Video/Drive", icon: UploadCloud, color: "from-blue-600 to-indigo-600", count: `${materials.length} Modul`, action: "scroll-materi" },
    { id: "absensi", title: "Presensi Kelas", desc: "Lihat Data Siswa", icon: MapPin, color: "from-cyan-600 to-blue-700", count: null, href: "/teacher/classes" },
    { id: "jadwal", title: "Jadwal Mandiri", desc: "Input Roster Guru", icon: Calendar, color: "from-amber-500 to-orange-600", count: null, href: "/teacher/schedule" },
    { id: "ujian", title: "Ujian", desc: "Buat & Kelola Ujian", icon: Timer, color: "from-rose-600 to-red-600", count: null, href: "/teacher/exams" },
    { id: "pelanggaran", title: "Catatan Disiplin", desc: "Input Pelanggaran", icon: AlertOctagon, color: "from-slate-700 to-slate-900", count: null, action: "modal-violation" },
    { id: "nilai", title: "Rekap Penilaian", desc: "Formatif & Sumatif", icon: Award, color: "from-purple-600 to-violet-700", count: null, href: "/teacher/grades" },
    { id: "diskusi", title: "Forum Diskusi", desc: "Tanya Jawab Siswa", icon: Users, color: "from-pink-600 to-rose-600", count: null, href: "/teacher/forum" },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Teacher Profile Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-emerald-600/20 ring-2 ring-white">
              {currentUser?.name
                ? currentUser.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "G"}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {currentUser?.name || (hasLoadedUser ? "Bapak/Ibu Guru" : "Memuat...")}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentUser?.waliClasses?.[0]
                ? `Wali Kelas ${currentUser.waliClasses[0].name}`
                : currentUser?.username
                ? `@${currentUser.username} • Tenaga Pendidik`
                : "Belum ditugaskan sebagai wali kelas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/teacher/profile"
            className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
            title="Profil Guru"
          >
            <Bell className="w-4 h-4" />
          </Link>
          <button
            onClick={() => logout()}
            className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition shadow-sm flex items-center gap-1 text-xs font-bold"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Jurnal Administrasi Guru Alert Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-900 p-4 text-white shadow-lg shadow-emerald-700/20 relative overflow-hidden">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <PenTool className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Administrasi Harian
              </span>
              <h3 className="text-sm font-bold text-white mt-1">Jurnal Pembelajaran Hari Ini</h3>
            </div>
          </div>
          <span className="text-xs text-emerald-200 font-medium">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>

        <p className="text-xs text-emerald-100/90 leading-relaxed mb-3">
          {teacherClasses.length > 0
            ? `Anda mengampu ${teacherClasses.length} kelas. Isi jurnal mengajar untuk setiap sesi tatap muka hari ini.`
            : "Belum ada kelas yang ditugaskan. Hubungi admin untuk pengaturan kelas."}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowJournalModal(true)}
            className="py-2.5 px-3 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Isi Jurnal Cepat</span>
          </button>
          <Link
            href="/teacher/journal"
            className="py-2.5 px-3 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-white font-bold text-xs text-center hover:bg-emerald-500/40 transition flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Buku Jurnal Penuh</span>
          </Link>
        </div>
      </div>

      {/* Quick Monitor: Kelas Binaan */}
      <Link href="/teacher/classes" className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3 hover:border-emerald-300 transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Kelas yang Diampu</h3>
              <p className="text-[10px] text-slate-500">
                {currentUser?.waliClasses?.[0] ? `Wali Kelas: ${currentUser.waliClasses[0].name}` : "Daftar kelas dan siswa binaan"}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            {teacherClasses.length} Kelas
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {teacherClasses.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {teacherClasses.map((tc: any, i: number) => (
                <span key={i} className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {tc.classInfo.name} — {tc.subject.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-[11px] font-medium text-slate-400 italic text-center py-2">
              Belum ada kelas yang ditugaskan.
            </div>
          )}
        </div>
      </Link>

      {/* Menu Aplikasi Guru (Smartphone Grid) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            Modul Manajemen Guru
          </h3>
          <span className="text-[11px] font-semibold text-emerald-600">
            Modul Utama
          </span>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5">
          {teacherMenus.map((menu) => {
            const Icon = menu.icon

            const handleClick = () => {
              if (menu.action === "modal-violation") {
                setShowViolationModal(true)
              } else if (menu.action === "scroll-materi") {
                const el = document.getElementById("materi-section")
                el?.scrollIntoView({ behavior: "smooth" })
              }
            }

            if (menu.href) {
              return (
                <Link
                  key={menu.id}
                  href={menu.href}
                  className="group flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-200/70 hover:border-emerald-300 hover:shadow-md transition-all active:scale-95"
                >
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${menu.color} flex items-center justify-center text-white shadow-sm shadow-slate-300 group-hover:scale-105 transition-transform mb-1.5`}>
                    <Icon className="w-5 h-5 stroke-[2.2px]" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-1">
                    {menu.title}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1 font-medium">
                    {menu.count}
                  </span>
                </Link>
              )
            }

            return (
              <button
                key={menu.id}
                onClick={handleClick}
                className="group flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-200/70 hover:border-emerald-300 hover:shadow-md transition-all active:scale-95"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${menu.color} flex items-center justify-center text-white shadow-sm shadow-slate-300 group-hover:scale-105 transition-transform mb-1.5`}>
                  <Icon className="w-5 h-5 stroke-[2.2px]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-1">
                  {menu.title}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 line-clamp-1 font-medium">
                  {menu.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Fitur Upload Materi + Daftar Materi Terupload */}
      <div id="materi-section" className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Publikasi Materi Cepat (Embed Link)</h3>
              <p className="text-[10px] text-slate-500">Hemat kuota & storage (YouTube / Google Drive)</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveMateri} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={materiClassId}
              onChange={(e) => setMateriClassId(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            >
              <option value="">Pilih Kelas</option>
              {teacherClasses.map((tc: any, i: number) => (
                <option key={i} value={tc.classId}>{tc.classInfo.name}</option>
              ))}
            </select>
            <select
              value={materiSubjectId}
              onChange={(e) => setMateriSubjectId(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
            >
              <option value="">Pilih Mapel</option>
              {teacherClasses.map((tc: any, i: number) => (
                <option key={i} value={tc.subjectId}>{tc.subject.name}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={materiTitle}
            onChange={(e) => setMateriTitle(e.target.value)}
            placeholder="Judul Materi (Contoh: Tutorial State Management Next.js)"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="url"
              value={embedLink}
              onChange={(e) => setEmbedLink(e.target.value)}
              placeholder="Link Embed: https://youtube.com/... atau Drive"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
            />
            <button
              type="submit"
              disabled={materiSaving}
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 active:scale-95 transition flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              {materiSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Simpan</span>
            </button>
          </div>
        </form>

        {materiAdded && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Materi berhasil disematkan dan siap diakses siswa!</span>
          </div>
        )}

        {/* Daftar Materi yang Sudah Diupload */}
        {materials.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Eye className="w-3 h-3" /> Materi Terupload ({materials.length})
            </h4>
            {materials.slice(0, 5).map((mat: any) => (
              <div key={mat.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{mat.title}</span>
                  <span className="text-[10px] text-slate-500">{mat.classInfo?.name} — {mat.subject?.name}</span>
                </div>
                {mat.url && (
                  <a href={mat.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-[10px] font-semibold shrink-0">Buka</a>
                )}
              </div>
            ))}
            {materials.length > 5 && (
              <span className="text-[10px] text-center text-slate-400 italic">+ {materials.length - 5} materi lainnya</span>
            )}
          </div>
        )}
      </div>

      {/* Modal Form Jurnal Pembelajaran */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Form Jurnal Mengajar Harian</h3>
                <p className="text-[11px] text-slate-500">
                  {teacherClasses.length > 0 ? `${teacherClasses[0].classInfo.name} • ${teacherClasses[0].subject.name}` : "Pilih kelas di halaman jurnal"}
                </p>
              </div>
              <button 
                onClick={() => setShowJournalModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveJournal} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Materi Pokok / KD</label>
                <input
                  type="text"
                  placeholder="Contoh: Menerapkan REST API & State Management"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Ringkasan Pembelajaran & Penugasan</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan ringkasan kegiatan pembelajaran..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                  required
                />
              </div>

              {journalSaved ? (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Jurnal Berhasil Disimpan ke Sistem!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition"
                >
                  Simpan Jurnal Pembelajaran
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Catatan Pelanggaran Siswa */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  Input Catatan Pelanggaran Siswa
                </h3>
                <p className="text-[11px] text-slate-500">Terintegrasi dengan Buku Disiplin & BK</p>
              </div>
              <button 
                onClick={() => setShowViolationModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveViolation} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Pilih Kelas:</label>
                <select
                  value={violationClassId}
                  onChange={(e) => setViolationClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {teacherClasses.map((tc: any, i: number) => (
                    <option key={i} value={tc.classId}>{tc.classInfo.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Pilih Siswa:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {classStudents.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.username})</option>
                  ))}
                </select>
                {classStudents.length === 0 && violationClassId && (
                  <span className="text-[10px] text-amber-600 italic">Belum ada siswa di kelas ini</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Jenis Pelanggaran:</label>
                <select
                  value={violationType}
                  onChange={(e) => {
                    setViolationType(e.target.value)
                    if (e.target.value.includes("Keterlambatan")) setViolationPoints(5)
                    else if (e.target.value.includes("Meninggalkan")) setViolationPoints(10)
                    else if (e.target.value.includes("Seragam")) setViolationPoints(5)
                    else setViolationPoints(25)
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Keterlambatan Hadir (> 07:15 WIB)">Keterlambatan Hadir (&gt; 07:15 WIB) (-5 Poin)</option>
                  <option value="Ketidaklengkapan Seragam / Atribut">Ketidaklengkapan Seragam / Atribut (-5 Poin)</option>
                  <option value="Meninggalkan Kelas Tanpa Izin">Meninggalkan Kelas Tanpa Izin (-10 Poin)</option>
                  <option value="Kecurangan Akademik / Ujian">Kecurangan Akademik / Ujian (-25 Poin)</option>
                </select>
              </div>

              <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs flex items-center justify-between text-red-900">
                <span>Pengurangan Poin Karakter:</span>
                <span className="font-black text-sm text-red-600">-{violationPoints} Poin</span>
              </div>

              {violationSaved ? (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Catatan pelanggaran tersimpan!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={violationSaving}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {violationSaving ? "Menyimpan..." : "Simpan ke Buku Disiplin Siswa"}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
