"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, BookMarked, Loader2, Users, ChevronDown, ChevronUp, UserMinus, AlertTriangle } from "lucide-react"
import {
  getSubjects,
  createSubject,
  deleteSubject,
  removeTeacherFromClass
} from "@/app/actions/admin"

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Mapel yang daftar pengampunya sedang dibuka.
  const [openId, setOpenId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState("")
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  const loadData = async () => {
    setIsLoading(true)
    const data = await getSubjects()
    setSubjects(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const res = await createSubject(formData)
    setIsSubmitting(false)
    
    if (res.error) {
      alert(res.error)
    } else {
      setShowModal(false)
      setFormData({ name: "", description: "" })
      loadData()
    }
  }

  /**
   * Admin melepas pengampu. Guru menetapkan sendiri penugasannya dari akun
   * guru, jadi ini murni untuk merapikan kekeliruan — misal guru mengambil
   * rombel yang bukan kelasnya.
   */
  const handleRemovePengampu = async (
    userId: string,
    classId: string,
    subjectId: string,
    label: string
  ) => {
    if (!confirm(`Lepas ${label}?\n\nGuru tersebut akan kehilangan akses menilai dan mengabsen rombel itu.`)) return

    const key = `${userId}|${classId}|${subjectId}`
    setRemoving(key)
    setError("")
    const res = await removeTeacherFromClass(userId, classId, subjectId)
    setRemoving(null)

    if (res.error) {
      setError(res.error)
      return
    }
    loadData()
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus mapel ${name}?`)) {
      const res = await deleteSubject(id)
      if (res.error) alert(res.error)
      else loadData()
    }
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Master Mapel & Pengampu</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {subjects.length} mapel •{" "}
              {subjects.reduce((n: number, x: any) => n + (x.teachers?.length || 0), 0)} penugasan pengampu
            </p>
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

      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
        <strong className="block mb-0.5">Pengampu ditentukan oleh guru sendiri.</strong>
        Tiap guru memilih rombel dan mapel yang diampunya dari menu{" "}
        <strong>Kelas → Atur Mapel</strong> pada akunnya, dan langsung berlaku.
        Halaman ini untuk memantau hasilnya dan melepas penugasan yang keliru.
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Subjects List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-500" />
            <span className="text-xs font-medium">Memuat data mapel...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic">Belum ada mata pelajaran yang terdaftar.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {subjects.map((s) => {
              const pengampu = s.teachers || []
              const terbuka = openId === s.id

              return (
                <div key={s.id} className="hover:bg-slate-50/60 transition">
                  <div className="p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                        {s.description && (
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.description}</p>
                        )}
                        <button
                          onClick={() => setOpenId(terbuka ? null : s.id)}
                          className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 transition ${
                            pengampu.length > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <Users className="w-2.5 h-2.5" />
                          {pengampu.length > 0
                            ? `${pengampu.length} pengampu`
                            : "Belum ada pengampu"}
                          {terbuka ? (
                            <ChevronUp className="w-2.5 h-2.5" />
                          ) : (
                            <ChevronDown className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0"
                      title="Hapus Mapel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {terbuka && (
                    <div className="px-4 pb-4 -mt-1">
                      {pengampu.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                          Belum ada guru yang mengambil mapel ini. Guru menambahkannya
                          sendiri dari menu Kelas → Atur Mapel di akun guru.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {pengampu.map((t: any) => {
                            const key = `${t.user.id}|${t.classInfo.id}|${s.id}`
                            const label = `${t.user.name} — ${s.name} di ${t.classInfo.name}`
                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100"
                              >
                                <div className="min-w-0">
                                  <span className="text-[11px] font-bold text-slate-800">
                                    {t.user.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {" "}• {t.classInfo.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemovePengampu(t.user.id, t.classInfo.id, s.id, label)
                                  }
                                  disabled={removing === key}
                                  title="Lepas penugasan ini"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 disabled:opacity-50"
                                >
                                  {removing === key ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UserMinus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Mapel Baru</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Mata Pelajaran</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Contoh: Pemrograman Web" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Tipe / Kategori (Opsional)</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Contoh: Muatan Kejuruan" />
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan Mapel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
