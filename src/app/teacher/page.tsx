"use client"

import React, { useState } from "react"
import Link from "next/link"
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
  Search, 
  ChevronRight,
  Sparkles,
  Award,
  Clock,
  Send,
  AlertTriangle,
  Calendar
} from "lucide-react"

export default function TeacherDashboard() {
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [showViolationModal, setShowViolationModal] = useState(false)
  const [journalSaved, setJournalSaved] = useState(false)
  const [violationSaved, setViolationSaved] = useState(false)

  const [materiTitle, setMateriTitle] = useState("")
  const [embedLink, setEmbedLink] = useState("")
  const [materiAdded, setMateriAdded] = useState(false)

  // State Pelanggaran
  const [selectedStudent, setSelectedStudent] = useState("Fajar Pratama")
  const [violationType, setViolationType] = useState("Keterlambatan Hadir (> 07:15 WIB)")
  const [violationPoints, setViolationPoints] = useState(5)

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault()
    setJournalSaved(true)
    setTimeout(() => {
      setShowJournalModal(false)
      setJournalSaved(false)
    }, 1200)
  }

  const handleSaveViolation = (e: React.FormEvent) => {
    e.preventDefault()
    setViolationSaved(true)
    setTimeout(() => {
      setShowViolationModal(false)
      setViolationSaved(false)
    }, 1200)
  }

  const handleSaveMateri = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materiTitle) return
    setMateriAdded(true)
    setTimeout(() => {
      setMateriAdded(false)
      setMateriTitle("")
      setEmbedLink("")
    }, 2000)
  }

  const teacherMenus = [
    { id: "jurnal", title: "Jurnal Mengajar", desc: "Isi Administrasi", icon: PenTool, color: "from-emerald-600 to-teal-600", count: "Wajib", href: "/teacher/journal" },
    { id: "materi", title: "Upload Materi", desc: "Embed Video/Drive", icon: UploadCloud, color: "from-blue-600 to-indigo-600", count: "12 Modul", action: "scroll-materi" },
    { id: "absensi", title: "Radar Presensi", desc: "Geotagging Siswa", icon: MapPin, color: "from-cyan-600 to-blue-700", count: null, href: "/teacher/classes" },
    { id: "jadwal", title: "Jadwal Mandiri", desc: "Input Roster Guru", icon: Calendar, color: "from-amber-500 to-orange-600", count: null, href: "/teacher/schedule" },
    { id: "ujian", title: "Ujian CBT PTS", desc: "Khusus Tengah/Akhir", icon: Timer, color: "from-rose-600 to-red-600", count: null, href: "/teacher/exams" },
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
              KS
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 leading-tight">Bpk. Kurniawan S, S.Kom</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Guru Produktif RPL • Wali Kelas XII RPL 1</p>
          </div>
        </div>

        <Link
          href="/teacher/profile"
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          title="Profil Guru"
        >
          <Bell className="w-4 h-4" />
        </Link>
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
          <span className="text-xs text-emerald-200 font-medium">Senin, 14 Sept</span>
        </div>

        <p className="text-xs text-emerald-100/90 leading-relaxed mb-3">
          Sesi 1 di kelas <strong>XII RPL 1</strong> (07:15 - 09:30) belum memiliki catatan jurnal materi dan ketercapaian kompetensi.
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

      {/* Quick Monitor: Presensi Kelas Radar */}
      <Link href="/teacher/classes" className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3 hover:border-emerald-300 transition">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Radar Presensi Geotagging</h3>
              <p className="text-[10px] text-slate-500">Kelas Binaan: XII Rekayasa Perangkat Lunak 1</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            94.4% Hadir
          </span>
        </div>

        {/* Progress Bar Attendance */}
        <div className="flex flex-col gap-1.5">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: "94.4%" }} title="34 Hadir"></div>
            <div className="bg-amber-400 h-full" style={{ width: "5.6%" }} title="2 Izin"></div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              34 Siswa (Radius Kampus)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
              2 Siswa (Izin / Sakit)
            </span>
          </div>
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
            8 Modul Aktif
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

      {/* Fitur Administrasi: Cepat Upload Materi (Support Embed Link YouTube & Google Drive) */}
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
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 active:scale-95 transition flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
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
      </div>

      {/* Modal Form Jurnal Pembelajaran */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Form Jurnal Mengajar Harian</h3>
                <p className="text-[11px] text-slate-500">Kelas XII RPL 1 • Sesi 1</p>
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
                  defaultValue="Menerapkan REST API & State Management pada Frontend"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Ringkasan Pembelajaran & Penugasan</label>
                <textarea
                  rows={3}
                  defaultValue="Siswa melakukan praktikum integrasi endpoint fetch data tugas dan presensi. Sebanyak 32 siswa tuntas tepat waktu."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                <span className="text-slate-600">Siswa Tidak Hadir:</span>
                <span className="font-semibold text-amber-600">2 Siswa (Rafi & Citra - Izin)</span>
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
                <label className="text-[11px] font-semibold text-slate-700">Pilih Siswa (XII RPL 1):</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Fajar Pratama">Fajar Pratama (NISN: 0067821943)</option>
                  <option value="Rafi Ahmad">Rafi Ahmad (NISN: 0067821945)</option>
                  <option value="Dimas Anggara">Dimas Anggara (NISN: 0067821946)</option>
                </select>
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
                  <span>Catatan pelanggaran tersimpan dan notifikasi terkirim!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition"
                >
                  Simpan ke Buku Disiplin Siswa
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

