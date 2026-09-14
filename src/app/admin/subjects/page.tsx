"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, BookMarked, Loader2 } from "lucide-react"
import { getSubjects, createSubject, deleteSubject } from "@/app/actions/admin"

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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

  const handleDelete = async (id: string, name: string) => {
    if (confirm(\Apakah Anda yakin ingin menghapus mapel \?\)) {
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Master Mapel</h2>
            <p className="text-[11px] text-slate-500 font-medium">{subjects.length} Mapel Terdaftar</p>
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
            {subjects.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{s.name}</h4>
                    {s.description && (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.description}</p>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDelete(s.id, s.name)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  title="Hapus Mapel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
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
