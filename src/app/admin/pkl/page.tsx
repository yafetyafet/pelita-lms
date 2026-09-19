"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Building2,
  Save,
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Users,
  Crosshair,
} from "lucide-react"
import {
  getPartners,
  createPartner,
  deletePartner,
  getDudiAccounts,
  getPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
} from "@/app/actions/pkl"
import { getAllStudents, getTeachers } from "@/app/actions/admin"

export default function AdminPklPage() {
  const [partners, setPartners] = useState<any[]>([])
  const [placements, setPlacements] = useState<any[]>([])
  const [mentors, setMentors] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [saving, setSaving] = useState(false)

  const [tab, setTab] = useState<"mitra" | "penempatan">("mitra")
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [showPlacementForm, setShowPlacementForm] = useState(false)

  const [pf, setPf] = useState({
    name: "",
    address: "",
    contact: "",
    phone: "",
    lat: "",
    lng: "",
    radius: "150",
    mentorId: "",
  })

  const [plf, setPlf] = useState({
    studentId: "",
    partnerId: "",
    supervisorId: "",
    startDate: "",
    endDate: "",
  })

  const load = async () => {
    const [p, pl, m, s, t] = await Promise.all([
      getPartners(),
      getPlacements(),
      getDudiAccounts(),
      getAllStudents(),
      getTeachers(),
    ])
    setPartners(p)
    setPlacements(pl)
    setMentors(m)
    setStudents(s)
    setTeachers(t)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const beriToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(""), 3500)
  }

  const ambilLokasi = () => {
    if (!navigator.geolocation) {
      setError("Browser ini tidak mendukung layanan lokasi.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPf((p) => ({
          ...p,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
        }))
        beriToast("Koordinat lokasi saat ini diisikan.")
      },
      (err) => setError("Gagal mendapatkan lokasi: " + err.message),
      { enableHighAccuracy: true }
    )
  }

  const simpanMitra = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    const res = await createPartner({
      name: pf.name,
      address: pf.address,
      contact: pf.contact,
      phone: pf.phone,
      lat: pf.lat ? Number(pf.lat) : undefined,
      lng: pf.lng ? Number(pf.lng) : undefined,
      radius: pf.radius ? Number(pf.radius) : undefined,
      mentorId: pf.mentorId || undefined,
    })
    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setPf({
      name: "",
      address: "",
      contact: "",
      phone: "",
      lat: "",
      lng: "",
      radius: "150",
      mentorId: "",
    })
    setShowPartnerForm(false)
    beriToast("Mitra industri ditambahkan.")
    await load()
  }

  const simpanPenempatan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    const res = await createPlacement({
      studentId: plf.studentId,
      partnerId: plf.partnerId,
      supervisorId: plf.supervisorId || undefined,
      startDate: plf.startDate,
      endDate: plf.endDate,
    })
    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setPlf({
      studentId: "",
      partnerId: "",
      supervisorId: "",
      startDate: "",
      endDate: "",
    })
    setShowPlacementForm(false)
    beriToast("Siswa ditempatkan ke mitra industri.")
    await load()
  }

  const hapusMitra = async (id: string, name: string) => {
    if (
      !confirm(
        `Hapus mitra "${name}"? Seluruh penempatan, jurnal, dan presensi PKL di mitra ini juga terhapus.`
      )
    )
      return
    const res = await deletePartner(id)
    if (res.error) setError(res.error)
    else await load()
  }

  const hapusPenempatan = async (id: string, nama: string) => {
    if (!confirm(`Hapus penempatan PKL ${nama}? Jurnal & presensinya ikut terhapus.`))
      return
    const res = await deletePlacement(id)
    if (res.error) setError(res.error)
    else await load()
  }

  const ubahStatus = async (id: string, status: string) => {
    const res = await updatePlacement({ id, status })
    if (res.error) setError(res.error)
    else {
      beriToast("Status penempatan diperbarui.")
      await load()
    }
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat data PKL..." />
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href="/admin"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            PKL / Prakerin
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {partners.length} mitra • {placements.length} penempatan
          </p>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 text-purple-900 text-[11px] leading-relaxed">
        Dashboard mitra DUDI membaca data di halaman ini. Agar akun DUDI melihat
        siswa bimbingannya, tetapkan <strong>pembimbing industri</strong> pada
        mitra, lalu tempatkan siswa ke mitra tersebut.
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Tab */}
      <div className="flex gap-1.5">
        {(["mitra", "penempatan"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition ${
              tab === t
                ? "bg-purple-700 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200/80"
            }`}
          >
            {t === "mitra" ? "Mitra Industri" : "Penempatan Siswa"}
          </button>
        ))}
      </div>

      {tab === "mitra" ? (
        <>
          <button
            onClick={() => setShowPartnerForm(!showPartnerForm)}
            className="py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
          >
            {showPartnerForm ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>{showPartnerForm ? "Tutup Form" : "Tambah Mitra Industri"}</span>
          </button>

          {showPartnerForm && (
            <form
              onSubmit={simpanMitra}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2"
            >
              <input
                value={pf.name}
                onChange={(e) => setPf({ ...pf, name: e.target.value })}
                placeholder="Nama perusahaan / industri *"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
              <textarea
                value={pf.address}
                onChange={(e) => setPf({ ...pf, address: e.target.value })}
                rows={2}
                placeholder="Alamat"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-y"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={pf.contact}
                  onChange={(e) => setPf({ ...pf, contact: e.target.value })}
                  placeholder="Nama kontak"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  value={pf.phone}
                  onChange={(e) => setPf({ ...pf, phone: e.target.value })}
                  placeholder="No. telepon"
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Akun pembimbing industri (role DUDI)
                </span>
                <select
                  value={pf.mentorId}
                  onChange={(e) => setPf({ ...pf, mentorId: e.target.value })}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">— Belum ditentukan —</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (@{m.username})
                    </option>
                  ))}
                </select>
                {mentors.length === 0 && (
                  <span className="text-[10px] text-amber-700">
                    Belum ada akun ber-role DUDI. Buat dulu di Manajemen Akun.
                  </span>
                )}
              </label>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Geofence presensi PKL
                  </span>
                  <button
                    type="button"
                    onClick={ambilLokasi}
                    className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3" /> Ambil lokasi saya
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={pf.lat}
                    onChange={(e) => setPf({ ...pf, lat: e.target.value })}
                    placeholder="Latitude"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    value={pf.lng}
                    onChange={(e) => setPf({ ...pf, lng: e.target.value })}
                    placeholder="Longitude"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <input
                    value={pf.radius}
                    onChange={(e) => setPf({ ...pf, radius: e.target.value })}
                    placeholder="Radius (m)"
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Kalau koordinat dibiarkan kosong, presensi PKL tetap tercatat tapi
                  tanpa validasi lokasi.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60 mt-1"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? "Menyimpan..." : "Simpan Mitra"}</span>
              </button>
            </form>
          )}

          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-purple-600" />
              Daftar Mitra ({partners.length})
            </h3>

            {partners.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400 italic">
                Belum ada mitra industri terdaftar.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {partners.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                      {p.address && (
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-start gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                          {p.address}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          {p._count.placements} penempatan
                        </span>
                        {p.mentor ? (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                            Pembimbing: {p.mentor.name}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            TANPA PEMBIMBING
                          </span>
                        )}
                        {p.lat == null && (
                          <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            TANPA GEOFENCE
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => hapusMitra(p.id, p.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setShowPlacementForm(!showPlacementForm)}
            disabled={partners.length === 0}
            className="py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            {showPlacementForm ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>
              {partners.length === 0
                ? "Tambahkan mitra industri dulu"
                : showPlacementForm
                  ? "Tutup Form"
                  : "Tempatkan Siswa"}
            </span>
          </button>

          {showPlacementForm && (
            <form
              onSubmit={simpanPenempatan}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2"
            >
              <select
                value={plf.studentId}
                onChange={(e) => setPlf({ ...plf, studentId: e.target.value })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              >
                <option value="">— Pilih siswa —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.studentClasses?.[0]?.classInfo?.name
                      ? ` (${s.studentClasses[0].classInfo.name})`
                      : ""}
                  </option>
                ))}
              </select>

              <select
                value={plf.partnerId}
                onChange={(e) => setPlf({ ...plf, partnerId: e.target.value })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              >
                <option value="">— Pilih mitra industri —</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={plf.supervisorId}
                onChange={(e) => setPlf({ ...plf, supervisorId: e.target.value })}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">— Guru pembimbing sekolah (opsional) —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mulai
                  </span>
                  <input
                    type="date"
                    value={plf.startDate}
                    onChange={(e) => setPlf({ ...plf, startDate: e.target.value })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Selesai
                  </span>
                  <input
                    type="date"
                    value={plf.endDate}
                    onChange={(e) => setPlf({ ...plf, endDate: e.target.value })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60 mt-1"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? "Menyimpan..." : "Simpan Penempatan"}</span>
              </button>
            </form>
          )}

          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              Penempatan ({placements.length})
            </h3>

            {placements.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400 italic">
                Belum ada siswa yang ditempatkan PKL.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {placements.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900">
                          {pl.student.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {pl.partner.name}
                          {pl.supervisor?.name && ` • Pembimbing ${pl.supervisor.name}`}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(pl.startDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                          {" – "}
                          {new Date(pl.endDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" • "}
                          {pl._count.journals} jurnal, {pl._count.attendances} presensi
                        </p>
                      </div>

                      <button
                        onClick={() => hapusPenempatan(pl.id, pl.student.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <select
                      value={pl.status}
                      onChange={(e) => ubahStatus(pl.id, e.target.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border self-start ${
                        pl.status === "ACTIVE"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : pl.status === "COMPLETED"
                            ? "bg-blue-50 border-blue-200 text-blue-800"
                            : "bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="COMPLETED">Selesai</option>
                      <option value="CANCELLED">Dibatalkan</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
