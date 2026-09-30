"use client"

import React, { useState, useEffect, useMemo } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import { 
  ArrowLeft, 
  UserPlus, 
  FileSpreadsheet, 
  Trash2, 
  Shield, 
  User, 
  Loader2, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Search,
  Filter,
  School,
  AlertTriangle,
  KeyRound,
  Smartphone,
} from "lucide-react"
import { muatXlsx } from "@/lib/xlsx"
import {
  getUsers,
  createUser,
  deleteUser,
  bulkCreateUsers,
  getClassOptions,
  setStudentClass,
  resetUserPassword
} from "@/app/actions/admin"
import { resetPerangkat } from "@/app/actions/auth"

/**
 * Pencocokan nama rombel dibuat longgar terhadap huruf besar/kecil dan spasi
 * ganda, sama seperti di server, karena nama rombel pada berkas Dapodik sering
 * tidak konsisten ("X RPL 1" vs "x rpl  1").
 */
const kunciRombel = (nama: string) =>
  String(nama || "").trim().toLowerCase().replace(/\s+/g, " ")

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modals
  const [showSingleModal, setShowSingleModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error", message: string } | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  // "ALL" | "NONE" (belum punya rombel) | <classId>
  const [classFilter, setClassFilter] = useState("ALL")
  // Rombel yang sedang disimpan, agar barisnya bisa menampilkan status.
  const [savingClassFor, setSavingClassFor] = useState<string | null>(null)
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [lepasFor, setLepasFor] = useState<string | null>(null)
  // Sandi hasil reset ditampilkan sekali supaya admin bisa menyerahkannya;
  // setelah ini tidak bisa dibaca lagi karena tersimpan sebagai hash.
  const [sandiBaru, setSandiBaru] = useState<{ nama: string; sandi: string } | null>(null)

  // Single User Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "STUDENT",
    classId: ""
  })

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  // Lengkapi rombel siswa yang akunnya sudah terdaftar tetapi belum
  // ditempatkan. Tidak pernah memindahkan siswa yang sudah punya rombel.
  const [tempatkanSiswaLama, setTempatkanSiswaLama] = useState(true)

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const loadUsers = async () => {
    setIsLoading(true)
    const [data, cls] = await Promise.all([getUsers(), getClassOptions()])
    setUsers(data)
    setClasses(cls)
    setIsLoading(false)
  }

  /** Rombel siswa saat ini, atau null bila belum ditempatkan. */
  const rombelOf = (u: any) => u.studentClasses?.[0]?.classInfo ?? null

  const petaRombel = useMemo(
    () => new Map(classes.map((c: any) => [kunciRombel(c.name), c])),
    [classes]
  )

  useEffect(() => {
    loadUsers()
  }, [])

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter
      const matchSearch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.username || "").toLowerCase().includes(searchQuery.toLowerCase())

      // Penyaring rombel hanya berlaku untuk siswa; akun lain tidak punya rombel.
      let matchClass = true
      if (classFilter !== "ALL") {
        if (u.role !== "STUDENT") matchClass = false
        else if (classFilter === "NONE") matchClass = !u.studentClasses?.length
        else matchClass = u.studentClasses?.[0]?.classInfo?.id === classFilter
      }

      return matchRole && matchSearch && matchClass
    })
  }, [users, roleFilter, searchQuery, classFilter])

  // Dipakai spanduk peringatan: siswa yang belum masuk rombel tidak akan
  // melihat jadwal, materi, tugas, maupun ujian.
  const siswaTanpaRombel = useMemo(
    () => users.filter(u => u.role === "STUDENT" && !u.studentClasses?.length).length,
    [users]
  )

  // Single User Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const res = await createUser(formData)
    setIsSubmitting(false)
    
    if (res.error) {
      showToast("error", res.error)
    } else {
      setShowSingleModal(false)
      setFormData({ name: "", username: "", password: "", role: "STUDENT", classId: "" })
      showToast("success", "Pengguna baru berhasil ditambahkan!")
      loadUsers()
    }
  }

  /** Tetapkan atau kosongkan rombel siswa langsung dari daftar akun. */
  const handleClassChange = async (userId: string, classId: string) => {
    setSavingClassFor(userId)
    const res = await setStudentClass(userId, classId || null)
    setSavingClassFor(null)

    if (res.error) {
      showToast("error", res.error)
      return
    }

    // Perbarui hanya baris yang berubah. Sebelumnya di sini dipanggil
    // loadUsers(), yang menarik ulang 407 akun (102 KB, ~830 ms) plus daftar
    // rombel hanya untuk mengubah satu dropdown — itulah yang membuat
    // "menyimpan" terasa lama.
    const kelas = classes.find((c: any) => c.id === classId) || null
    setUsers(prev =>
      prev.map(u =>
        u.id === userId
          ? {
              ...u,
              studentClasses: kelas
                ? [{ classInfo: { id: kelas.id, name: kelas.name } }]
                : []
            }
          : u
      )
    )
    // Jaga agar hitungan siswa per rombel di dropdown tetap masuk akal.
    setClasses(prev =>
      prev.map((c: any) => {
        const sebelum = rombelOf(users.find(u => u.id === userId) || {})
        let delta = 0
        if (sebelum?.id === c.id) delta -= 1
        if (classId === c.id) delta += 1
        return delta === 0
          ? c
          : { ...c, _count: { ...c._count, students: Math.max(0, (c._count?.students ?? 0) + delta) } }
      })
    )

    showToast(
      "success",
      res.className ? `Rombel diubah ke ${res.className}.` : "Rombel dikosongkan."
    )
  }

  /**
   * Setel ulang kata sandi pengguna. Dibutuhkan admin untuk menyerahkan akses
   * awal kepada guru dan siswa — kata sandi tersimpan sebagai hash scrypt,
   * jadi tidak ada cara lain melihat atau memulihkannya.
   */
  const handleResetPassword = async (id: string, nama: string) => {
    const masukan = window.prompt(
      `Setel ulang kata sandi ${nama}.\n\nKosongkan untuk memakai sandi bawaan 123456, atau tulis sandi baru (min. 6 karakter).`,
      ""
    )
    // prompt() mengembalikan null bila dibatalkan; string kosong berarti pakai bawaan.
    if (masukan === null) return

    setResetFor(id)
    const res = await resetUserPassword(id, masukan.trim() || undefined)
    setResetFor(null)

    if (res.error) {
      showToast("error", res.error)
      return
    }
    setSandiBaru({ nama, sandi: res.password || "123456" })
  }

  /**
   * Lepaskan kunci satu-akun-satu-perangkat.
   *
   * Sebenarnya jarang perlu: login baru selalu menang, jadi tidak ada yang
   * bisa terkunci permanen. Tombol ini untuk kasus lain - admin ingin
   * memastikan sesi di perangkat yang hilang benar-benar mati sekarang juga,
   * tanpa menunggu masa berlaku 7 hari habis.
   */
  const handleLepasPerangkat = async (id: string, nama: string) => {
    if (!confirm(`Lepaskan kunci perangkat untuk ${nama}?

Sesi yang sedang aktif di perangkat itu akan langsung keluar.`)) return
    setLepasFor(id)
    const res = await resetPerangkat(id)
    setLepasFor(null)
    if (res.error) {
      showToast("error", res.error)
      return
    }
    showToast("success", `Perangkat ${nama} dilepaskan.`)
    await loadUsers()
  }

  // Delete User
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${name}?`)) {
      const res = await deleteUser(id)
      if (res.error) {
        showToast("error", res.error)
      } else {
        showToast("success", `Akun ${name} berhasil dihapus.`)
        loadUsers()
      }
    }
  }

  // Download Excel Templates
  /**
   * Templat siswa diisi dengan nama rombel yang BENAR-BENAR ada di database,
   * plus satu lembar berisi daftar rombel yang sah. Sebelumnya kolom "Kelas"
   * hanya berisi contoh "X RPL 1" dan nilainya tidak pernah dibaca saat impor,
   * sehingga siswa hasil impor selalu tanpa rombel.
   */
  const handleDownloadTemplateSiswa = async () => {
    const XLSX = await muatXlsx()

    if (classes.length === 0) {
      showToast(
        "error",
        "Belum ada rombel. Buat rombel dulu di menu Rombel, lalu unduh templat ini agar kolom Kelas bisa terisi."
      )
      return
    }

    const contohKelas = classes.map((c: any) => c.name)
    const templateData = [
      {
        "Nama Lengkap": "Fajar Pratama",
        "Username (NISN)": "0067821943",
        "Password": "password123",
        "Kelas": contohKelas[0],
        "Role": "STUDENT"
      },
      {
        "Nama Lengkap": "Siti Rahmawati",
        "Username (NISN)": "0067821990",
        "Password": "password123",
        "Kelas": contohKelas[Math.min(1, contohKelas.length - 1)],
        "Role": "STUDENT"
      }
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(templateData),
      "Data Siswa"
    )

    // Lembar rujukan: nama rombel harus ditulis sama persis dengan daftar ini.
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        classes.map((c: any) => ({
          "Nama Rombel (tulis persis seperti ini)": c.name,
          "Tingkat": c.level ?? "",
          "Jumlah Siswa Saat Ini": c._count?.students ?? 0
        }))
      ),
      "Daftar Rombel"
    )

    XLSX.writeFile(workbook, "Template_Import_Siswa.xlsx")
  }

  const handleDownloadTemplateGuru = async () => {
    const XLSX = await muatXlsx()

    const templateData = [
      { "Nama Lengkap": "Bpk. Kurniawan S, S.Kom", "Username (NIP/NUPTK)": "kurniawan_guru", "Password": "password123", "Role": "TEACHER" }
    ]
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Guru")
    XLSX.writeFile(workbook, "Template_Import_Guru.xlsx")
  }

  const handleDownloadTemplateLainnya = async () => {
    const XLSX = await muatXlsx()

    const templateData = [
      { "Nama Lengkap": "Admin Utama", "Username": "admin_utama", "Password": "password123", "Role": "ADMIN" },
      { "Nama Lengkap": "PT Telkom", "Username": "mitra_telkom", "Password": "password123", "Role": "DUDI" }
    ]
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Lainnya")
    XLSX.writeFile(workbook, "Template_Import_Lainnya.xlsx")
  }

  // Handle File Upload & Parse
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setParseError(null)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const XLSX = await muatXlsx()
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" })

        if (rawJson.length === 0) {
          setParseError("File Excel/CSV kosong!")
          setParsedData([])
          setImportPreview([])
          return
        }

        // Normalize keys
        const cleanRows = rawJson.map((row: any) => {
          let name = ""
          let username = ""
          let password = "password123"
          let role = "STUDENT"
          let kelas = ""

          for (const key of Object.keys(row)) {
            const cleanKey = key.trim().toLowerCase()
            const val = String(row[key]).trim()

            if (cleanKey.includes("nama rombel")) {
              // Lembar "Daftar Rombel" pada templat memakai judul ini; jangan
              // sampai terbaca sebagai nama siswa.
              continue
            } else if (cleanKey.includes("nama") || cleanKey === "name") {
              name = val
            } else if (cleanKey.includes("kelas") || cleanKey.includes("rombel")) {
              // Diperiksa sebelum cabang username, supaya judul seperti
              // "Kelas ID" tidak salah terbaca sebagai username.
              kelas = val
            } else if (cleanKey.includes("user") || cleanKey.includes("nisn") || cleanKey.includes("nip") || cleanKey.includes("id")) {
              username = val
            } else if (cleanKey.includes("pass") || cleanKey.includes("sandi")) {
              if (val) password = val
            } else if (cleanKey.includes("role") || cleanKey.includes("peran") || cleanKey.includes("status") || cleanKey.includes("tipe")) {
              if (val) role = val.toUpperCase()
            }
          }

          // Fallback if headers were simple positional
          if (!name && row["__EMPTY"]) name = String(row["__EMPTY"]).trim()
          if (!username && row["__EMPTY_1"]) username = String(row["__EMPTY_1"]).trim()

          return { name, username, password, role, kelas }
        }).filter(r => r.name || r.username)

        if (cleanRows.length === 0) {
          setParseError("Tidak dapat mendeteksi kolom 'Nama' dan 'Username' pada file tersebut. Silakan unduh template yang disediakan.")
          setParsedData([])
          setImportPreview([])
          return
        }

        setParsedData(cleanRows)
        setImportPreview(cleanRows.slice(0, 5))
      } catch (err: any) {
        setParseError("Gagal membaca file: " + (err.message || "Pastikan format .xlsx atau .csv valid"))
      }
    }
    reader.readAsBinaryString(file)
  }

  // Execute Bulk Import
  const handleImportSubmit = async () => {
    if (parsedData.length === 0) return
    setIsSubmitting(true)

    const res = await bulkCreateUsers(parsedData, { tempatkanSiswaLama })
    setIsSubmitting(false)

    if (res.error) {
      showToast("error", res.error)
    } else {
      setShowImportModal(false)
      setImportFile(null)
      setParsedData([])
      setImportPreview([])

      const bagian = [`${res.count} akun baru`]
      if (res.ditempatkan) bagian.push(`${res.ditempatkan} masuk rombel`)
      if (res.ditempatkanLama) {
        bagian.push(`${res.ditempatkanLama} siswa lama dilengkapi rombel`)
      }
      if (res.skipped) bagian.push(`${res.skipped} dilewati`)
      showToast("success", `Impor selesai: ${bagian.join(", ")}.`)

      if (res.rombelTidakDikenal?.length) {
        setTimeout(
          () =>
            showToast(
              "error",
              `Rombel tidak dikenal dan dilewati: ${res.rombelTidakDikenal!.join(", ")}. Buat rombel itu dulu, lalu impor ulang.`
            ),
          4200
        )
      }
      loadUsers()
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold border transition-all animate-in fade-in slide-in-from-top-2 ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hasil setel ulang sandi — tampil sekali, lalu hilang */}
      {sandiBaru && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-emerald-900">
              Kata sandi {sandiBaru.nama} berhasil disetel ulang
            </p>
            <p className="text-[11px] text-emerald-800 mt-1">
              Sandi baru:{" "}
              <code className="font-mono font-bold bg-white border border-emerald-300 px-1.5 py-0.5 rounded">
                {sandiBaru.sandi}
              </code>
            </p>
            <p className="text-[10px] text-emerald-700 mt-1 leading-relaxed">
              Catat sekarang — sandi tersimpan sebagai hash, jadi tidak bisa dilihat
              lagi setelah panel ini ditutup. Pengguna akan diminta menggantinya.
            </p>
          </div>
          <button
            onClick={() => setSandiBaru(null)}
            className="shrink-0 p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Manajemen Akun & Data Pengguna</h2>
            <p className="text-[11px] text-slate-500 font-medium">Total {users.length} Akun Terdaftar di Sistem</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel / CSV</span>
          </button>

          <button 
            onClick={() => setShowSingleModal(true)}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center justify-center gap-1.5 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Manual</span>
          </button>
        </div>
      </div>

      {/* Peringatan integrasi rombel */}
      {!isLoading && classes.length === 0 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-rose-800 leading-relaxed">
            <strong className="block">Belum ada rombel.</strong>
            Buat rombel dulu di{" "}
            <Link href="/admin/rombel" className="font-bold underline">
              menu Rombel
            </Link>
            . Kolom <strong>Kelas</strong> pada templat impor baru bisa dipakai
            setelah rombelnya ada — tanpa itu siswa hasil impor tidak akan
            melihat jadwal, materi, tugas, maupun ujian.
          </div>
        </div>
      )}

      {!isLoading && classes.length > 0 && siswaTanpaRombel > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 leading-relaxed">
              <strong className="block">
                {siswaTanpaRombel} siswa belum masuk rombel.
              </strong>
              Selama belum ditempatkan, menu Jadwal, Materi, Tugas, dan Ujian
              mereka akan kosong. Tetapkan rombel langsung dari daftar di bawah,
              atau impor ulang dengan kolom Kelas terisi.
            </div>
          </div>
          <button
            onClick={() => {
              setRoleFilter("STUDENT")
              setClassFilter("NONE")
            }}
            className="shrink-0 bg-white border border-amber-300 text-amber-800 px-2.5 py-1.5 rounded-xl text-[11px] font-bold hover:bg-amber-100 transition"
          >
            Tampilkan
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau username..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Semua" },
            { id: "STUDENT", label: "Siswa" },
            { id: "TEACHER", label: "Guru" },
            { id: "ADMIN", label: "Admin" },
            { id: "DUDI", label: "DUDI" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                roleFilter === tab.id 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Penyaring Rombel — memudahkan menemukan siswa yang belum ditempatkan */}
      {classes.length > 0 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 shrink-0">
            <School className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Rombel</span>
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="flex-1 text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition"
          >
            <option value="ALL">Semua rombel</option>
            <option value="NONE">Siswa belum punya rombel ({siswaTanpaRombel})</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c._count?.students ?? 0} siswa)
              </option>
            ))}
          </select>
          {classFilter !== "ALL" && (
            <button
              onClick={() => setClassFilter("ALL")}
              className="shrink-0 px-2.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <PemuatData pesan="Memuat data pengguna dari server..." />
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <User className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-700">Tidak ada pengguna ditemukan</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {searchQuery ? "Coba ubah kata kunci pencarian Anda." : "Klik 'Import Excel / CSV' atau 'Tambah Manual' untuk memasukkan data pengguna."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const roleBg = 
                u.role === "ADMIN" ? "bg-purple-50 text-purple-700 border-purple-200" :
                u.role === "TEACHER" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                u.role === "DUDI" ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-blue-50 text-blue-700 border-blue-200"

              const roleIcon = 
                u.role === "ADMIN" ? <Shield className="w-4 h-4 text-purple-600" /> :
                u.role === "TEACHER" ? <User className="w-4 h-4 text-emerald-600" /> :
                <User className="w-4 h-4 text-blue-600" />

              const rombel = rombelOf(u)

              return (
                <div key={u.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                      {roleIcon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">{u.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-500">@{u.username}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${roleBg}`}>
                          {u.role}
                        </span>
                        {/* Rombel hanya bermakna untuk siswa. */}
                        {u.role === "STUDENT" && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 ${
                              rombel
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <School className="w-2.5 h-2.5" />
                            {rombel ? rombel.name : "Tanpa Rombel"}
                          </span>
                        )}
                        {/* Perangkat yang sedang memegang sesi akun ini.
                            Ditampilkan supaya admin bisa langsung menjawab
                            laporan "saya keluar sendiri" - biasanya karena
                            akunnya dipakai orang lain. */}
                        {u.sesiPerangkat && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1"
                            title={`Aktif sejak ${u.sesiSejak ? new Date(u.sesiSejak).toLocaleString("id-ID") : "-"}`}
                          >
                            <Smartphone className="w-2.5 h-2.5" />
                            {u.sesiPerangkat}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Ubah rombel langsung dari sini, tanpa pindah menu. */}
                    {u.role === "STUDENT" && classes.length > 0 && (
                      <div className="relative">
                        <select
                          value={rombel?.id || ""}
                          disabled={savingClassFor === u.id}
                          onChange={(e) => handleClassChange(u.id, e.target.value)}
                          title="Tetapkan rombel siswa ini"
                          className={`text-[11px] py-1.5 pl-2 pr-6 rounded-xl border outline-none transition appearance-none disabled:opacity-50 ${
                            rombel
                              ? "bg-white border-slate-200 text-slate-700"
                              : "bg-amber-50 border-amber-300 text-amber-800 font-bold"
                          }`}
                        >
                          <option value="">— Tanpa rombel —</option>
                          {classes.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        {savingClassFor === u.id && (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    )}

                    {u.sesiPerangkat && (
                      <button
                        onClick={() => handleLepasPerangkat(u.id, u.name)}
                        disabled={lepasFor === u.id}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition disabled:opacity-50"
                        title="Lepaskan kunci perangkat"
                      >
                        {lepasFor === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleResetPassword(u.id, u.name)}
                      disabled={resetFor === u.id}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition disabled:opacity-50"
                      title="Setel ulang kata sandi"
                    >
                      {resetFor === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                    </button>

                    {u.username !== 'admin' && (
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: SINGLE USER */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Tambah Akun Manual</h3>
              <button onClick={() => setShowSingleModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSingleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" placeholder="Contoh: Fajar Pratama" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Username (Untuk Login)</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" placeholder="Contoh: 0067821943 / kurniawan" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" placeholder="Default: 123456" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Role (Peran Hak Akses)</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition">
                  <option value="STUDENT">Siswa (Student)</option>
                  <option value="TEACHER">Guru (Teacher)</option>
                  <option value="DUDI">Mitra Industri (DUDI)</option>
                  <option value="ADMIN">Super Admin</option>
                </select>
              </div>

              {/* Penempatan rombel sekaligus saat akun siswa dibuat. */}
              {formData.role === "STUDENT" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Rombel {classes.length === 0 && <span className="text-rose-600">(belum ada rombel)</span>}
                  </label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    disabled={classes.length === 0}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
                  >
                    <option value="">— Belum ditempatkan —</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {classes.length === 0
                      ? "Buat rombel dulu di menu Rombel agar siswa bisa langsung ditempatkan."
                      : "Siswa tanpa rombel tidak melihat jadwal, materi, tugas, maupun ujian."}
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => setShowSingleModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50 transition">
                  {isSubmitting ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK IMPORT EXCEL / CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Import Massal Akun (Excel / CSV)</h3>
                  <p className="text-[10px] text-slate-500">Unggah file Dapodik / Excel untuk ratusan data sekaligus</p>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 flex flex-col gap-4">
              {/* Step 1: Download Template */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex flex-col gap-3">
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Belum punya format file?</h4>
                  <p className="text-[10px] text-blue-700 mt-0.5">Unduh template Excel resmi yang sudah disesuaikan dengan sistem PELITA berdasarkan role.</p>
                  {classes.length > 0 ? (
                    <p className="text-[10px] text-blue-800 mt-1.5 leading-relaxed">
                      Templat siswa sudah berisi kolom <strong>Kelas</strong> dan satu
                      lembar <strong>Daftar Rombel</strong> berisi {classes.length} rombel
                      yang ada. Tulis nama rombel sama persis seperti daftar itu agar
                      siswa langsung masuk rombelnya saat diimpor.
                    </p>
                  ) : (
                    <p className="text-[10px] text-rose-700 font-semibold mt-1.5 leading-relaxed">
                      Belum ada rombel, jadi kolom Kelas belum bisa dipakai. Buat rombel
                      dulu di menu Rombel.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDownloadTemplateSiswa} className="flex-1 bg-white border border-blue-200 text-blue-700 px-2 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-100 shadow-sm flex items-center justify-center gap-1.5 transition">
                    <Download className="w-3 h-3" />
                    <span>Siswa</span>
                  </button>
                  <button onClick={handleDownloadTemplateGuru} className="flex-1 bg-white border border-blue-200 text-blue-700 px-2 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-100 shadow-sm flex items-center justify-center gap-1.5 transition">
                    <Download className="w-3 h-3" />
                    <span>Guru</span>
                  </button>
                  <button onClick={handleDownloadTemplateLainnya} className="flex-1 bg-white border border-blue-200 text-blue-700 px-2 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-100 shadow-sm flex items-center justify-center gap-1.5 transition">
                    <Download className="w-3 h-3" />
                    <span>Admin/DUDI</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Upload File */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">Pilih File Excel (.xlsx, .xls) atau .csv</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 text-center bg-slate-50 hover:bg-emerald-50/30 transition flex flex-col items-center justify-center gap-2 cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {importFile ? importFile.name : "Klik atau seret file ke sini"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {importFile ? `Ukuran: ${Math.round(importFile.size / 1024)} KB` : "Mendukung format .xlsx, .xls, .csv"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview Table */}
              {parsedData.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Hasil Deteksi File</span>
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                      {parsedData.length} baris siap diimpor
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2">Nama Lengkap</th>
                          <th className="p-2">Username</th>
                          <th className="p-2">Role</th>
                          <th className="p-2">Rombel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {importPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-800">{row.name}</td>
                            <td className="p-2 font-mono text-slate-500">{row.username}</td>
                            <td className="p-2">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {row.role}
                              </span>
                            </td>
                            <td className="p-2">
                              {/* Tandai apakah nama rombel di berkas cocok
                                  dengan rombel yang ada, sebelum impor jalan. */}
                              {row.role !== "STUDENT" ? (
                                <span className="text-slate-300">—</span>
                              ) : !row.kelas ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  kosong
                                </span>
                              ) : petaRombel.has(kunciRombel(row.kelas)) ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {row.kelas}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Rombel ini belum ada di database">
                                  {row.kelas} · tidak ada
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.length > 5 && (
                    <p className="text-[10px] text-slate-400 italic text-center">
                      ... dan {parsedData.length - 5} data lainnya akan otomatis diproses.
                    </p>
                  )}

                  {/* Ringkasan rombel dari SELURUH baris, bukan hanya 5 pratinjau. */}
                  {(() => {
                    const siswa = parsedData.filter(r => r.role === "STUDENT")
                    const tanpaKelas = siswa.filter(r => !r.kelas).length
                    const takDikenal = Array.from(
                      new Set(
                        siswa
                          .filter(r => r.kelas && !petaRombel.has(kunciRombel(r.kelas)))
                          .map(r => r.kelas)
                      )
                    )
                    const cocok = siswa.length - tanpaKelas - siswa.filter(
                      r => r.kelas && !petaRombel.has(kunciRombel(r.kelas))
                    ).length

                    if (siswa.length === 0) return null

                    return (
                      <div className="flex flex-col gap-2">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-700 flex flex-wrap gap-x-3 gap-y-1">
                          <span><strong className="text-emerald-700">{cocok}</strong> siswa akan masuk rombel</span>
                          {tanpaKelas > 0 && (
                            <span><strong className="text-amber-700">{tanpaKelas}</strong> tanpa kolom Kelas</span>
                          )}
                          {takDikenal.length > 0 && (
                            <span><strong className="text-rose-700">{takDikenal.length}</strong> nama rombel tidak dikenal</span>
                          )}
                        </div>

                        {takDikenal.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[10px] text-rose-800 leading-relaxed flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              Rombel berikut belum ada di database dan akan dilewati:{" "}
                              <strong>{takDikenal.join(", ")}</strong>. Akunnya tetap dibuat,
                              tetapi tanpa rombel. Buat rombel itu dulu di menu Rombel kalau
                              ingin siswanya langsung ditempatkan.
                            </span>
                          </div>
                        )}

                        <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempatkanSiswaLama}
                            onChange={(e) => setTempatkanSiswaLama(e.target.checked)}
                            className="mt-0.5"
                          />
                          <span className="text-[10px] text-slate-700 leading-relaxed">
                            <strong className="block">
                              Lengkapi juga rombel siswa yang sudah terdaftar
                            </strong>
                            Untuk baris yang usernamenya sudah ada, rombelnya diisikan
                            bila siswa itu belum punya rombel. Siswa yang sudah punya
                            rombel tidak akan dipindahkan.
                          </span>
                        </label>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                  setParsedData([])
                  setImportPreview([])
                }} 
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button 
                type="button" 
                disabled={parsedData.length === 0 || isSubmitting} 
                onClick={handleImportSubmit} 
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengimpor Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mulai Impor ({parsedData.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
