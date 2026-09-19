"use client"

import React, { useState, useEffect, useMemo } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import { getCurrentUser } from "@/app/actions/auth"
import {
  getTeacherClasses,
  getTeacherSchedules,
  getJamPelajaran,
  createScheduleFromSessions,
  deleteSchedule,
} from "@/app/actions/teacher"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  Loader2,
  Coffee,
  Info,
  AlertTriangle,
} from "lucide-react"

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

/** Jam pelajaran yang bukan waktu mengajar — tampil sebagai pembatas. */
const isJeda = (tipe: string) => tipe === "Istirahat"

export default function TeacherScheduleInputPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [scheduleList, setScheduleList] = useState<any[]>([])
  const [sesi, setSesi] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [day, setDay] = useState("Senin")
  const [dipilih, setDipilih] = useState<string[]>([])
  const [targetClassId, setTargetClassId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [room, setRoom] = useState("")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")
  const [error, setError] = useState("")

  const muatUlang = async () => setScheduleList(await getTeacherSchedules())

  useEffect(() => {
    async function load() {
      const [user, cls, scheds, jam] = await Promise.all([
        getCurrentUser(),
        getTeacherClasses(),
        getTeacherSchedules(),
        getJamPelajaran(),
      ])
      setCurrentUser(user)
      setTeacherClasses(cls)
      setScheduleList(scheds)
      setSesi(jam)
      if (cls.length > 0) {
        setTargetClassId(cls[0].classId)
        setSubjectId(cls[0].subjectId)
      }
      // Mulai dari hari yang benar-benar punya jam pelajaran, supaya guru
      // tidak membuka halaman ini dan langsung melihat daftar kosong.
      const hariTerisi = HARI.find((h: string) => jam.some((x: any) => x.day === h))
      if (hariTerisi) setDay(hariTerisi)
      setIsLoading(false)
    }
    load()
  }, [])

  const sesiHariIni = useMemo(
    () => sesi.filter((s: any) => s.day === day),
    [sesi, day]
  )

  // Jam pelajaran yang sudah terpakai oleh jadwal guru ini di hari yang sama.
  // Ditandai agar guru tahu sebelum menekan simpan, bukan setelah ditolak.
  const sudahTerpakai = useMemo(() => {
    const set = new Set<string>()
    for (const j of scheduleList) {
      if (j.day !== day) continue
      for (const s of sesiHariIni) {
        if (s.startTime >= j.sessionStart && s.endTime <= j.sessionEnd) set.add(s.id)
      }
    }
    return set
  }, [scheduleList, sesiHariIni, day])

  const gantiHari = (h: string) => {
    setDay(h)
    setDipilih([])
    setError("")
  }

  const toggleSesi = (id: string) => {
    setError("")
    setDipilih((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  // Rentang jam dari sesi yang dicentang, untuk pratinjau sebelum disimpan.
  const terpilihUrut = useMemo(
    () => sesiHariIni.filter((s: any) => dipilih.includes(s.id)),
    [sesiHariIni, dipilih]
  )
  const rentang =
    terpilihUrut.length > 0
      ? `${terpilihUrut[0].startTime} - ${terpilihUrut[terpilihUrut.length - 1].endTime}`
      : ""

  const handlePenugasanChange = (nilai: string) => {
    const [classId, subjectIdBaru] = nilai.split("|")
    setTargetClassId(classId || "")
    setSubjectId(subjectIdBaru || "")
  }

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!targetClassId) {
      setError("Pilih kelas dan mapel dulu.")
      return
    }
    if (dipilih.length === 0) {
      setError("Pilih minimal satu jam pelajaran.")
      return
    }

    setSaving(true)
    const res = await createScheduleFromSessions({
      sessionIds: terpilihUrut.map((s: any) => s.id),
      classId: targetClassId,
      subjectId: subjectId || undefined,
      room: room || undefined,
    })
    setSaving(false)

    if (res.error) {
      setError(res.error)
      return
    }

    setDipilih([])
    setToast(`Jadwal ${day} ${res.mulai}-${res.selesai} tersimpan.`)
    setTimeout(() => setToast(""), 3500)
    await muatUlang()
  }

  const handleHapus = async (j: any) => {
    if (!confirm(`Hapus jadwal ${j.day} ${j.sessionStart}-${j.sessionEnd}?`)) return
    const res = await deleteSchedule(j.id)
    if (res.error) {
      setError(res.error)
      return
    }
    await muatUlang()
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat jadwal..." />
    )
  }

  const perHari = HARI.map((h) => ({
    hari: h,
    isi: scheduleList.filter((j: any) => j.day === h),
  })).filter((g) => g.isi.length > 0)

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href="/teacher"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Jadwal Mengajar
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {currentUser?.name || "Guru"}
          </p>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* ---------------- Pemilih sesi ---------------- */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-md flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-600" />
          Ambil Jam Mengajar
        </h3>

        <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 leading-relaxed flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Jam pelajaran ditetapkan admin — pilih saja sesi yang tersedia.
            Untuk mapel 2 jam atau lebih, centang beberapa sesi{" "}
            <strong>berurutan</strong> sekaligus.
          </span>
        </p>

        {/* Hari */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {HARI.map((h) => {
            const ada = sesi.some((s: any) => s.day === h)
            return (
              <button
                key={h}
                type="button"
                onClick={() => gantiHari(h)}
                disabled={!ada}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition border ${
                  day === h
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : ada
                      ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                }`}
                title={ada ? "" : `Admin belum menetapkan jam pelajaran hari ${h}`}
              >
                {h}
              </button>
            )
          })}
        </div>

        {/* Daftar sesi hari terpilih */}
        {sesiHariIni.length === 0 ? (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 leading-relaxed">
            Admin belum menetapkan jam pelajaran untuk hari {day}. Minta admin
            mengisinya lewat menu <strong>Sesi / Jam Pelajaran</strong> dulu.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {sesiHariIni.map((s: any) => {
              const jeda = isJeda(s.type)
              const terpakai = sudahTerpakai.has(s.id)
              const aktif = dipilih.includes(s.id)

              if (jeda) {
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-slate-400 italic"
                  >
                    <Coffee className="w-3 h-3 shrink-0" />
                    <span>
                      {s.name} · {s.startTime}-{s.endTime}
                    </span>
                  </div>
                )
              }

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => !terpakai && toggleSesi(s.id)}
                  disabled={terpakai}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition ${
                    terpakai
                      ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                      : aktif
                        ? "bg-emerald-50 border-emerald-400"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                      aktif
                        ? "bg-emerald-600 border-emerald-600"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    {aktif && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-900 block">
                      {s.name}
                      {s.type !== "Reguler" && (
                        <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          {s.type}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {s.startTime} - {s.endTime} WIB
                    </span>
                  </span>
                  {terpakai && (
                    <span className="text-[9px] font-bold text-slate-500 shrink-0">
                      sudah diambil
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Kelas, mapel, ruang */}
        <form onSubmit={handleSimpan} className="flex flex-col gap-2.5 text-xs">
          {teacherClasses.length === 0 ? (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 leading-relaxed">
              Kamu belum mengampu kelas mana pun. Pilih mapel dan kelas yang kamu
              ampu di menu <strong>Kelas Saya</strong> dulu.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px]">
                  Kelas &amp; Mapel
                </label>
                <select
                  value={targetClassId && subjectId ? `${targetClassId}|${subjectId}` : ""}
                  onChange={(e) => handlePenugasanChange(e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                >
                  <option value="">Pilih Kelas &amp; Mapel</option>
                  {teacherClasses.map((tc: any) => (
                    <option
                      key={`${tc.classId}|${tc.subjectId}`}
                      value={`${tc.classId}|${tc.subjectId}`}
                    >
                      {tc.classInfo.name} — {tc.subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 text-[11px]">Ruang</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Lab Komputer 2"
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
                />
              </div>
            </div>
          )}

          {dipilih.length > 0 && (
            <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              {dipilih.length} jam pelajaran dipilih · {day} {rentang} WIB
            </p>
          )}

          <button
            type="submit"
            disabled={saving || dipilih.length === 0 || teacherClasses.length === 0}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Menyimpan..." : "Ambil Jam Ini"}</span>
          </button>
        </form>
      </div>

      {/* ---------------- Jadwal tersimpan ---------------- */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Jadwal Mengajar Anda ({scheduleList.length})
        </h3>

        {scheduleList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            Belum ada jadwal. Pilih jam pelajaran di atas.
          </div>
        ) : (
          perHari.map((g) => (
            <div key={g.hari} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {g.hari}
              </span>
              {g.isi.map((j: any) => (
                <div
                  key={j.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">
                        {j.classInfo?.name}
                      </span>
                      {j.sesiLabel && (
                        <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                          {j.sesiLabel}
                        </span>
                      )}
                      {j.room && (
                        <span className="text-[10px] text-slate-500">{j.room}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 mt-1 leading-snug text-xs">
                      {j.subject?.name || j.label || "Tidak ada mapel"}
                    </h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {j.sessionStart} - {j.sessionEnd} WIB
                      {j.jumlahJam > 1 && ` · ${j.jumlahJam} jam pelajaran`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleHapus(j)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0"
                    title="Hapus jadwal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
