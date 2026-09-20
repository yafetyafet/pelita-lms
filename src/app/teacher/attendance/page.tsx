"use client"

import React, { useState, useEffect, useCallback } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CalendarDays,
  Users,
  ClipboardCheck,
  BarChart3,
} from "lucide-react"
import {
  getPenugasanSaya,
  getAttendanceSheet,
  saveManualAttendance,
  getAttendanceRecap,
} from "@/app/actions/teacher"

const STATUS = [
  { key: "hadir", label: "H", nama: "Hadir", cls: "bg-emerald-600" },
  { key: "terlambat", label: "T", nama: "Terlambat", cls: "bg-amber-500" },
  { key: "sakit", label: "S", nama: "Sakit", cls: "bg-blue-600" },
  { key: "izin", label: "I", nama: "Izin", cls: "bg-indigo-600" },
  { key: "alfa", label: "A", nama: "Alfa", cls: "bg-red-600" },
] as const

/** Tanggal hari ini menurut WIB, untuk nilai awal <input type="date">. */
function hariIniWIB(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export default function TeacherAttendancePage() {
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [pilihan, setPilihan] = useState("") // "classId|subjectId"
  const [perMapel, setPerMapel] = useState(false)
  const [dateKey, setDateKey] = useState(hariIniWIB())

  const [rows, setRows] = useState<any[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  const [mode, setMode] = useState<"input" | "rekap">("input")
  const [recapFrom, setRecapFrom] = useState(hariIniWIB().slice(0, 8) + "01")
  const [recapTo, setRecapTo] = useState(hariIniWIB())
  const [recapRows, setRecapRows] = useState<any[]>([])
  const [memuatRekap, setMemuatRekap] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [memuatLembar, setMemuatLembar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")

  const [classId, subjectId] = pilihan ? pilihan.split("|") : ["", ""]

  useEffect(() => {
    async function load() {
      const cls = await getPenugasanSaya()
      setTeacherClasses(cls)
      if (cls.length > 0) {
        setPilihan(`${cls[0].classId}|${cls[0].subjectId}`)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const muatLembar = useCallback(async () => {
    if (!classId) return
    setMemuatLembar(true)
    setError("")

    const res = await getAttendanceSheet({
      classId,
      dateKey,
      // Presensi harian dipakai untuk rekap kehadiran sekolah; presensi per
      // mapel untuk kehadiran di jam pelajaran tertentu.
      subjectId: perMapel ? subjectId : null,
    })

    setRows(res.rows)
    setDraft(
      Object.fromEntries(
        res.rows.filter((r: any) => r.status).map((r: any) => [r.student.id, r.status])
      )
    )
    setNotes(
      Object.fromEntries(
        res.rows.filter((r: any) => r.note).map((r: any) => [r.student.id, r.note])
      )
    )
    setMemuatLembar(false)
  }, [classId, subjectId, dateKey, perMapel])

  useEffect(() => {
    muatLembar()
  }, [muatLembar])

  const muatRekap = useCallback(async () => {
    if (!classId) return
    setMemuatRekap(true)
    const res = await getAttendanceRecap({
      classId,
      from: recapFrom,
      to: recapTo,
      subjectId: perMapel ? subjectId : null,
    })
    setRecapRows(res.rows)
    setMemuatRekap(false)
  }, [classId, subjectId, recapFrom, recapTo, perMapel])

  useEffect(() => {
    if (mode === "rekap") muatRekap()
  }, [mode, muatRekap])

  const setSemua = (status: string) => {
    setDraft(Object.fromEntries(rows.map((r) => [r.student.id, status])))
  }

  const simpan = async () => {
    const entries = Object.entries(draft)
      .filter(([, status]) => status)
      .map(([userId, status]) => ({
        userId,
        status,
        note: notes[userId] || undefined,
      }))

    if (entries.length === 0) {
      setError("Belum ada status presensi yang dipilih.")
      return
    }

    setSaving(true)
    setError("")
    const res = await saveManualAttendance({
      classId,
      dateKey,
      subjectId: perMapel ? subjectId : null,
      entries,
    })
    setSaving(false)

    if (res.error) {
      setError(res.error)
      return
    }

    setToast(`${res.count ?? entries.length} presensi tersimpan.`)
    setTimeout(() => setToast(""), 3500)
    await muatLembar()
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat kelas..." />
    )
  }

  const rekap = STATUS.map((s) => ({
    ...s,
    jumlah: Object.values(draft).filter((v) => v === s.key).length,
  }))

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href="/teacher"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Presensi Kelas
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Input kehadiran manual: hadir, sakit, izin, alfa
          </p>
        </div>
      </div>

      {teacherClasses.length > 0 && (
        <div className="flex gap-1.5">
          {([
            { key: "input", label: "Input Presensi", icon: ClipboardCheck },
            { key: "rekap", label: "Rekap Kehadiran", icon: BarChart3 },
          ] as const).map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setMode(t.key)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === t.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      )}

      {teacherClasses.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center flex flex-col items-center gap-3">
          <Users className="w-10 h-10 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Penugasan</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Admin belum menugaskan Anda ke kelas dan mata pelajaran mana pun, jadi
            belum ada kelas yang bisa diabsen.
          </p>
        </div>
      ) : (
        <>
          {/* Pemilih */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Kelas & Mata Pelajaran
              </span>
              <select
                value={pilihan}
                onChange={(e) => setPilihan(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                {teacherClasses.map((tc) => (
                  <option
                    key={`${tc.classId}|${tc.subjectId}`}
                    value={`${tc.classId}|${tc.subjectId}`}
                  >
                    {tc.classInfo.name} — {tc.subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tanggal
              </span>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </label>

            <button
              onClick={() => setPerMapel(!perMapel)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[11px] font-semibold text-left transition ${
                perMapel
                  ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" />
              <span className="flex-1">
                {perMapel
                  ? "Presensi per mata pelajaran (jam pelajaran ini)"
                  : "Presensi harian sekolah"}
              </span>
              <span
                className={`w-9 h-5 rounded-full relative transition shrink-0 ${
                  perMapel ? "bg-indigo-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    perMapel ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

          {mode === "rekap" ? (
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Dari tanggal
                  </span>
                  <input
                    type="date"
                    value={recapFrom}
                    onChange={(e) => setRecapFrom(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Sampai tanggal
                  </span>
                  <input
                    type="date"
                    value={recapTo}
                    onChange={(e) => setRecapTo(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </label>
              </div>

              {memuatRekap ? (
                <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Menghitung rekap...</span>
                </div>
              ) : recapRows.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  Belum ada data presensi pada rentang ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="text-left py-2 pr-2 font-bold">Siswa</th>
                        {STATUS.map((st) => (
                          <th key={st.key} className="py-2 px-1 font-bold" title={st.nama}>
                            {st.label}
                          </th>
                        ))}
                        <th className="py-2 pl-1 font-bold">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recapRows.map((r) => {
                        const efektif = r.hadir + r.terlambat
                        const persen =
                          r.total > 0 ? Math.round((efektif / r.total) * 100) : 0
                        return (
                          <tr
                            key={r.student.id}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="py-2 pr-2">
                              <span className="font-semibold text-slate-800">
                                {r.student.name}
                              </span>
                            </td>
                            <td className="text-center py-2 px-1">{r.hadir}</td>
                            <td className="text-center py-2 px-1">{r.terlambat}</td>
                            <td className="text-center py-2 px-1">{r.sakit}</td>
                            <td className="text-center py-2 px-1">{r.izin}</td>
                            <td className="text-center py-2 px-1">{r.alfa}</td>
                            <td
                              className={`text-center py-2 pl-1 font-black ${
                                persen >= 80
                                  ? "text-emerald-600"
                                  : persen >= 60
                                    ? "text-amber-600"
                                    : "text-red-600"
                              }`}
                            >
                              {r.total > 0 ? `${persen}%` : "—"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-slate-400 mt-2">
                    H = hadir, T = terlambat, S = sakit, I = izin, A = alfa.
                    Persentase dihitung dari hadir + terlambat terhadap total
                    pertemuan tercatat.
                  </p>
                </div>
              )}
            </div>
          ) : (
          <>
          {/* Rekap + aksi massal */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900">
                {rows.length} Siswa
              </h3>
              <button
                onClick={() => setSemua("hadir")}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
              >
                Tandai Semua Hadir
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {rekap.map((s) => (
                <div
                  key={s.key}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center"
                >
                  <div className="text-sm font-black text-slate-900 leading-none">
                    {s.jumlah}
                  </div>
                  <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                    {s.nama}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          {/* Lembar presensi */}
          {memuatLembar ? (
            <PemuatData pesan="Memuat lembar presensi..." />
          ) : rows.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                Belum ada siswa di rombel ini. Tambahkan siswa lewat menu admin.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rows.map((r) => {
                const aktif = draft[r.student.id]
                return (
                  <div
                    key={r.student.id}
                    className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {r.student.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          @{r.student.username}
                        </p>
                      </div>

                      {/* Bedakan presensi mandiri GPS dari input guru. */}
                      {r.mandiri && (
                        <span
                          className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0"
                          title={
                            r.distance != null
                              ? `Presensi mandiri, ${r.distance} m dari titik sekolah`
                              : "Presensi mandiri siswa"
                          }
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          GPS
                          {r.distance != null && ` ${r.distance}m`}
                        </span>
                      )}
                      {!r.mandiri && r.recordedBy && (
                        <span className="text-[9px] text-slate-400 shrink-0">
                          oleh {r.recordedBy}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1.5">
                      {STATUS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() =>
                            setDraft((p) => ({ ...p, [r.student.id]: s.key }))
                          }
                          title={s.nama}
                          className={`flex-1 py-2 rounded-lg text-[11px] font-black transition ${
                            aktif === s.key
                              ? `${s.cls} text-white`
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {(aktif === "sakit" || aktif === "izin") && (
                      <input
                        value={notes[r.student.id] || ""}
                        onChange={(e) =>
                          setNotes((p) => ({ ...p, [r.student.id]: e.target.value }))
                        }
                        placeholder="Keterangan (mis. surat dokter, izin keluarga)"
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {rows.length > 0 && (
            <button
              onClick={simpan}
              disabled={saving}
              className="sticky bottom-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? "Menyimpan..." : "Simpan Presensi"}</span>
            </button>
          )}
          </>
          )}
        </>
      )}
    </div>
  )
}
