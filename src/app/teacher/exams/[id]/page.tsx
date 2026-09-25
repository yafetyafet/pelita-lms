"use client"

import React, { useState, useEffect, use as useUnwrap } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  Shuffle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Users,
  ListChecks,
} from "lucide-react"
import { bacaRincian, ringkasPelanggaran } from "@/lib/logic/pengawas-ujian"
import { RekapHasilUjian } from "@/components/RekapHasilUjian"
import {
  getExamSubmissions,
  getHasilUjianPerRombel,
  updateExamSettings,
  saveEssayScore,
  recomputeExamScores,
} from "@/app/actions/teacher"
import { EditorSoal } from "@/components/EditorSoal"

/** Ubah Date/ISO ke nilai yang diterima <input type="datetime-local">. */
function toLocalInput(value: string | Date | null | undefined): string {
  if (!value) return ""
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export default function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 16: `params` adalah Promise, dibuka dengan React.use().
  const { id } = useUnwrap(params)

  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState("")
  const [error, setError] = useState("")

  // Form pengaturan
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [token, setToken] = useState("")
  const [duration, setDuration] = useState(60)
  const [shuffle, setShuffle] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [showResult, setShowResult] = useState(true)
  const [passingScore, setPassingScore] = useState<string>("")
  const [savingSettings, setSavingSettings] = useState(false)

  // Koreksi esai
  const [essayDraft, setEssayDraft] = useState<Record<string, string>>({})
  const [savingEssay, setSavingEssay] = useState<string | null>(null)
  const [openSub, setOpenSub] = useState<string | null>(null)
  // Rekap per rombel diambil terpisah dari daftar koreksi: keduanya menyusun
  // data yang berbeda dari ujian yang sama, dan rekap tetap harus utuh
  // meski daftar koreksinya sedang difilter.
  const [rekap, setRekap] = useState<any>(null)

  const load = async () => {
    const [res, hasil] = await Promise.all([
      getExamSubmissions(id),
      getHasilUjianPerRombel(id),
    ])
    setRekap(hasil)
    if (!res) {
      setError("Ujian tidak ditemukan atau kamu tidak berhak membukanya.")
      setIsLoading(false)
      return
    }
    setData(res)
    setStartAt(toLocalInput(res.exam.startAt))
    setEndAt(toLocalInput(res.exam.endAt))
    setToken(res.exam.token || "")
    setDuration(res.exam.duration)
    setShuffle(res.exam.shuffle)
    setIsPublished(res.exam.isPublished)
    setShowResult(res.exam.showResult)
    setPassingScore(
      res.exam.passingScore != null ? String(res.exam.passingScore) : ""
    )
    setIsLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const beriToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 3500)
  }

  const simpanPengaturan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSavingSettings(true)

    const res = await updateExamSettings({
      examId: id,
      startAt: startAt ? new Date(startAt).toISOString() : null,
      endAt: endAt ? new Date(endAt).toISOString() : null,
      token: token.trim() || null,
      duration,
      shuffle,
      isPublished,
      showResult,
      passingScore: passingScore === "" ? null : Number(passingScore),
    })

    setSavingSettings(false)
    if (res.error) {
      setError(res.error)
      return
    }
    beriToast("Pengaturan ujian disimpan.")
    await load()
  }

  const buatToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let out = "CBT-"
    for (let i = 0; i < 5; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setToken(out)
  }

  const simpanEsai = async (submissionId: string) => {
    setError("")
    const nilai = Number(essayDraft[submissionId])
    if (!Number.isFinite(nilai)) {
      setError("Isi nilai esai dengan angka.")
      return
    }

    setSavingEssay(submissionId)
    const res = await saveEssayScore({ submissionId, essayScore: nilai })
    setSavingEssay(null)

    if (res.error) {
      setError(res.error)
      return
    }
    beriToast(`Nilai akhir tersimpan: ${res.finalScore}`)
    await load()
  }

  const hitungUlang = async () => {
    if (
      !confirm(
        "Hitung ulang skor pilihan ganda semua peserta berdasarkan kunci jawaban saat ini?"
      )
    )
      return
    const res = await recomputeExamScores(id)
    if (res.error) {
      setError(res.error)
      return
    }
    beriToast(`${res.count ?? 0} pengerjaan dihitung ulang.`)
    await load()
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat data ujian..." />
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Link
          href="/teacher/exams"
          className="p-2 w-fit rounded-2xl bg-white border border-slate-200/80 text-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-xs text-slate-600">{error || "Data tidak tersedia."}</p>
        </div>
      </div>
    )
  }

  const soalEsai = data.questions.filter((q: any) => q.type === "ESAI")
  const peserta = data.submissions
  const selesai = peserta.filter(
    (s: any) => s.status === "FINISHED" || s.status === "GRADED"
  )
  const perluKoreksi = selesai.filter(
    (s: any) => soalEsai.length > 0 && s.essayScore == null
  )

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
          href="/teacher/exams"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
            {data.exam.title}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {(data.exam.kelas ?? [])
              .map((k: any) => k?.name)
              .filter(Boolean)
              .join(", ") || "Tanpa rombel"}{" "}
            • {data.exam.subject?.name} •{" "}
            {data.questions.length} soal
          </p>
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Peserta", value: peserta.length, icon: Users },
          { label: "Selesai", value: selesai.length, icon: CheckCircle2 },
          { label: "Perlu Koreksi", value: perluKoreksi.length, icon: AlertTriangle },
        ].map((k) => {
          const Icon = k.icon
          return (
            <div
              key={k.label}
              className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm"
            >
              <Icon className="w-4 h-4 text-slate-400 mb-1" />
              <div className="text-lg font-black text-slate-900 leading-none">
                {k.value}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                {k.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pengaturan */}
      <form
        onSubmit={simpanPengaturan}
        className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3"
      >
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-rose-600" />
          Jadwal, Token & Penerbitan
        </h3>

        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 leading-relaxed">
          Ujian hanya tampil ke siswa kalau <strong>diterbitkan</strong>. Jendela
          waktu dan durasi divalidasi di server, jadi siswa tidak bisa menambah
          waktu dengan menyegarkan halaman.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Dibuka
            </span>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Ditutup
            </span>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Durasi (menit)
            </span>
            <input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Nilai minimum lulus (opsional)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              placeholder="—"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Token khusus ujian ini
          </span>
          <div className="flex gap-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              placeholder="Kosongkan untuk memakai token global"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
            <button
              type="button"
              onClick={buatToken}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" /> Buat
            </button>
          </div>
        </label>

        <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
          {[
            {
              state: isPublished,
              set: setIsPublished,
              on: "Terbit — siswa dapat melihat ujian ini",
              off: "Draf — belum tampil ke siswa",
              icon: isPublished ? Eye : EyeOff,
            },
            {
              state: showResult,
              set: setShowResult,
              on: "Nilai ditampilkan ke siswa",
              off: "Nilai disembunyikan dari siswa",
              icon: showResult ? Eye : EyeOff,
            },
            {
              state: shuffle,
              set: setShuffle,
              on: "Urutan soal PG diacak per siswa",
              off: "Urutan soal sama untuk semua",
              icon: Shuffle,
            },
          ].map((row, i) => {
            const Icon = row.icon
            return (
              <button
                key={i}
                type="button"
                onClick={() => row.set(!row.state)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-[11px] font-semibold text-left transition ${
                  row.state
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{row.state ? row.on : row.off}</span>
                <span
                  className={`w-9 h-5 rounded-full relative transition shrink-0 ${
                    row.state ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      row.state ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={savingSettings}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {savingSettings ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{savingSettings ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </button>
          <button
            type="button"
            onClick={hitungUlang}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            title="Hitung ulang skor PG setelah kunci jawaban diperbaiki"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Hitung Ulang
          </button>
        </div>
      </form>

      {/* Sunting soal — sebelumnya soal hanya bisa dibuat sekali dan
          kesalahan ketik atau kunci jawaban keliru tidak bisa diperbaiki. */}
      <EditorSoal
        examId={id}
        soal={data.questions}
        adaPengerjaan={selesai.length}
        onBerubah={load}
      />

      {/* Rekap hasil per rombel + ekspor Excel.
          Ditaruh SEBELUM daftar koreksi karena inilah yang dicari guru
          setelah ujian selesai; daftar koreksi baru dipakai saat menilai
          esai satu per satu. */}
      {rekap && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              Rekap Hasil per Rombel
            </h3>
          </div>
          <RekapHasilUjian info={rekap.exam} rombel={rekap.rombel} />
        </div>
      )}

      {/* Peserta & koreksi */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-rose-600" />
            Peserta & Koreksi
          </h3>
          {soalEsai.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {soalEsai.length} soal esai • bobot {data.bobotEsai}
            </span>
          )}
        </div>

        {peserta.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            Belum ada siswa yang mengerjakan ujian ini.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {peserta.map((s: any) => {
              const isOpen = openSub === s.id
              const sudahSelesai =
                s.status === "FINISHED" || s.status === "GRADED"

              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenSub(isOpen ? null : s.id)}
                    className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between gap-2 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {s.user.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        @{s.user.username}
                        {s.rombel && (
                          <span className="font-semibold text-slate-600">
                            {" "}
                            • {s.rombel}
                          </span>
                        )}{" "}
                        •{" "}
                        {s.status === "ONGOING"
                          ? "sedang mengerjakan"
                          : s.status === "GRADED"
                            ? "sudah dinilai"
                            : "menunggu koreksi"}
                        {s.violationCount > 0 && (
                          <span className="text-red-600 font-bold">
                            {" "}
                            •{" "}
                            {ringkasPelanggaran(bacaRincian(s.violationDetail)) ||
                              `${s.violationCount}x pindah tab`}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900">
                        {s.finalScore ?? "—"}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        PG {s.score ?? 0}/{s.scoreMax ?? 0}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-3 flex flex-col gap-3 bg-white">
                      {s.violationCount > 0 && (
                        <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            {/* Bentuk pelanggaran ditulis apa adanya, tanpa
                                menyimpulkan siswa menyontek: notifikasi masuk
                                dan panggilan telepon juga memicu catatan ini.
                                Penilaiannya tetap pada guru. */}
                            Terdeteksi{" "}
                            {ringkasPelanggaran(bacaRincian(s.violationDetail)) ||
                              `${s.violationCount}x meninggalkan halaman ujian`}
                            . Perlu ditanyakan kepada siswa — catatan ini belum
                            tentu berarti menyontek.
                          </span>
                        </p>
                      )}

                      {/* Jawaban esai */}
                      {soalEsai.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {soalEsai.map((q: any, i: number) => (
                            <div
                              key={q.id}
                              className="p-3 rounded-2xl bg-slate-50 border border-slate-100"
                            >
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Esai {i + 1} • {q.points} poin
                              </p>
                              <p className="text-xs text-slate-800 mt-1 font-semibold">
                                {q.question}
                              </p>
                              <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap bg-white rounded-xl p-2.5 border border-slate-200">
                                {s.parsedAnswers?.[q.id] || (
                                  <span className="italic text-slate-400">
                                    Tidak dijawab
                                  </span>
                                )}
                              </p>
                            </div>
                          ))}

                          {sudahSelesai && (
                            <div className="flex gap-2 items-end">
                              <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Total nilai esai (0–{data.bobotEsai})
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={data.bobotEsai}
                                  value={
                                    essayDraft[s.id] ??
                                    (s.essayScore != null ? String(s.essayScore) : "")
                                  }
                                  onChange={(e) =>
                                    setEssayDraft((p) => ({
                                      ...p,
                                      [s.id]: e.target.value,
                                    }))
                                  }
                                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                />
                              </label>
                              <button
                                onClick={() => simpanEsai(s.id)}
                                disabled={savingEssay === s.id}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-60"
                              >
                                {savingEssay === s.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                Simpan
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">
                          Ujian ini hanya berisi pilihan ganda — nilai sudah final
                          secara otomatis.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
