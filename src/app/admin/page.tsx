"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  Users, 
  GraduationCap, 
  Layers, 
  School, 
  Database, 
  ShieldCheck, 
  Settings, 
  UploadCloud, 
  FileSpreadsheet, 
  BookOpen,
  Calendar,
  Sparkles,
  ChevronRight,
  Plus,
  Send,
  CheckCircle2,
  Lock,
  LogOut,
  RefreshCw,
  Bell,
  FileUp,
  Download,
  Check,
  AlertCircle,
  Clock,
  BookMarked,
  UserCheck
} from "lucide-react"

export default function AdminDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Demo state for interactive admin actions
  const [userTab, setUserTab] = useState<"single" | "bulk">("single")
  const [bulkFileType, setBulkFileType] = useState<"Siswa" | "Guru" | "DUDI">("Siswa")
  const [bulkFileSelected, setBulkFileSelected] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const [usersList, setUsersList] = useState([
    { name: "Bpk. Kurniawan S, S.Kom", role: "Guru", id: "19820415...", status: "Aktif" },
    { name: "Fajar Pratama", role: "Siswa", id: "0067821943", status: "Aktif" },
    { name: "Ir. Hendra Kusuma", role: "Mitra DUDI", id: "PT Telkom", status: "Aktif" },
  ])
  const [newUserName, setNewUserName] = useState("")
  const [newUserRole, setNewUserRole] = useState("Siswa")

  // Announcement state
  const [broadcastMsg, setBroadcastMsg] = useState("")

  // Schedule policy state
  const [teacherSelfSchedule, setTeacherSelfSchedule] = useState(true)

  // Exam token state
  const [cbtToken, setCbtToken] = useState("PTS2026")

  // Sesi state
  const [sesiList, setSesiList] = useState([
    { jamKe: "Ke-1", waktu: "07:00 - 07:45", type: "Reguler" },
    { jamKe: "Ke-2", waktu: "07:45 - 08:30", type: "Reguler" },
    { jamKe: "Ke-3", waktu: "08:30 - 09:15", type: "Reguler" },
    { jamKe: "Istirahat 1", waktu: "09:15 - 09:45", type: "Istirahat" },
    { jamKe: "Ke-4", waktu: "09:45 - 10:30", type: "Reguler" },
    { jamKe: "Ke-5", waktu: "10:30 - 11:15", type: "Reguler" },
  ])

  // Mapel state
  const [mapelList, setMapelList] = useState([
    { mapel: "Pemrograman Web & Perangkat Bergerak", tipe: "Kejuruan", pengampu: ["Bpk. Kurniawan S", "Bpk. M. Sholeh"] },
    { mapel: "Matematika", tipe: "Umum", pengampu: ["Ibu Siti Aminah", "Bpk. Budi Santoso"] },
    { mapel: "Pendidikan Agama Islam", tipe: "Muatan Nasional", pengampu: ["Ustadz Abdul Somad"] },
  ])

  const triggerToast = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3000)
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim()) return
    setUsersList([...usersList, { name: newUserName, role: newUserRole, id: "Baru", status: "Aktif" }])
    setNewUserName("")
    setActiveModal(null)
    triggerToast(`Pengguna ${newUserName} (${newUserRole}) berhasil didaftarkan!`)
  }

  const handleBulkImport = () => {
    setIsImporting(true)
    setTimeout(() => {
      setIsImporting(false)
      setActiveModal(null)
      setBulkFileSelected(null)
      triggerToast(`Berhasil mengimpor 36 Data ${bulkFileType} sekaligus dari file Excel Dapodik!`)
    }, 1200)
  }

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastMsg.trim()) return
    setActiveModal(null)
    setBroadcastMsg("")
    triggerToast("Pengumuman broadcast berhasil dikirim ke seluruh siswa & guru!")
  }

  const masterCards = [
    { title: "Siswa Aktif", count: "1.084", sub: "36 Rombel", icon: GraduationCap, color: "from-blue-600 to-indigo-600" },
    { title: "Tenaga Pendidik", count: "78 Guru", sub: "100% Terverifikasi", icon: Layers, color: "from-emerald-600 to-teal-600" },
    { title: "Mitra DUDI", count: "24 Industri", sub: "Kerjasama PKL", icon: School, color: "from-purple-600 to-violet-600" },
    { title: "Server Supabase", count: "Online", sub: "Latency 24ms", icon: Database, color: "from-slate-700 to-slate-900" },
  ]

  const quickActions = [
    { id: "users", title: "Manajemen Akun & Upload Massal", desc: "Input Satuan / Upload Sekaligus (Excel)", icon: Users },
    { id: "broadcast", title: "Pengumuman Sekolah (Broadcast)", desc: "Kirim Pesan ke Semua HP", icon: Bell },
    { id: "rombel", title: "Master Rombel & Wali Kelas", desc: "Atur Tingkat & Penetapan Wali Kelas", icon: School },
    { id: "sesi", title: "Master Sesi & Jam Pelajaran", desc: "Atur Durasi & Shift Jam Ke-X", icon: Clock },
    { id: "mapel", title: "Master Mapel & Pengampu", desc: "Data Mata Pelajaran & Relasi Guru", icon: BookMarked },
    { id: "jadwal", title: "Plotting Jadwal Mandiri Guru", desc: "Guru Mapel Menginput Jadwal Sendiri", icon: Calendar },
    { id: "ujian", title: "Jadwal & Token Ujian PTS CBT", desc: "Pengaturan Token & Ruang CBT", icon: BookOpen },
    { id: "backup", title: "Backup Database Supabase", desc: "Sinkronisasi & Snapshot Data", icon: Database },
  ]

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Admin Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white font-bold text-base shadow-md shadow-slate-900/20 ring-2 ring-white">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 leading-tight">Super Administrator</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Pusat Kendali Sistem • SMKN 1 Kemangkon</p>
          </div>
        </div>

        <Link
          href="/login"
          className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition flex items-center gap-1 text-xs font-bold"
          title="Keluar dari Admin"
        >
          <LogOut className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        {masterCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.title} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 block leading-tight">{c.title}</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{c.count}</span>
                <span className="text-[9px] text-slate-400 font-medium">{c.sub}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Administrative Operations */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
          Operasional Master Data (Interaktif)
        </h3>

        <div className="flex flex-col gap-2">
          {quickActions.map((act) => {
            const Icon = act.icon
            return (
              <button
                key={act.title}
                onClick={() => {
                  if (act.id === "backup") {
                    triggerToast("Koneksi Supabase PostgreSQL sinkron. Snapshot backup terbuat!")
                  } else {
                    setActiveModal(act.id)
                  }
                }}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center justify-between text-left transition group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-slate-700 flex items-center justify-center shadow-xs border border-slate-200/60 group-hover:text-blue-600 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[10px] text-slate-500">{act.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
              </button>
            )
          })}
        </div>
      </div>

      {/* MODAL 1: MANAJEMEN AKUN & UPLOAD MASSAL (EXCEL/CSV) */}
      {activeModal === "users" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Manajemen Pengguna & Import</h3>
                <p className="text-[11px] text-slate-500">Input Manual atau Upload Excel Sekaligus</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
              >
                Tutup
              </button>
            </div>

            {/* Tab Pilihan: Input Satuan vs Upload Massal */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setUserTab("single")}
                className={`py-1.5 rounded-lg transition ${
                  userTab === "single" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Input Satuan
              </button>
              <button
                onClick={() => setUserTab("bulk")}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                  userTab === "bulk" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Excel Sekaligus</span>
              </button>
            </div>

            {userTab === "single" ? (
              <>
                {/* List Users Ringkas */}
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                  {usersList.map((u, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block text-[11px]">{u.name}</span>
                        <span className="text-[9px] text-slate-400">{u.id}</span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Form Tambah Pengguna Satuan */}
                <form onSubmit={handleAddUser} className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-700">Tambah Akun Baru:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Nama Lengkap Pengguna"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      required
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru</option>
                      <option value="Mitra DUDI">DUDI</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition mt-1"
                  >
                    Simpan Akun
                  </button>
                </form>
              </>
            ) : (
              /* TAB UPLOAD MASSAL EXCEL / CSV */
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Kategori Data:</span>
                  <div className="flex gap-1">
                    {(["Siswa", "Guru", "DUDI"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setBulkFileType(t)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          bulkFileType === t 
                            ? "bg-blue-600 text-white" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Download Template Banner */}
                <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-center justify-between text-blue-900">
                  <div>
                    <span className="font-bold block text-[11px]">Template Excel {bulkFileType}</span>
                    <span className="text-[10px] text-blue-600">Format kolom resmi: Nama, NISN/NIP, Kelas/Mapel</span>
                  </div>
                  <a
                    href="data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,"
                    download={`Template_${bulkFileType}_SMKN1.xlsx`}
                    onClick={() => triggerToast(`Template Excel Format_${bulkFileType}.xlsx diunduh!`)}
                    className="px-2.5 py-1.5 bg-white text-blue-700 border border-blue-200 rounded-xl text-[10px] font-bold shadow-xs hover:bg-blue-100 transition flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Unduh
                  </a>
                </div>

                {/* Dropzone File Upload */}
                <div 
                  onClick={() => setBulkFileSelected(`Data_${bulkFileType}_SMKN1_Dapodik.xlsx`)}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                    bulkFileSelected 
                      ? "border-emerald-500 bg-emerald-50/50" 
                      : "border-slate-300 hover:border-blue-500 bg-slate-50"
                  }`}
                >
                  <FileUp className={`w-8 h-8 ${bulkFileSelected ? "text-emerald-600" : "text-slate-400"}`} />
                  {bulkFileSelected ? (
                    <div>
                      <span className="font-bold text-emerald-800 text-xs block">{bulkFileSelected}</span>
                      <span className="text-[10px] text-emerald-600">Siap diimpor (Terdeteksi 36 baris data valid)</span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-slate-700 text-xs block">Pilih / Seret File Excel atau CSV</span>
                      <span className="text-[10px] text-slate-400">Klik di sini untuk memilih file contoh</span>
                    </div>
                  )}
                </div>

                {/* Action Import Button */}
                <button
                  type="button"
                  disabled={!bulkFileSelected || isImporting}
                  onClick={handleBulkImport}
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 ${
                    bulkFileSelected && !isImporting
                      ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-98"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isImporting ? (
                    <span>Memproses 36 Data...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Eksekusi Impor 36 Data Sekaligus</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: BROADCAST PENGUMUMAN */}
      {activeModal === "broadcast" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Broadcast Pengumuman Sekolah</h3>
                <p className="text-[11px] text-slate-500">Kirim Notifikasi Push ke Seluruh Akun</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="flex flex-col gap-2.5">
              <textarea
                rows={3}
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Tuliskan isi pengumuman penting sekolah..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Broadcast Sekarang</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MASTER ROMBEL */}
      {activeModal === "rombel" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Master Rombel & Wali Kelas</h3>
                <p className="text-[11px] text-slate-500">Atur Tingkat, Jurusan, dan Penetapan Wali</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 font-bold text-xs">Tutup</button>
            </div>
            
            <div className="flex flex-col gap-2 text-xs max-h-60 overflow-y-auto pr-1">
              {[
                { name: "XII RPL 1", siswa: 36, wali: "Bpk. Kurniawan S, S.Kom" },
                { name: "XI RPL 2", siswa: 35, wali: "Ibu Nurul Hidayah, M.Pd" },
                { name: "X RPL 1", siswa: 36, wali: "Bpk. M. Sholeh, S.T" }
              ].map((rombel, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl flex flex-col gap-2 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">{rombel.name}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">{rombel.siswa} Siswa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <select className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-medium outline-none focus:border-blue-500 transition">
                      <option>{rombel.wali}</option>
                      <option>Bpk. Budi Santoso</option>
                      <option>Ibu Ani Kartika</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setActiveModal(null)
                triggerToast("Rombel baru berhasil dibuat & Wali Kelas ditetapkan!")
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 transition text-white font-bold text-xs rounded-xl mt-2 flex items-center justify-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rombel Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: MASTER SESI (JAM PELAJARAN) */}
      {activeModal === "sesi" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Master Sesi & Jam Pelajaran</h3>
                <p className="text-[11px] text-slate-500">Pengaturan Waktu Reguler & Shift</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 font-bold text-xs">Tutup</button>
            </div>
            
            <div className="flex flex-col gap-2 text-xs max-h-60 overflow-y-auto pr-1">
              {sesiList.map((sesi, i) => (
                <div key={i} className={`p-2.5 rounded-xl flex items-center justify-between border ${sesi.type !== 'Reguler' ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${sesi.type !== 'Reguler' ? 'text-orange-500' : 'text-blue-500'}`} />
                    <span className={`font-bold ${sesi.type !== 'Reguler' ? 'text-orange-900' : 'text-slate-800'}`}>Jam {sesi.jamKe}</span>
                  </div>
                  <input type="text" defaultValue={sesi.waktu} className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] w-28 text-center font-mono outline-none" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setSesiList([...sesiList, { jamKe: `Ke-${sesiList.filter(s => s.type === 'Reguler').length + 1}`, waktu: "11:15 - 12:00", type: "Reguler" }])}
                className="py-1.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg border border-slate-200 flex items-center justify-center gap-1 hover:bg-slate-200 transition"
              >
                <Plus className="w-3 h-3" /> Tambah Jam Reguler
              </button>
              <button
                onClick={() => setSesiList([...sesiList, { jamKe: "Istirahat 2", waktu: "12:00 - 12:30", type: "Istirahat" }])}
                className="py-1.5 bg-orange-50 text-orange-700 font-bold text-[10px] rounded-lg border border-orange-200 flex items-center justify-center gap-1 hover:bg-orange-100 transition"
              >
                <Plus className="w-3 h-3" /> Istirahat 2
              </button>
              <button
                onClick={() => setSesiList([{ jamKe: "Upacara", waktu: "07:00 - 08:00", type: "Khusus" }, ...sesiList])}
                className="py-1.5 bg-rose-50 text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200 flex items-center justify-center gap-1 hover:bg-rose-100 transition"
              >
                <Plus className="w-3 h-3" /> Upacara
              </button>
              <button
                onClick={() => setSesiList([{ jamKe: "Pembiasaan Jumat", waktu: "07:00 - 07:30", type: "Khusus" }, ...sesiList])}
                className="py-1.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center justify-center gap-1 hover:bg-emerald-100 transition"
              >
                <Plus className="w-3 h-3" /> Pembiasaan Jumat
              </button>
            </div>
            
            <button
              onClick={() => {
                setActiveModal(null)
                triggerToast("Perubahan jadwal sesi berhasil disimpan!")
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 transition text-white font-bold text-xs rounded-xl mt-2 shadow-md"
            >
              Simpan Perubahan Sesi
            </button>
          </div>
        </div>
      )}

      {/* MODAL: MASTER MATA PELAJARAN & PENGAMPU */}
      {activeModal === "mapel" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Master Mata Pelajaran</h3>
                <p className="text-[11px] text-slate-500">Data Mapel & Penugasan Pengampu</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 font-bold text-xs">Tutup</button>
            </div>
            
            <div className="flex flex-col gap-2 text-xs max-h-60 overflow-y-auto pr-1">
              {mapelList.map((m, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl flex flex-col gap-2 border border-slate-100">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-800 leading-tight w-2/3">{m.mapel}</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">{m.tipe}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold">Guru Pengampu:</span>
                    <div className="flex flex-wrap gap-1">
                      {m.pengampu.map((guru, j) => (
                        <span key={j} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-500" />
                          {guru}
                        </span>
                      ))}
                      <button 
                        onClick={() => {
                          const newList = [...mapelList];
                          newList[i].pengampu.push("Guru Baru");
                          setMapelList(newList);
                          triggerToast(`Guru baru ditambahkan ke ${m.mapel}`);
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-full text-blue-600 font-semibold flex items-center gap-0.5 transition"
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setMapelList([...mapelList, { mapel: "Mata Pelajaran Baru", tipe: "Kejuruan", pengampu: [] }]);
                triggerToast("Mata Pelajaran Baru Berhasil Ditambahkan!");
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 transition text-white font-bold text-xs rounded-xl mt-2 flex items-center justify-center gap-1.5 shadow-md"
            >
              <BookMarked className="w-4 h-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: JADWAL MANDIRI GURU (DEDICATED - BUKAN LAGI MODAL UJIAN!) */}
      {activeModal === "jadwal" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Plotting Jadwal Pembelajaran Mandiri</h3>
                <p className="text-[11px] text-slate-500">Desentralisasi Input Roster oleh Guru Mapel</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 font-bold text-xs">Tutup</button>
            </div>

            {/* Kebijakan Input Mandiri Toggle */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Izinkan Guru Menginput Jadwal Sendiri</span>
                <span className="text-[10px] text-slate-500">Guru menentukan hari, jam, kelas, dan ruang lab mandiri</span>
              </div>
              <button
                onClick={() => setTeacherSelfSchedule(!teacherSelfSchedule)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  teacherSelfSchedule ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  teacherSelfSchedule ? "left-6" : "left-1"
                }`}></span>
              </button>
            </div>

            {/* Progres Pengisian Jadwal Guru */}
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Guru yang Sudah Memplot Jadwal:</span>
                <span className="font-bold text-emerald-600">74 dari 78 Guru (95%)</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: "95%" }}></div>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl text-[11px] leading-relaxed">
              💡 <strong>Keuntungan:</strong> Admin tidak perlu mengetik jadwal satu per satu. Setiap guru dapat langsung mengatur slot mengajarnya melalui menu <strong>"Atur Jadwal Mengajar"</strong> di akun guru masing-masing!
            </div>

            <button
              onClick={() => {
                setActiveModal(null)
                triggerToast("Pengaturan jadwal mandiri disimpan & broadcast pengingat dikirim ke guru!")
              }}
              className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Simpan Kebijakan & Kirim Pengingat
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: PENGATURAN TOKEN UJIAN PTS CBT (DEDICATED) */}
      {activeModal === "ujian" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pengaturan Token Ujian PTS CBT</h3>
                <p className="text-[11px] text-slate-500">Kendali Ruang Ujian Tengah & Akhir Semester</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 font-bold text-xs">Tutup</button>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs">
              <span className="text-slate-600 block mb-1">Token Ujian Aktif Saat Ini:</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-rose-700 text-lg tracking-wider">{cbtToken}</span>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                  Status: Terkunci & Berlaku
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const randomToken = "PTS" + Math.floor(1000 + Math.random() * 9000)
                  setCbtToken(randomToken)
                  triggerToast(`Token baru di-generate: ${randomToken}`)
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
              >
                Acak Token Baru
              </button>
              <button
                onClick={() => {
                  setActiveModal(null)
                  triggerToast(`Token ${cbtToken} disimpan dan diumumkan ke pengawas ruang ujian!`)
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Simpan & Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
