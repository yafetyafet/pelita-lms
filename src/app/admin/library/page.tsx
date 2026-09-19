"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  BookMarked,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  DownloadCloud,
} from "lucide-react"
import {
  getLibraryBooksAdmin,
  createLibraryBook,
  deleteLibraryBook,
} from "@/app/actions/admin"

const KATEGORI = [
  "Umum",
  "Kejuruan",
  "Matematika",
  "Bahasa",
  "IPA",
  "IPS",
  "Agama",
  "Fiksi",
  "Referensi",
]

export default function AdminLibraryPage() {
  const [books, setBooks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  const [form, setForm] = useState({
    title: "",
    author: "",
    category: KATEGORI[0],
    publisher: "",
    year: "",
    isbn: "",
    pages: "",
    fileUrl: "",
    description: "",
  })

  const load = async () => {
    setBooks(await getLibraryBooksAdmin())
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    const res = await createLibraryBook({
      title: form.title,
      author: form.author,
      category: form.category,
      publisher: form.publisher,
      year: form.year ? Number(form.year) : undefined,
      isbn: form.isbn,
      pages: form.pages,
      fileUrl: form.fileUrl,
      description: form.description,
    })
    setSaving(false)

    if (res.error) {
      setError(res.error)
      return
    }

    setForm({
      title: "",
      author: "",
      category: KATEGORI[0],
      publisher: "",
      year: "",
      isbn: "",
      pages: "",
      fileUrl: "",
      description: "",
    })
    setShowForm(false)
    setToast("Buku ditambahkan ke perpustakaan.")
    setTimeout(() => setToast(""), 3500)
    await load()
  }

  const hapus = async (id: string, title: string) => {
    if (!confirm(`Hapus buku "${title}" dari perpustakaan?`)) return
    const res = await deleteLibraryBook(id)
    if (res.error) {
      setError(res.error)
      return
    }
    await load()
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat perpustakaan..." />
    )
  }

  const totalUnduhan = books.reduce((n, b) => n + (b.downloads || 0), 0)

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Perpustakaan Digital
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {books.length} buku • {totalUnduhan} unduhan
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showForm ? "Tutup" : "Tambah Buku"}</span>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-blue-800 text-[11px] leading-relaxed">
        Menu perpustakaan pada aplikasi siswa membaca daftar ini. Selama daftar
        kosong, halaman perpustakaan siswa juga akan kosong.
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {showForm && (
        <form
          onSubmit={simpan}
          className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2"
        >
          <h3 className="text-xs font-bold text-slate-900 mb-1">Buku Baru</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Judul buku *"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:col-span-2"
              required
            />
            <input
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Penulis *"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              required
            />
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              {KATEGORI.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <input
              value={form.publisher}
              onChange={(e) => set("publisher", e.target.value)}
              placeholder="Penerbit"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <input
              type="number"
              value={form.year}
              onChange={(e) => set("year", e.target.value)}
              placeholder="Tahun"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <input
              value={form.isbn}
              onChange={(e) => set("isbn", e.target.value)}
              placeholder="ISBN"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <input
              value={form.pages}
              onChange={(e) => set("pages", e.target.value)}
              placeholder="Jumlah halaman"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <input
              value={form.fileUrl}
              onChange={(e) => set("fileUrl", e.target.value)}
              placeholder="Tautan berkas PDF (Drive/Storage)"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y sm:col-span-2"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60 mt-1"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Menyimpan..." : "Simpan Buku"}</span>
          </button>
        </form>
      )}

      {/* Daftar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <BookMarked className="w-4 h-4 text-blue-600" />
          Koleksi ({books.length})
        </h3>

        {books.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic flex flex-col items-center gap-2">
            <BookMarked className="w-8 h-8 text-slate-300" />
            <span>Belum ada buku. Klik &quot;Tambah Buku&quot; untuk mengisi.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {books.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {b.author}
                    {b.publisher && ` • ${b.publisher}`}
                    {b.year && ` • ${b.year}`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      {b.category}
                    </span>
                    <span className="text-[9px] text-slate-500 flex items-center gap-1">
                      <DownloadCloud className="w-2.5 h-2.5" />
                      {b.downloads} unduhan
                    </span>
                    {!b.fileUrl && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        TANPA BERKAS
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => hapus(b.id, b.title)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0"
                  title="Hapus buku"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
