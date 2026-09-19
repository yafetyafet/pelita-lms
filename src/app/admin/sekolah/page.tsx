"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building2,
  UserCog,
  Image as ImageIcon,
} from "lucide-react"
import {
  getSchoolProfile,
  setSchoolProfile,
  type ProfilSekolah,
} from "@/app/actions/sekolah"
import { KopSurat, BlokTandaTangan } from "@/components/cetak/KopSurat"

export default function AdminSekolahPage() {
  const [form, setForm] = useState<ProfilSekolah | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  useEffect(() => {
    getSchoolProfile().then((p) => {
      setForm(p)
      setIsLoading(false)
    })
  }, [])

  const set = (k: keyof ProfilSekolah, v: string) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev))

  const simpan = async () => {
    if (!form) return
    setError("")
    setSaving(true)
    const res = await setSchoolProfile(form)
    setSaving(false)

    if (res.error) {
      setError(res.error)
      return
    }
    setToast("Identitas sekolah disimpan.")
    setTimeout(() => setToast(""), 3500)
  }

  if (isLoading || !form) {
    return (
      <PemuatData pesan="Memuat identitas sekolah..." />
    )
  }

  const Field = ({
    k,
    label,
    placeholder,
    area,
  }: {
    k: keyof ProfilSekolah
    label: string
    placeholder?: string
    area?: boolean
  }) => (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      {area ? (
        <textarea
          rows={2}
          value={form[k]}
          onChange={(e) => set(k, e.target.value)}
          placeholder={placeholder}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y"
        />
      ) : (
        <input
          value={form[k]}
          onChange={(e) => set(k, e.target.value)}
          placeholder={placeholder}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        />
      )}
    </label>
  )

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href="/admin"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Identitas Sekolah
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Kop surat & tanda tangan pada laporan cetak guru
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
        Data di sini dipakai sebagai <strong>kop surat</strong> dan{" "}
        <strong>blok tanda tangan</strong> pada laporan yang dicetak guru —
        jurnal pembelajaran, daftar nilai, dan rekap kehadiran. Bagian yang
        dikosongkan akan tercetak sebagai titik-titik.
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Identitas */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-blue-600" />
          Identitas Lembaga
        </h3>

        <Field
          k="namaYayasan"
          label="Baris atas kop"
          placeholder="Contoh: PEMERINTAH PROVINSI JAWA TENGAH"
        />
        <Field k="namaSekolah" label="Nama sekolah *" placeholder="SMK NEGERI 1 ..." />
        <Field k="npsn" label="NPSN" placeholder="Contoh: 20303xxx" />
        <Field
          k="alamat"
          label="Alamat lengkap"
          placeholder="Jalan, desa, kecamatan, kabupaten, kode pos"
          area
        />

        <div className="grid grid-cols-2 gap-2">
          <Field k="telepon" label="Telepon" placeholder="(0281) ..." />
          <Field k="email" label="Email" placeholder="smkn1@..." />
        </div>
        <Field k="website" label="Website" placeholder="www..." />

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Tautan logo sekolah
          </span>
          <input
            value={form.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
            placeholder="https://... (png/jpg, latar transparan lebih baik)"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
          <span className="text-[10px] text-slate-500 leading-relaxed">
            Harus berupa tautan yang bisa dibuka publik — unggah dulu ke Drive
            atau layanan gambar. Unggah berkas langsung belum didukung.
          </span>
        </label>
      </div>

      {/* Kepala sekolah & periode */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <UserCog className="w-4 h-4 text-blue-600" />
          Kepala Sekolah & Periode
        </h3>

        <Field
          k="kepalaSekolah"
          label="Nama kepala sekolah"
          placeholder="Lengkap dengan gelar"
        />
        <Field k="nipKepalaSekolah" label="NIP kepala sekolah" placeholder="1985..." />
        <Field
          k="kotaTandaTangan"
          label="Kota pada tanda tangan"
          placeholder="Contoh: Purbalingga"
        />

        <div className="grid grid-cols-2 gap-2">
          <Field k="tahunAjaran" label="Tahun ajaran" placeholder="2026/2027" />
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Semester
            </span>
            <select
              value={form.semester}
              onChange={(e) => set("semester", e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </label>
        </div>
      </div>

      <button
        onClick={simpan}
        disabled={saving}
        className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span>{saving ? "Menyimpan..." : "Simpan Identitas Sekolah"}</span>
      </button>

      {/* Pratinjau langsung */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900">Pratinjau Kop & Tanda Tangan</h3>
        <div className="border border-slate-200 rounded-xl p-4 bg-white text-black overflow-x-auto">
          <div className="min-w-[500px]">
            <KopSurat profil={form} />
            <p className="text-[11px] italic text-slate-500 text-center py-6">
              — isi laporan tampil di sini —
            </p>
            <BlokTandaTangan
              profil={form}
              namaGuru="Nama Guru Pengampu"
              nipGuru="19xxxxxxxxxxxxxxxx"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
