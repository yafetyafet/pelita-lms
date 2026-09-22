"use client"

import React, { useState } from "react"
import {
  Loader2,
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  ListChecks,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  updateExamQuestion,
  addExamQuestion,
  deleteExamQuestion,
} from "@/app/actions/teacher"
import { KolomGambar } from "@/components/KolomGambar"

/**
 * Penyunting soal untuk ujian yang sudah dibuat.
 *
 * Sebelumnya soal hanya bisa dibuat sekali dan tidak pernah bisa diubah — salah
 * ketik atau kunci jawaban keliru berarti ujian harus dihapus lalu dibuat ulang
 * dari nol beserta seluruh soalnya.
 */

type Soal = {
  id: string
  question: string
  imageUrl: string | null
  type: string
  options: string | null
  correctAnswer: string | null
  points: number
}

function parseOpsi(raw: string | null): string[] {
  if (!raw) return ["", "", "", "", ""]
  try {
    const p = JSON.parse(raw)
    if (Array.isArray(p)) return p.map((x) => String(x))
  } catch {
    /* format lama atau rusak — jatuh ke opsi kosong di bawah */
  }
  return ["", "", "", "", ""]
}

/**
 * Buang opsi kosong sebelum menyimpan, lalu geser kunci jawaban mengikuti
 * indeks barunya. Tanpa ini, opsi yang dibiarkan kosong ikut tersimpan dan
 * muncul sebagai pilihan kosong di perangkat siswa.
 */
function rapikan(options: string[], kunci: string, tipe?: string) {
  if (tipe === "BENAR_SALAH") {
    // Kunci Benar/Salah posisional ("B,S,B"): pernyataan kosong dibuang
    // BERSAMA nilai kunci di posisi yang sama, supaya tidak bergeser.
    const nilai = String(kunci || "").split(",").map((x) => x.trim().toUpperCase())
    const bersih: string[] = []
    const kunciBaru: string[] = []
    options.forEach((o, i) => {
      if (o.trim()) {
        bersih.push(o.trim())
        kunciBaru.push(nilai[i] === "S" ? "S" : "B")
      }
    })
    return { options: bersih, correctAnswer: kunciBaru.join(",") }
  }

  const petaBaru = new Map<number, number>()
  const bersih: string[] = []
  options.forEach((o, i) => {
    if (o.trim()) {
      petaBaru.set(i, bersih.length)
      bersih.push(o.trim())
    }
  })
  const kunciBaru = String(kunci || "")
    .split(",")
    .map((x) => petaBaru.get(Number(x.trim())))
    .filter((x): x is number => x !== undefined)
    .sort((a, b) => a - b)
    .join(",")
  return { options: bersih, correctAnswer: kunciBaru }
}

const kunciAktif = (kunci: string, i: number) =>
  String(kunci || "")
    .split(",")
    .map((x) => x.trim())
    .includes(String(i))

export function EditorSoal({
  soal,
  examId,
  adaPengerjaan,
  onBerubah,
}: {
  soal: Soal[]
  examId: string
  adaPengerjaan: number
  onBerubah: () => void | Promise<void>
}) {
  const [bukaId, setBukaId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, any>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [pesan, setPesan] = useState("")
  const [tambahBuka, setTambahBuka] = useState(false)

  const [baru, setBaru] = useState({
    question: "",
    imageUrl: "",
    type: "PG",
    options: ["", "", "", "", ""],
    correctAnswer: "0",
    points: 10,
  })

  const ambil = (q: Soal) =>
    draft[q.id] ?? {
      question: q.question,
      imageUrl: q.imageUrl ?? "",
      type: q.type,
      options: parseOpsi(q.options),
      correctAnswer: q.correctAnswer ?? "",
      points: q.points,
    }

  const ubah = (id: string, patch: any) =>
    setDraft((p) => ({ ...p, [id]: { ...ambil(soal.find((x) => x.id === id)!), ...p[id], ...patch } }))

  const toggleKunci = (id: string, i: number, kompleks: boolean) => {
    const d = draft[id] ?? ambil(soal.find((x) => x.id === id)!)
    if (!kompleks) {
      ubah(id, { correctAnswer: String(i) })
      return
    }
    const set = new Set(
      String(d.correctAnswer || "").split(",").map((x: string) => x.trim()).filter(Boolean)
    )
    const k = String(i)
    if (set.has(k)) set.delete(k)
    else set.add(k)
    ubah(id, {
      correctAnswer: Array.from(set).sort((a, b) => Number(a) - Number(b)).join(","),
    })
  }

  const simpan = async (q: Soal) => {
    const d = ambil(q)
    setError("")
    setPesan("")
    setBusy(q.id)

    const bersih = d.type === "ESAI" ? null : rapikan(d.options, d.correctAnswer, d.type)
    if (bersih && !bersih.correctAnswer) {
      setBusy(null)
      setError("Kunci jawaban belum dipilih (atau menunjuk opsi yang kosong).")
      return
    }

    const res = await updateExamQuestion({
      questionId: q.id,
      question: d.question,
      imageUrl: d.imageUrl,
      type: d.type,
      options: bersih?.options,
      correctAnswer: bersih?.correctAnswer,
      points: Number(d.points),
    })
    setBusy(null)

    if (res.error) {
      setError(res.error)
      return
    }

    setDraft((p) => {
      const n = { ...p }
      delete n[q.id]
      return n
    })
    setPesan(
      res.adaPengerjaan
        ? `Soal tersimpan. ${res.adaPengerjaan} siswa sudah mengerjakan ujian ini — jalankan "Hitung Ulang" di atas agar nilainya memakai kunci yang baru.`
        : "Soal tersimpan."
    )
    await onBerubah()
  }

  const hapus = async (q: Soal, no: number) => {
    if (!confirm(`Hapus soal nomor ${no}?\n\n"${q.question.slice(0, 60)}..."`)) return
    setError("")
    setBusy(q.id)
    const res = await deleteExamQuestion(q.id)
    setBusy(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setPesan("Soal dihapus.")
    await onBerubah()
  }

  const tambah = async () => {
    setError("")
    setBusy("baru")
    const bersih =
      baru.type === "ESAI" ? null : rapikan(baru.options, baru.correctAnswer, baru.type)
    if (bersih && !bersih.correctAnswer) {
      setBusy(null)
      setError("Kunci jawaban belum dipilih (atau menunjuk opsi yang kosong).")
      return
    }

    const res = await addExamQuestion({
      examId,
      question: baru.question,
      imageUrl: baru.imageUrl,
      type: baru.type,
      options: bersih?.options,
      correctAnswer: bersih?.correctAnswer,
      points: Number(baru.points),
    })
    setBusy(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setBaru({
      question: "",
      imageUrl: "",
      type: "PG",
      options: ["", "", "", "", ""],
      correctAnswer: "0",
      points: 10,
    })
    setTambahBuka(false)
    setPesan("Soal baru ditambahkan di urutan terakhir.")
    await onBerubah()
  }

  const rusak = soal.filter(
    (q) => q.type !== "ESAI" && (!q.options || !q.correctAnswer)
  )

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <ListChecks className="w-4 h-4 text-rose-600" />
          Soal Ujian ({soal.length})
        </h3>
        <button
          onClick={() => setTambahBuka(!tambahBuka)}
          className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 transition"
        >
          <Plus className="w-3 h-3" /> Tambah Soal
        </button>
      </div>

      {rusak.length > 0 && (
        <p className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {rusak.length} soal pilihan ganda tersimpan <strong>tanpa opsi atau
            tanpa kunci jawaban</strong>. Soal seperti ini tampil kosong di
            perangkat siswa dan mustahil dinilai benar. Buka soal tersebut,
            lengkapi opsi dan kuncinya, lalu simpan.
          </span>
        </p>
      )}

      {adaPengerjaan > 0 && (
        <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
          {adaPengerjaan} siswa sudah mengerjakan ujian ini. Mengubah soal atau
          kunci jawaban tidak otomatis mengubah nilai mereka — jalankan{" "}
          <strong>Hitung Ulang</strong> setelah selesai menyunting.
        </p>
      )}

      {error && (
        <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
      {pesan && (
        <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          {pesan}
        </p>
      )}

      {/* ---------- Form tambah soal ---------- */}
      {tambahBuka && (
        <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col gap-2">
          <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider">
            Soal baru
          </span>
          <FormSoal
            nilai={baru}
            setNilai={(v: any) => setBaru({ ...baru, ...v })}
            toggleKunci={(i: number, kompleks: boolean) => {
              if (!kompleks) return setBaru({ ...baru, correctAnswer: String(i) })
              const set = new Set(
                String(baru.correctAnswer || "").split(",").map((x) => x.trim()).filter(Boolean)
              )
              const k = String(i)
              if (set.has(k)) set.delete(k)
              else set.add(k)
              setBaru({
                ...baru,
                correctAnswer: Array.from(set).sort((a, b) => Number(a) - Number(b)).join(","),
              })
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={tambah}
              disabled={busy === "baru"}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {busy === "baru" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Simpan Soal Baru
            </button>
            <button
              onClick={() => setTambahBuka(false)}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ---------- Daftar soal ---------- */}
      <div className="flex flex-col gap-1.5">
        {soal.map((q, i) => {
          const terbuka = bukaId === q.id
          const d = ambil(q)
          const bermasalah = q.type !== "ESAI" && (!q.options || !q.correctAnswer)
          const berubah = Boolean(draft[q.id])

          return (
            <div
              key={q.id}
              className={`rounded-2xl border overflow-hidden ${
                bermasalah ? "border-red-300" : "border-slate-200"
              }`}
            >
              <button
                onClick={() => setBukaId(terbuka ? null : q.id)}
                className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between gap-2 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500">
                      Soal {i + 1}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {q.type === "PG_KOMPLEKS"
                        ? "PG KOMPLEKS"
                        : q.type === "BENAR_SALAH"
                          ? "BENAR/SALAH"
                          : q.type === "ESAI"
                            ? "ESAI"
                            : "PG"}
                    </span>
                    <span className="text-[9px] text-slate-500">{q.points} poin</span>
                    {bermasalah && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        PERLU DILENGKAPI
                      </span>
                    )}
                    {berubah && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        BELUM DISIMPAN
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-800 mt-0.5 line-clamp-1">
                    {q.question}
                  </p>
                </div>
                {terbuka ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </button>

              {terbuka && (
                <div className="p-3 flex flex-col gap-2 bg-white">
                  <FormSoal
                    nilai={d}
                    setNilai={(v: any) => ubah(q.id, v)}
                    toggleKunci={(idx: number, kompleks: boolean) =>
                      toggleKunci(q.id, idx, kompleks)
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => simpan(q)}
                      disabled={busy === q.id}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {busy === q.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Simpan Soal {i + 1}
                    </button>
                    <button
                      onClick={() => hapus(q, i + 1)}
                      disabled={busy === q.id}
                      className="px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-50"
                      title="Hapus soal ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Bagian isian yang dipakai bersama oleh form tambah dan form sunting. */
function FormSoal({
  nilai,
  setNilai,
  toggleKunci,
}: {
  nilai: any
  setNilai: (v: any) => void
  toggleKunci: (i: number, kompleks: boolean) => void
}) {
  const esai = nilai.type === "ESAI"
  const kompleks = nilai.type === "PG_KOMPLEKS"
  const benarSalah = nilai.type === "BENAR_SALAH"

  const ubahOpsi = (i: number, v: string) => {
    const o = [...nilai.options]
    o[i] = v
    setNilai({ options: o })
  }

  /** Kunci Benar/Salah sebagai daftar sepanjang jumlah pernyataan. */
  const kunciBS = (): string[] => {
    const n = String(nilai.correctAnswer || "").split(",").map((x: string) => x.trim().toUpperCase())
    return (nilai.options as string[]).map((_: string, i: number) => (n[i] === "S" ? "S" : "B"))
  }

  const setKunciBS = (i: number, v: "B" | "S") => {
    const k = kunciBS()
    k[i] = v
    setNilai({ correctAnswer: k.join(",") })
  }

  const ubahJumlah = (delta: number) => {
    const o = [...nilai.options]
    if (delta > 0 && o.length < 8) o.push("")
    if (delta < 0 && o.length > 2) o.pop()

    if (benarSalah) {
      // Kunci posisional mengikuti panjang pernyataan.
      const k = kunciBS().slice(0, o.length)
      while (k.length < o.length) k.push("B")
      setNilai({ options: o, correctAnswer: k.join(",") })
      return
    }

    const kunci = String(nilai.correctAnswer || "")
      .split(",").map((x: string) => x.trim()).filter(Boolean)
      .filter((k: string) => Number(k) < o.length)
    setNilai({ options: o, correctAnswer: kunci.join(",") || "0" })
  }

  const gantiTipe = (tipeBaru: string) => {
    // Bentuk kunci tiap tipe berbeda: indeks untuk PG, posisional B/S untuk
    // Benar/Salah. Saat tipe berganti, kunci lama tidak lagi bermakna.
    if (tipeBaru === "BENAR_SALAH") {
      setNilai({ type: tipeBaru, correctAnswer: (nilai.options as string[]).map(() => "B").join(",") })
    } else if (nilai.type === "BENAR_SALAH") {
      setNilai({ type: tipeBaru, correctAnswer: "0" })
    } else {
      setNilai({ type: tipeBaru })
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={nilai.type}
          onChange={(e) => gantiTipe(e.target.value)}
          className="text-[11px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
        >
          <option value="PG">PG (1 jawaban)</option>
          <option value="PG_KOMPLEKS">PG Kompleks (&gt;1 jawaban)</option>
          <option value="BENAR_SALAH">Benar/Salah (tiap pernyataan)</option>
          <option value="ESAI">Esai</option>
        </select>
        <label className="flex items-center gap-1 text-[10px] text-slate-500">
          Bobot
          <input
            type="number"
            min={1}
            value={nilai.points}
            onChange={(e) => setNilai({ points: e.target.value })}
            className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-center"
          />
        </label>
      </div>

      <textarea
        rows={3}
        value={nilai.question}
        onChange={(e) => setNilai({ question: e.target.value })}
        placeholder="Tulis pertanyaan..."
        className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] resize-y"
      />

      <KolomGambar kecil nilai={nilai.imageUrl} onUbah={(url) => setNilai({ imageUrl: url })} />

      {!esai && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              {benarSalah ? (
                <>
                  <CheckSquare className="w-3 h-3 text-emerald-600" /> Tulis
                  pernyataan, tandai kunci tiap baris
                </>
              ) : kompleks ? (
                <>
                  <CheckSquare className="w-3 h-3 text-emerald-600" /> Centang SEMUA
                  jawaban benar
                </>
              ) : (
                <>
                  <ListChecks className="w-3 h-3 text-emerald-600" /> Pilih satu
                  jawaban benar
                </>
              )}
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => ubahJumlah(-1)}
                className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold text-[11px] leading-none"
              >
                −
              </button>
              <span className="text-[10px] text-slate-500 w-14 text-center">
                {nilai.options.length} {benarSalah ? "pernyataan" : "opsi"}
              </span>
              <button
                type="button"
                onClick={() => ubahJumlah(1)}
                className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold text-[11px] leading-none"
              >
                +
              </button>
            </span>
          </div>

          {nilai.options.map((o: string, i: number) => (
            <div key={i} className="flex items-center gap-1.5">
              {benarSalah ? (
                <span className="flex gap-0.5 shrink-0">
                  {(["B", "S"] as const).map((v) => {
                    const aktif = kunciBS()[i] === v
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setKunciBS(i, v)}
                        title={v === "B" ? "Kunci: Benar" : "Kunci: Salah"}
                        className={`w-6 h-6 rounded-md text-[10px] font-bold border transition ${
                          aktif
                            ? v === "B"
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-rose-600 border-rose-600 text-white"
                            : "bg-white border-slate-300 text-slate-400"
                        }`}
                      >
                        {v}
                      </button>
                    )
                  })}
                </span>
              ) : (
                <input
                  type={kompleks ? "checkbox" : "radio"}
                  checked={
                    kompleks
                      ? kunciAktif(nilai.correctAnswer, i)
                      : String(nilai.correctAnswer) === String(i)
                  }
                  onChange={() => toggleKunci(i, kompleks)}
                  className="accent-emerald-600"
                />
              )}
              <span className="text-[10px] font-bold text-slate-500 w-4">
                {benarSalah ? `${i + 1}.` : `${String.fromCharCode(65 + i)}.`}
              </span>
              <input
                value={o}
                onChange={(e) => ubahOpsi(i, e.target.value)}
                placeholder={benarSalah ? `Pernyataan ${i + 1}` : `Opsi ${String.fromCharCode(65 + i)}`}
                className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px]"
              />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
