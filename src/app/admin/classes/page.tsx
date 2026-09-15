"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, School, Loader2, Users, UserPlus, UserMinus, X, ChevronRight } from "lucide-react"
import { getClasses, getTeachers, createClass, deleteClass, addStudentToClass, removeStudentFromClass, getStudentsWithoutClass, getClassStudents, getAllStudents } from "@/app/actions/admin"

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Manage Students Modal
  const [manageClassId, setManageClassId] = useState<string | null>(null)
  const [manageClassName, setManageClassName] = useState("")
  const [classStudentsList, setClassStudentsList] = useState<any[]>([])
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("")
  const [manageSaving, setManageSaving] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    waliKelasId: ""
  })

  const loadData = async () => {
    setIsLoading(true)
    const [clsData, tchData] = await Promise.all([getClasses(), getTeachers()])
    setClasses(clsData)
    setTeachers(tchData)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const res = await createClass(formData)
    setIsSubmitting(false)
    
    if (res.error) {
      alert(res.error)
    } else {
      setShowModal(false)
      setFormData({ name: "", description: "", waliKelasId: "" })
      loadData()
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kelas ${name} beserta seluruh datanya?`)) {
      const res = await deleteClass(id)
      if (res.error) alert(res.error)
      else loadData()
    }
  }

  // Open Manage Students Modal
  const openManageStudents = async (classId: string, className: string) => {
    setManageClassId(classId)
    setManageClassName(className)
    setManageSaving(true)
    const [students, unassigned, all] = await Promise.all([
      getClassStudents(classId),
      getStudentsWithoutClass(),
      getAllStudents()
    ])
    setClassStudentsList(students)
    setUnassignedStudents(unassigned)
    setAllStudents(all)
    setManageSaving(false)
  }

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd || !manageClassId) return
    setManageSaving(true)
    const res = await addStudentToClass(selectedStudentToAdd, manageClassId)
    if (res.error) {
      alert(res.error)
    }
    // Reload
    const [students, unassigned] = await Promise.all([
      getClassStudents(manageClassId),
      getStudentsWithoutClass()
    ])
    setClassStudentsList(students)
    setUnassignedStudents(unassigned)
    setSelectedStudentToAdd("")
    setManageSaving(false)
    loadData()
  }

  const handleRemoveStudent = async (userId: string) => {
    if (!manageClassId) return
    if (!confirm("Yakin keluarkan siswa dari kelas ini?")) return
    setManageSaving(true)
    await removeStudentFromClass(userId, manageClassId)
    const [students, unassigned] = await Promise.all([
      getClassStudents(manageClassId),
      getStudentsWithoutClass()
    ])
    setClassStudentsList(students)
    setUnassignedStudents(unassigned)
    setManageSaving(false)
    loadData()
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1 mb-2">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Master Rombel</h2>
            <p className="text-[11px] text-slate-500 font-medium">{classes.length} Kelas Terdaftar</p>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-500" />
            <span className="text-xs font-medium">Memuat data kelas...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic">Belum ada kelas yang terdaftar.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {classes.map((c) => {
              const wali = c.wali ? c.wali.name : "Belum Ditentukan"
              
              return (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Wali Kelas: <span className="text-slate-800">{wali}</span></p>
                      
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex">
                        <Users className="w-3 h-3" /> {c.students.length} Siswa
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openManageStudents(c.id, c.name)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                      title="Kelola Siswa"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="hidden sm:inline">Kelola</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Kelas Baru</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Kelas (Contoh: XII RPL 1)</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" placeholder="Masukkan nama kelas..." />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Deskripsi / Jurusan (Opsional)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition" placeholder="Contoh: Rekayasa Perangkat Lunak" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Wali Kelas</label>
                <select value={formData.waliKelasId} onChange={e => setFormData({...formData, waliKelasId: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition">
                  <option value="">-- Pilih Guru / Kosongkan --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1 italic">
                    Belum ada data Guru. Silakan tambahkan Guru terlebih dahulu di Manajemen Akun.
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {manageClassId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kelola Siswa — {manageClassName}</h3>
                <p className="text-[10px] text-slate-500">{classStudentsList.length} siswa terdaftar</p>
              </div>
              <button onClick={() => setManageClassId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add Student */}
            <div className="flex flex-col gap-2">
              <h4 className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                Tambah Siswa ke Kelas
              </h4>
              <div className="flex gap-2">
                <select
                  value={selectedStudentToAdd}
                  onChange={e => setSelectedStudentToAdd(e.target.value)}
                  className="flex-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {unassignedStudents.length > 0 ? (
                    <>
                      <optgroup label="Belum Punya Kelas">
                        {unassignedStudents.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} (@{s.username})</option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    <option disabled>Semua siswa sudah terdaftar di kelas</option>
                  )}
                </select>
                <button
                  onClick={handleAddStudent}
                  disabled={!selectedStudentToAdd || manageSaving}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Tambah
                </button>
              </div>
            </div>

            {/* Student List */}
            <div className="flex flex-col gap-2">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Daftar Siswa ({classStudentsList.length})
              </h4>
              
              {manageSaving ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto" />
                </div>
              ) : classStudentsList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl">
                  Belum ada siswa di kelas ini
                </div>
              ) : (
                classStudentsList.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{s.name}</span>
                      <span className="text-[10px] text-slate-500 block">@{s.username}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(s.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Keluarkan dari kelas"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
