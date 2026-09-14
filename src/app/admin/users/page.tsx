"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, UserPlus, Trash2, Shield, User, Loader2 } from "lucide-react"
import { getUsers, createUser, deleteUser } from "@/app/actions/admin"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "STUDENT"
  })

  const loadUsers = async () => {
    setIsLoading(true)
    const data = await getUsers()
    setUsers(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const res = await createUser(formData)
    setIsSubmitting(false)
    
    if (res.error) {
      alert(res.error)
    } else {
      setShowModal(false)
      setFormData({ name: "", username: "", password: "", role: "STUDENT" })
      loadUsers()
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${name}?`)) {
      const res = await deleteUser(id)
      if (res.error) alert(res.error)
      else loadUsers()
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
            <h2 className="text-base font-bold text-slate-900 leading-tight">Manajemen Akun</h2>
            <p className="text-[11px] text-slate-500 font-medium">{users.length} Terdaftar</p>
          </div>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-500" />
            <span className="text-xs font-medium">Memuat data...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic">Belum ada data.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                    {u.role === "ADMIN" ? <Shield className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{u.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      @{u.username} � <span className={`font-bold ${u.role === 'ADMIN' ? 'text-purple-600' : u.role === 'TEACHER' ? 'text-emerald-600' : 'text-blue-600'}`}>{u.role}</span>
                    </p>
                  </div>
                </div>
                
                {u.username !== 'admin' && (
                  <button 
                    onClick={() => handleDelete(u.id, u.name)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Pengguna</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Contoh: Fajar Pratama" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Username (Untuk Login)</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Contoh: fajar_p" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" placeholder="Minimal 6 karakter" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Role (Peran)</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition">
                  <option value="STUDENT">Siswa</option>
                  <option value="TEACHER">Guru</option>
                  <option value="DUDI">Mitra DUDI</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
