"use client"

import React, { useState, useEffect } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Users,
  RotateCcw,
} from "lucide-react"
import {
  getViolationCategories,
  setViolationCategories,
  getViolationRecords,
  getViolationSummary,
  deleteViolation,
  type JenisPelanggaran,
} from "@/app/actions/kesiswaan"
import { updateViolationStatus } from "@/app/actions/teacher"

const STATUS = [
  { key: "OPEN", label: "Belum ditindak", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  { key: "FOLLOW_UP", label: "Sedang ditindak", cls: "bg-blue-50 text-blue-800 border-blue-200" },
  { key: "CLOSED", label: "Selesai", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
]

export default function AdminPelanggaranPage() {
  const [tab, setTab] = useState<"jenis" | "catatan" | "rekap">("jenis")
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState("")
  const [error, setError] = useState("")

  // Master jenis pelanggaran
  const [jenis, setJenis] = useState<JenisPelanggaran[]>([])
  const [savingJenis, setSavingJenis] = useState(false)

  // Catatan & rekap
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [busy, setBusy] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState<Record<string, string>>({})

  const load = async () => {
    const [j, r, s] = await Promise.all([
      getViolationCategories(),
      getViolationRecords(),
      getViolationSummary(),
    ])
    setJenis(j)
    setRecords(r)
    setSummary(s)
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const beriToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(""), 3500)
  }

  // ---------- Master jenis ----------
  const ubahJenis = (i: number, field: keyof JenisPelanggaran, nilai: string) => {
    setJenis((prev) =>
      prev.map((x, idx) =>
        idx === i
          ? { ...x, [field]: field === "poin" ? Number(nilai) : nilai }
          : x
      )
    )
  }

  const simpanJenis = async () => {
    setError("")
    setSavingJenis(true)
    const res = await setViolationCategories(jenis)
    setSavingJenis(false)

    if (res.error) {
      setError(res.error)
      return
    }
    beriToast(`${res.count} jenis pelanggaran disimpan.`)
    await load()
  }

  // ---------- Catatan ----------
  const ubahStatus = async (id: string, status: string) => {
    setError("")
    setBusy(id)
    const res = await updateViolationStatus({ id, status, followUp: followUp[id] })
    setBusy(null)

    if (res.error) {
      setError(res.error)
      return
    }
    beriToast("Status tindak lanjut diperbarui.")
    await load()
  }

  const hapus = async (id: string, nama: string) => {
    if (
      !confirm(
        `Hapus catatan pelanggaran ${nama}?\n\nPoinnya akan dikembalikan dan nilai karakter siswa naik kembali.`
      )
    )
      return

    setBusy(id)
    const res = await deleteViolation(id)
    setBusy(null)

    if (res.error) {
      setError(res.error)
      return
    }
    beriToast("Catatan dihapus.")
    await load()
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat data kesiswaan..." />
    )
  }

  const terfilter =
    statusFilter === "ALL"
      ? records
      : records.filter((r) => r.status === statusFilter)

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
            Kesiswaan & Catatan Pelanggaran
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {jenis.length} jenis • {records.length} catatan •{" "}
            {records.filter((r) => r.status === "OPEN").length} belum ditindak
          </p>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Tab */}
      <div className="flex gap-1.5">
        {([
          { key: "jenis", label: "Jenis & Poin", icon: ShieldAlert },
          { key: "catatan", label: "Catatan", icon: AlertOctagon },
          { key: "rekap", label: "Rekap Siswa", icon: Users },
        ] as const).map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-2 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                tab === t.key
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ---------- TAB: JENIS & POIN ---------- */}
      {tab === "jenis" && (
        <>
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
            <strong className="block mb-0.5">Dipakai di dua tempat sekaligus.</strong>
            Daftar ini menjadi pilihan saat guru mencatat pelanggaran, dan
            sekaligus daftar acuan yang dibaca siswa di menu Buku Disiplin.
            Sebelumnya keduanya ditulis terpisah di dalam kode dan bisa tidak
            sinkron.
            <br />
            <br />
            Mengubah poin di sini <strong>tidak</strong> mengubah catatan yang
            sudah terjadi — setiap catatan menyimpan poinnya sendiri saat
            dibuat, supaya riwayat siswa tidak berubah di belakang.
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="col-span-6">Jenis Pelanggaran</span>
              <span className="col-span-3">Kelompok</span>
              <span className="col-span-2">Poin</span>
              <span className="col-span-1"></span>
            </div>

            {jenis.map((j, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  value={j.nama}
                  onChange={(e) => ubahJenis(i, "nama", e.target.value)}
                  placeholder="Nama pelanggaran"
                  className="col-span-12 sm:col-span-6 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  value={j.kelompok || ""}
                  onChange={(e) => ubahJenis(i, "kelompok", e.target.value)}
                  placeholder="mis. Kedisiplinan"
                  className="col-span-7 sm:col-span-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={j.poin}
                  onChange={(e) => ubahJenis(i, "poin", e.target.value)}
                  className="col-span-3 sm:col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-center"
                />
                <button
                  onClick={() => setJenis((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={jenis.length <= 1}
                  title="Hapus jenis ini"
                  className="col-span-2 sm:col-span-1 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-30 justify-self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="flex gap-2 pt-2 border-t border-slate-100 mt-1">
              <button
                onClick={() =>
                  setJenis((prev) => [...prev, { nama: "", poin: 5, kelompok: "" }])
                }
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Jenis
              </button>
              <button
                onClick={simpanJenis}
                disabled={savingJenis}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {savingJenis ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{savingJenis ? "Menyimpan..." : "Simpan Daftar"}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---------- TAB: CATATAN ---------- */}
      {tab === "catatan" && (
        <>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[{ key: "ALL", label: "Semua" }, ...STATUS].map((s) => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                  statusFilter === s.key
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200/80"
                }`}
              >
                {s.label}
                {s.key !== "ALL" && (
                  <span className="ml-1 opacity-70">
                    ({records.filter((r) => r.status === s.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {terfilter.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center flex flex-col items-center gap-3">
              <AlertOctagon className="w-10 h-10 text-slate-300" />
              <p className="text-xs text-slate-500 max-w-xs">
                {records.length === 0
                  ? "Belum ada catatan pelanggaran. Guru mencatatnya dari dashboard guru."
                  : "Tidak ada catatan pada status ini."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {terfilter.map((r) => {
                const st = STATUS.find((x) => x.key === r.status) || STATUS[0]
                const kelas = r.student?.studentClasses?.[0]?.classInfo?.name
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {r.student?.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {kelas ? `${kelas} • ` : ""}@{r.student?.username}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-red-600">
                          −{r.points}
                        </span>
                        <span className="text-[9px] text-slate-400 block">poin</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2">
                      {r.description}
                      {r.category && (
                        <span className="text-slate-400"> · {r.category}</span>
                      )}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Dilaporkan {r.reporter?.name} •{" "}
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                    {r.followUp && (
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-2">
                        <strong>Tindak lanjut:</strong> {r.followUp}
                      </p>
                    )}

                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border self-start ${st.cls}`}
                      >
                        {st.label}
                      </span>

                      <input
                        value={followUp[r.id] ?? r.followUp ?? ""}
                        onChange={(e) =>
                          setFollowUp((p) => ({ ...p, [r.id]: e.target.value }))
                        }
                        placeholder="Catatan tindak lanjut (mis. sudah dipanggil wali)"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
                      />

                      <div className="flex gap-1.5">
                        {STATUS.filter((x) => x.key !== r.status).map((x) => (
                          <button
                            key={x.key}
                            onClick={() => ubahStatus(r.id, x.key)}
                            disabled={busy === r.id}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition disabled:opacity-50"
                          >
                            {busy === r.id ? "..." : `→ ${x.label}`}
                          </button>
                        ))}
                        <button
                          onClick={() => hapus(r.id, r.student?.name || "siswa ini")}
                          disabled={busy === r.id}
                          title="Hapus catatan (salah input)"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ---------- TAB: REKAP ---------- */}
      {tab === "rekap" && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-red-600" />
              Siswa dengan Poin Pelanggaran
            </h3>
            <button
              onClick={load}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Muat ulang"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {summary.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              Belum ada siswa dengan catatan pelanggaran.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="text-left py-2 pr-2 font-bold">Siswa</th>
                    <th className="text-left py-2 px-1 font-bold">Kelas</th>
                    <th className="py-2 px-1 font-bold">Catatan</th>
                    <th className="py-2 px-1 font-bold">Poin</th>
                    <th className="py-2 pl-1 font-bold">Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s) => (
                    <tr
                      key={s.student.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2 pr-2 font-semibold text-slate-800">
                        {s.student.name}
                      </td>
                      <td className="py-2 px-1 text-slate-500">{s.kelas || "—"}</td>
                      <td className="text-center py-2 px-1">{s.jumlahCatatan}</td>
                      <td className="text-center py-2 px-1 font-bold text-red-600">
                        −{s.totalPoin}
                      </td>
                      <td
                        className={`text-center py-2 pl-1 font-black ${
                          s.sisaPoin >= 90
                            ? "text-emerald-600"
                            : s.sisaPoin >= 75
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {s.sisaPoin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Sisa poin dihitung 100 dikurangi total poin pelanggaran — skala
                yang sama dengan yang dilihat siswa di menu Buku Disiplin.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
