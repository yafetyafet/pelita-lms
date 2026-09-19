"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Timer,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Lock,
  Loader2,
  ListChecks,
  Flag,
} from "lucide-react"
import { getStudentExams, getExamPaper, submitExam } from "@/app/actions/student"

/**
 * Simpanan jawaban sementara di perangkat siswa.
 *
 * Sebelumnya jawaban hanya hidup di state React sampai tombol "Kumpulkan"
 * ditekan — HP mati, browser ter-refresh, atau tab tertutup berarti seluruh
 * jawaban hilang, sementara waktu ujian terus berjalan karena `startedAt`
 * sudah tercatat di server.
 *
 * Kuncinya memakai id pengerjaan (unik per siswa per ujian), bukan id ujian
 * saja, supaya jawaban tidak tertukar bila satu perangkat dipakai bergantian.
 *
 * Batasannya: hanya menolong di perangkat & peramban yang sama. Pindah HP atau
 * membersihkan data situs tetap menghapus simpanan ini.
 */
type Simpanan = {
  answers: Record<string, string>
  doubtful: Record<string, boolean>
  tabSwitch: number
  disimpan: number
}

const kunciSimpanan = (submissionId: string) => `pelita:ujian:${submissionId}`

function bacaSimpanan(submissionId: string): Simpanan | null {
  try {
    const raw = localStorage.getItem(kunciSimpanan(submissionId))
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p || typeof p !== "object") return null
    return {
      answers: p.answers ?? {},
      doubtful: p.doubtful ?? {},
      tabSwitch: Number(p.tabSwitch) || 0,
      disimpan: Number(p.disimpan) || 0,
    }
  } catch {
    // Mode penyamaran atau penyimpanan penuh — jangan sampai menggagalkan ujian.
    return null
  }
}

function tulisSimpanan(submissionId: string, data: Simpanan) {
  try {
    localStorage.setItem(kunciSimpanan(submissionId), JSON.stringify(data))
  } catch {
    /* diabaikan: simpanan lokal hanyalah jaring pengaman */
  }
}

function hapusSimpanan(submissionId: string) {
  try {
    localStorage.removeItem(kunciSimpanan(submissionId))
  } catch {
    /* diabaikan */
  }
}

type Soal = {
  id: string
  question: string
  imageUrl: string | null
  type: "PG" | "PG_KOMPLEKS" | "ESAI"
  points: number
  options: string[] | null
}

export default function ExamsCBTPage() {
  const [examList, setExamList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Ujian yang dipilih dari daftar (sebelumnya selalu dipaksa yang pertama).
  const [selected, setSelected] = useState<any | null>(null)
  const [examToken, setExamToken] = useState("")
  const [tokenError, setTokenError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  // Ruang ujian
  const [paper, setPaper] = useState<{ title: string; type: string } | null>(null)
  const [questions, setQuestions] = useState<Soal[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [doubtful, setDoubtful] = useState<Record<string, boolean>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [hasil, setHasil] = useState<{
    score: number | null
    scoreMax: number | null
    menungguKoreksi: boolean
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tabSwitch, setTabSwitch] = useState(0)
  const [submissionId, setSubmissionId] = useState("")
  const [dipulihkan, setDipulihkan] = useState(false)

  // Dipakai handler timer/submit agar tidak menangkap state kedaluwarsa.
  const submitLock = useRef(false)
  const answersRef = useRef(answers)
  answersRef.current = answers
  const tabSwitchRef = useRef(tabSwitch)
  tabSwitchRef.current = tabSwitch

  const loadList = async () => {
    const data = await getStudentExams()
    setExamList(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadList()
  }, [])

  const inExamRoom = paper !== null && !isFinished

  const handleFinishExam = useCallback(
    async (otomatis = false) => {
      if (!selected || submitLock.current) return
      submitLock.current = true
      setIsSubmitting(true)

      const res = await submitExam(
        selected.id,
        JSON.stringify(answersRef.current),
        tabSwitchRef.current
      )

      setIsSubmitting(false)
      if (res.error && !otomatis) {
        setTokenError(res.error)
        submitLock.current = false
        return
      }

      // Jawaban sudah aman di server; simpanan lokal tidak diperlukan lagi.
      if (submissionId) hapusSimpanan(submissionId)

      setHasil({
        score: res.score ?? null,
        scoreMax: res.scoreMax ?? null,
        menungguKoreksi: res.menungguKoreksi ?? false,
      })
      setIsFinished(true)
      await loadList()
    },
    [selected, submissionId]
  )

  // Tulis simpanan lokal setiap ada perubahan jawaban, keraguan, atau
  // hitungan perpindahan tab. Operasinya sinkron dan ringan, jadi aman
  // dilakukan pada setiap perubahan tanpa perlu penjadwalan.
  useEffect(() => {
    if (!submissionId || !paper || isFinished) return
    tulisSimpanan(submissionId, {
      answers,
      doubtful,
      tabSwitch,
      disimpan: Date.now(),
    })
  }, [submissionId, paper, isFinished, answers, doubtful, tabSwitch])

  // Cegah siswa menutup tab tanpa sadar saat ujian berlangsung.
  useEffect(() => {
    if (!inExamRoom) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [inExamRoom])

  // Deteksi perpindahan tab; jumlahnya dikirim ke server saat pengumpulan
  // supaya pengawas punya catatan, bukan hanya peringatan di layar.
  useEffect(() => {
    if (!inExamRoom) return
    const onVisibility = () => {
      if (document.hidden) setTabSwitch((n) => n + 1)
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [inExamRoom])

  // Hitung mundur. Nilai awalnya berasal dari server (`sisaDetik`), jadi
  // menyegarkan halaman tidak mengembalikan waktu.
  useEffect(() => {
    if (!inExamRoom) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinishExam(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [inExamRoom, handleFinishExam])

  const formatTimer = (total: number) => {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => n.toString().padStart(2, "0")
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
  }

  const mulaiUjian = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return

    setIsVerifying(true)
    setTokenError("")

    const res = await getExamPaper(selected.id, examToken.trim().toUpperCase())
    setIsVerifying(false)

    if (res.error || !res.success) {
      setTokenError(res.error || "Gagal membuka ujian.")
      return
    }

    const sid = res.submissionId || ""
    setSubmissionId(sid)
    setQuestions((res.questions as Soal[]) || [])
    setPaper({ title: res.exam?.title || selected.title, type: res.exam?.type || "PG" })
    setTimeLeft(res.sisaDetik || 0)
    setCurrentIdx(0)

    // Pulihkan pekerjaan sebelumnya bila ujian ini pernah dibuka di perangkat
    // yang sama. Sisa waktu TIDAK ikut dipulihkan — nilainya selalu dari
    // server, supaya menyegarkan halaman tidak menambah waktu.
    const simpan = sid ? bacaSimpanan(sid) : null
    if (simpan && Object.keys(simpan.answers).length > 0) {
      setAnswers(simpan.answers)
      setDoubtful(simpan.doubtful)
      setTabSwitch(simpan.tabSwitch)
      setDipulihkan(true)
    } else {
      setAnswers({})
      setDoubtful({})
      setTabSwitch(0)
      setDipulihkan(false)
    }

    setIsFinished(false)
    setHasil(null)
    submitLock.current = false
  }

  const keluarRuang = () => {
    setPaper(null)
    setQuestions([])
    setSelected(null)
    setExamToken("")
    setIsFinished(false)
    setHasil(null)
    submitLock.current = false
  }

  if (isLoading) {
    return (
      <PemuatData pesan="Memuat Jadwal Ujian CBT..." />
    )
  }

  // ---------- Layar hasil ----------
  if (isFinished && hasil) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Ujian Terkumpul</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Jawaban kamu sudah tersimpan di server.
            </p>
          </div>

          {hasil.score !== null && hasil.scoreMax !== null && (
            <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">
                Skor Pilihan Ganda
              </span>
              <span className="text-2xl font-black text-emerald-600">
                {hasil.score}
                <span className="text-base text-slate-400 font-bold">
                  {" "}
                  / {hasil.scoreMax}
                </span>
              </span>
            </div>
          )}

          {hasil.menungguKoreksi && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Ada soal esai pada ujian ini. Nilai akhir muncul setelah guru selesai
              mengoreksi.
            </p>
          )}

          {hasil.score === null && !hasil.menungguKoreksi && (
            <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              Guru memilih untuk tidak menampilkan hasil ujian ini.
            </p>
          )}

          <button
            onClick={keluarRuang}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition"
          >
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    )
  }

  // ---------- Ruang ujian ----------
  if (paper) {
    const q = questions[currentIdx]
    const terjawab = Object.keys(answers).filter((k) => answers[k] !== "").length

    return (
      <div className="flex flex-col gap-3 p-4 pb-24">
        {/* Bilah waktu */}
        <div className="sticky top-0 z-30 -mx-4 -mt-4 px-4 py-3 bg-white/95 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-900 truncate">{paper.title}</h2>
            <p className="text-[10px] text-slate-500">
              {terjawab} dari {questions.length} soal terjawab
            </p>
          </div>
          <span
            className={`shrink-0 px-3 py-1.5 rounded-xl font-black font-mono text-sm flex items-center gap-1.5 ${
              timeLeft < 300
                ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                : "bg-slate-900 text-emerald-300"
            }`}
          >
            <Timer className="w-4 h-4" />
            {formatTimer(timeLeft)}
          </span>
        </div>

        {dipulihkan && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>
              Jawaban sebelumnya dipulihkan dari perangkat ini. Periksa kembali
              sebelum mengumpulkan — sisa waktu tetap dihitung dari server.
            </span>
          </div>
        )}

        {tabSwitch > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Terdeteksi {tabSwitch}x meninggalkan halaman ujian. Catatan ini
              dilaporkan ke pengawas bersama jawabanmu.
            </span>
          </div>
        )}

        {/* Navigasi nomor soal */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <ListChecks className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Navigasi Soal
            </span>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {questions.map((s, i) => {
              const sudah = Boolean(String(answers[s.id] || "").trim())
              const ragu = doubtful[s.id]
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`aspect-square rounded-lg text-[11px] font-bold transition ${
                    i === currentIdx
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : ragu
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : sudah
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Soal */}
        {q && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                Soal {currentIdx + 1} •{" "}
                {q.type === "ESAI"
                  ? "Esai"
                  : q.type === "PG_KOMPLEKS"
                    ? "Pilihan Ganda Kompleks"
                    : "Pilihan Ganda"}{" "}
                • {q.points} poin
              </span>
              <button
                onClick={() =>
                  setDoubtful((p) => ({ ...p, [q.id]: !p[q.id] }))
                }
                className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition ${
                  doubtful[q.id]
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Flag className="w-3 h-3" />
                {doubtful[q.id] ? "Ditandai" : "Ragu-ragu"}
              </button>
            </div>

            <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
              {q.question}
            </p>

            {q.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={q.imageUrl}
                alt="Gambar soal"
                className="rounded-2xl border border-slate-200 max-h-64 object-contain self-center"
              />
            )}

            {q.type === "ESAI" ? (
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, [q.id]: e.target.value }))
                }
                rows={6}
                placeholder="Tulis jawabanmu di sini..."
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs resize-y"
              />
            ) : (
              <div className="flex flex-col gap-2">
                {q.type === "PG_KOMPLEKS" && (
                  <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Jawaban benar lebih dari satu. Pilih semua yang benar —
                    dinilai utuh, jadi tidak boleh ada yang terlewat atau keliru.
                  </p>
                )}

                {(q.options || []).map((opt, i) => {
                  const huruf = String.fromCharCode(65 + i)
                  // Kunci jawaban disimpan guru sebagai INDEKS ("0".."4"),
                  // bukan huruf — jawaban harus dikirim dalam format yang sama
                  // agar koreksiOtomatis() cocok dengan ujian yang sudah ada.
                  // Untuk PG kompleks, beberapa indeks dipisah koma ("0,2").
                  const nilai = String(i)
                  const terpilih = String(answers[q.id] || "")
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                  const dipilih = terpilih.includes(nilai)

                  const pilih = () => {
                    if (q.type !== "PG_KOMPLEKS") {
                      setAnswers((p) => ({ ...p, [q.id]: nilai }))
                      return
                    }
                    const set = new Set(terpilih)
                    if (set.has(nilai)) set.delete(nilai)
                    else set.add(nilai)
                    setAnswers((p) => ({
                      ...p,
                      [q.id]: Array.from(set).sort((a, b) => Number(a) - Number(b)).join(","),
                    }))
                  }

                  return (
                    <button
                      key={i}
                      onClick={pilih}
                      className={`text-left px-3 py-2.5 rounded-2xl border text-xs flex items-start gap-2.5 transition ${
                        dipilih
                          ? "bg-blue-50 border-blue-500 ring-1 ring-blue-300"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 shrink-0 flex items-center justify-center font-bold text-[11px] ${
                          q.type === "PG_KOMPLEKS" ? "rounded-md border-2" : "rounded-lg"
                        } ${
                          dipilih
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        {huruf}
                      </span>
                      <span className="text-slate-800 leading-relaxed pt-0.5">
                        {opt}
                      </span>
                    </button>
                  )
                })}
                {(!q.options || q.options.length === 0) && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Pilihan jawaban soal ini belum diisi guru. Laporkan ke pengawas.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigasi bawah */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
              }
              className="flex-1 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1"
            >
              Berikutnya <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleFinishExam(false)}
              disabled={isSubmitting}
              className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {isSubmitting ? "Mengirim..." : "Kumpulkan Jawaban"}
            </button>
          )}
        </div>

        {tokenError && (
          <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {tokenError}
          </p>
        )}
      </div>
    )
  }

  // ---------- Layar token ----------
  if (selected) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={() => {
              setSelected(null)
              setTokenError("")
              setExamToken("")
            }}
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Masuk Ruang Ujian
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {selected.subject?.name} • {selected.jumlahSoal} soal •{" "}
              {selected.duration} menit
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-800 via-indigo-900 to-slate-950 rounded-3xl p-5 text-white shadow-xl">
          <h3 className="text-sm font-bold">{selected.title}</h3>
          {selected.description && (
            <p className="text-[11px] text-purple-200/90 mt-1 leading-relaxed">
              {selected.description}
            </p>
          )}
        </div>

        <form
          onSubmit={mulaiUjian}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Token Ujian</h3>
              <p className="text-[10px] text-slate-500">
                Minta token kepada pengawas ruang.
              </p>
            </div>
          </div>

          <input
            value={examToken}
            onChange={(e) => setExamToken(e.target.value.toUpperCase())}
            placeholder="CBT-XXXXX"
            autoComplete="off"
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-lg font-black font-mono tracking-widest uppercase"
            required
          />

          {tokenError && (
            <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{tokenError}</span>
            </p>
          )}

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Selama ujian, setiap kali kamu meninggalkan halaman ini akan tercatat
              dan dilaporkan ke pengawas. Waktu pengerjaan dihitung di server, jadi
              menutup aplikasi tidak menghentikan hitungan.
              <br />
              <br />
              Jawabanmu disimpan sementara di perangkat ini, jadi kalau halaman
              tertutup atau ter-refresh kamu bisa masuk lagi dan melanjutkan.
              Namun jangan berganti HP di tengah ujian — simpanan itu tidak ikut
              berpindah.
            </span>
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isVerifying ? "Memverifikasi..." : "Mulai Kerjakan"}</span>
          </button>
        </form>
      </div>
    )
  }

  // ---------- Daftar ujian ----------
  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href="/student"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Ujian CBT Resmi
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            {examList.length} ujian terbit untuk kelasmu
          </p>
        </div>
      </div>

      {examList.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3">
          <Award className="w-12 h-12 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Ujian Aktif</h3>
          <p className="text-xs text-slate-500 max-w-xs">
            Tidak ada jadwal ujian CBT yang sudah diterbitkan untuk kelas Anda saat
            ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {examList.map((ex) => {
            const sub = ex.mySubmission
            const selesai = sub?.status === "FINISHED" || sub?.status === "GRADED"
            const boleh = ex.kelayakan?.boleh

            return (
              <div
                key={ex.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                      {ex.subject?.name || "Umum"}
                    </span>
                    <h3 className="font-bold text-slate-900 mt-1.5 text-sm leading-snug">
                      {ex.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {ex.jumlahSoal} soal • {ex.duration} menit
                    </p>
                  </div>

                  {selesai && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">Nilai</span>
                      <span className="text-base font-black text-emerald-600">
                        {sub.finalScore ?? sub.score ?? "—"}
                      </span>
                    </div>
                  )}
                </div>

                {(ex.startAt || ex.endAt) && (
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {ex.startAt
                      ? new Date(ex.startAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                    {" → "}
                    {ex.endAt
                      ? new Date(ex.endAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                )}

                {boleh ? (
                  <button
                    onClick={() => {
                      setSelected(ex)
                      setExamToken("")
                      setTokenError("")
                    }}
                    className="py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition"
                  >
                    {sub?.status === "ONGOING" ? "Lanjutkan Ujian" : "Kerjakan Ujian"}
                  </button>
                ) : (
                  <p
                    className={`text-[11px] font-semibold rounded-xl px-3 py-2 border ${
                      selesai
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-slate-600 bg-slate-50 border-slate-200"
                    }`}
                  >
                    {ex.kelayakan?.pesan || "Ujian belum dapat dikerjakan."}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
