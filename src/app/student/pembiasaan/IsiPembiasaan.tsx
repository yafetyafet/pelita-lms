"use client"

import React, { useState } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import {
  ArrowLeft,
  Sprout,
  CheckCircle2,
  BookOpen,
  Send,
  Loader2,
  BookMarked,
  HeartHandshake,
  Broom,
  Moon,
} from "lucide-react"
import {
  getSpiritualJournals,
  createSpiritualJournal,
} from "@/app/actions/student"

/**
 * Jurnal Pembiasaan — dulu "Jurnal Iman".
 *
 * Versi lama hanya menampung kegiatan ibadah dan tidak bisa dibaca siapa pun
 * selain penulisnya, sehingga tidak pernah terisi satu baris pun. Sekarang
 * cakupannya empat kategori pembiasaan sekolah, dan wali kelas bisa
 * memantaunya lewat menu Pembiasaan Kelas.
 */

const KATEGORI = [
  {
    id: "Ibadah",
    label: "Ibadah",
    icon: Moon,
    warna: "from-emerald-500 to-teal-600",
    contoh: "Shalat Dhuha, tadarus, ibadah pagi, doa bersama...",
  },
  {
    id: "Literasi",
    label: "Literasi",
    icon: BookMarked,
    warna: "from-sky-500 to-blue-600",
    contoh: "Membaca 15 menit, meringkas buku, menulis catatan harian...",
  },
  {
    id: "Kebersihan",
    label: "Kebersihan",
    icon: Broom,
    warna: "from-amber-500 to-orange-600",
    contoh: "Piket kelas, memungut sampah, merawat taman sekolah...",
  },
  {
    id: "Sosial",
    label: "Sosial",
    icon: HeartHandshake,
    warna: "from-violet-500 to-purple-600",
    contoh: "Membantu teman, kerja bakti, menengok teman yang sakit...",
  },
] as const

export function IsiPembiasaan({ awal }: { awal: Awaited<ReturnType<typeof getSpiritualJournals>> }) {
  const [success, setSuccess] = useState(false)
  const [kategori, setKategori] = useState<string>("Ibadah")
  const [kegiatan, setKegiatan] = useState("")
  const [catatan, setCatatan] = useState("")
  const [history, setHistory] = useState<any[]>(awal)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const loadData = async () => {
    setHistory(await getSpiritualJournals())
    setIsLoading(false)
  }


  const terpilih = KATEGORI.find((k) => k.id === kategori) ?? KATEGORI[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!kegiatan.trim()) return

    setIsSubmitting(true)
    const res = await createSpiritualJournal({
      activity: kegiatan,
      notes: catatan,
      category: kategori,
    })
    setIsSubmitting(false)

    if (res.error) {
      setError(res.error)
      return
    }

    setSuccess(true)
    setKegiatan("")
    setCatatan("")
    setTimeout(() => setSuccess(false), 3000)
    loadData()
  }

  const warnaKategori = (id: string) =>
    KATEGORI.find((k) => k.id === id)?.warna ?? "from-slate-500 to-slate-600"

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {success && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Jurnal pembiasaan tersimpan.</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/student"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Jurnal Pembiasaan
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Catatan kebiasaan baik harian
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sprout className="w-3 h-3" /> {history.length} catatan
        </span>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-xl shadow-emerald-900/20 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Sprout className="w-6 h-6 text-emerald-100" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Pembiasaan Harian</h3>
          <p className="text-[11px] text-emerald-100 mt-0.5 leading-relaxed">
            Catat kebiasaan baik yang kamu lakukan hari ini. Wali kelasmu dapat
            melihat catatan ini sebagai bahan pembinaan.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4"
      >
        {error && (
          <p className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-2 uppercase tracking-wider">
            Jenis Pembiasaan
          </label>
          <div className="grid grid-cols-4 gap-2">
            {KATEGORI.map((k) => {
              const Icon = k.icon
              const aktif = kategori === k.id
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKategori(k.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition ${
                    aktif
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${k.warna} flex items-center justify-center text-white shadow-sm`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 leading-none">
                    {k.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
            Kegiatan
          </label>
          <input
            type="text"
            required
            value={kegiatan}
            onChange={(e) => setKegiatan(e.target.value)}
            placeholder={terpilih.contoh}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
            Refleksi (Opsional)
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Apa yang kamu pelajari atau rasakan dari kegiatan itu?"
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Simpan Catatan
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col gap-3 mt-2">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Riwayat Catatan
        </h3>

        {isLoading ? (
          <PemuatData pesan="Memuat riwayat..." />
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm text-center px-4">
            <Sprout className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">
              Belum ada catatan. Mulai dari satu kebiasaan kecil hari ini.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span
                      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-tr ${warnaKategori(
                        item.category
                      )} mb-1`}
                    >
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.activity}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {new Date(item.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-emerald-200 pl-2">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
