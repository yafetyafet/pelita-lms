"use client"

import React, { useMemo, useState } from "react"
import { Download, Loader2, Users, AlertTriangle } from "lucide-react"

import { muatXlsx } from "@/lib/xlsx"
import {
  LABEL_STATUS,
  LEBAR_KOLOM_RINGKASAN,
  LEBAR_KOLOM_ROMBEL,
  keterangan,
  lembarRingkasan,
  lembarRombel,
  namaBerkas,
  namaLembarAman,
  waktuWIB,
  type InfoUjian,
  type RombelHasil,
} from "@/lib/logic/rekap-ujian"

type Props = {
  info: InfoUjian
  rombel: RombelHasil[]
}

const WARNA_STATUS: Record<string, string> = {
  selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
  menunggu: "bg-amber-50 text-amber-800 border-amber-200",
  mengerjakan: "bg-blue-50 text-blue-700 border-blue-200",
  belum: "bg-slate-100 text-slate-500 border-slate-200",
}

export function RekapHasilUjian({ info, rombel }: Props) {
  // Rombel aktif. Kalau ujiannya hanya untuk satu rombel, tab-nya tetap ada
  // supaya tampilannya konsisten, tetapi tidak ada yang perlu dipilih.
  const [aktif, setAktif] = useState(0)
  const [mengekspor, setMengekspor] = useState<"satu" | "semua" | null>(null)

  const terpilih = rombel[aktif]

  const adaEsaiBelumDikoreksi = useMemo(
    () => rombel.some((r) => r.ringkasan.menungguKoreksi > 0),
    [rombel]
  )

  /**
   * Tulis berkas Excel.
   *
   * `hanyaIni` membedakan "ekspor rombel yang sedang dilihat" dari "ekspor
   * semua rombel". Yang kedua diberi lembar ringkasan di depan supaya wali
   * kelas tidak perlu membuka tiap lembar hanya untuk membandingkan.
   */
  const ekspor = async (hanyaIni: boolean) => {
    setMengekspor(hanyaIni ? "satu" : "semua")
    try {
      const XLSX = await muatXlsx()
      const wb = XLSX.utils.book_new()
      const dipakai = new Set<string>()
      const daftar = hanyaIni ? [terpilih] : rombel

      if (!hanyaIni && rombel.length > 1) {
        const ws = XLSX.utils.aoa_to_sheet(lembarRingkasan(info, rombel))
        ws["!cols"] = LEBAR_KOLOM_RINGKASAN.map((w) => ({ wch: w }))
        XLSX.utils.book_append_sheet(wb, ws, namaLembarAman("Ringkasan", dipakai))
      }

      for (const r of daftar) {
        const ws = XLSX.utils.aoa_to_sheet(lembarRombel(info, r))
        ws["!cols"] = LEBAR_KOLOM_ROMBEL.map((w) => ({ wch: w }))
        XLSX.utils.book_append_sheet(wb, ws, namaLembarAman(r.nama, dipakai))
      }

      XLSX.writeFile(wb, namaBerkas(info, hanyaIni ? terpilih.nama : undefined))
    } catch (e) {
      console.error(e)
      alert("Gagal membuat berkas Excel. Coba lagi.")
    } finally {
      setMengekspor(null)
    }
  }

  if (rombel.length === 0) {
    return (
      <p className="p-4 text-center text-xs text-slate-400 italic">
        Ujian ini belum punya rombel peserta.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tab rombel + tombol ekspor */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {rombel.map((r, i) => (
            <button
              key={r.id ?? r.nama}
              type="button"
              onClick={() => setAktif(i)}
              aria-pressed={i === aktif}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                i === aktif
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {r.nama}
              <span
                className={`ml-1.5 text-[9px] ${
                  i === aktif ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {r.ringkasan.sudahMenilai}/{r.ringkasan.jumlahSiswa}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => ekspor(true)}
            disabled={mengekspor !== null}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {mengekspor === "satu" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Excel rombel ini
          </button>

          {rombel.length > 1 && (
            <button
              type="button"
              onClick={() => ekspor(false)}
              disabled={mengekspor !== null}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {mengekspor === "semua" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Semua rombel
            </button>
          )}
        </div>
      </div>

      {adaEsaiBelumDikoreksi && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Sebagian jawaban esai belum dikoreksi, jadi nilai akhirnya masih
            kosong. Rekap yang diekspor sekarang belum lengkap.
          </span>
        </p>
      )}

      {/* Ringkasan rombel terpilih */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {[
          { label: "Rata-rata", nilai: terpilih.ringkasan.rata },
          { label: "Tertinggi", nilai: terpilih.ringkasan.tertinggi },
          { label: "Terendah", nilai: terpilih.ringkasan.terendah },
          {
            label: info.passingScore !== null ? `Tuntas (KKM ${info.passingScore})` : "Sudah dinilai",
            nilai:
              info.passingScore !== null
                ? terpilih.ringkasan.tuntas
                : terpilih.ringkasan.sudahMenilai,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center"
          >
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
              {k.label}
            </span>
            <span className="text-base font-black text-slate-900">
              {k.nilai ?? "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Daftar siswa */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[11px] font-bold text-slate-700">
            {terpilih.nama} — {terpilih.ringkasan.jumlahSiswa} siswa
          </span>
          {terpilih.ringkasan.belumMengerjakan > 0 && (
            <span className="text-[10px] text-rose-600 font-bold">
              · {terpilih.ringkasan.belumMengerjakan} belum mengerjakan
            </span>
          )}
        </div>

        {/* Tabel digulir mendatar di layar sempit, bukan diperkecil sampai
            tidak terbaca. */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500">
                <th className="px-2 py-1.5 text-left font-bold w-8">No</th>
                <th className="px-2 py-1.5 text-left font-bold">Nama</th>
                <th className="px-2 py-1.5 text-center font-bold w-14">PG</th>
                <th className="px-2 py-1.5 text-center font-bold w-14">Esai</th>
                <th className="px-2 py-1.5 text-center font-bold w-16">Nilai</th>
                <th className="px-2 py-1.5 text-left font-bold w-40">Status</th>
                <th className="px-2 py-1.5 text-left font-bold w-32">Kumpul</th>
              </tr>
            </thead>
            <tbody>
              {terpilih.siswa.map((s, i) => (
                <tr
                  key={s.id ?? s.nomorInduk}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-2 py-1.5 text-slate-400">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <span className="font-semibold text-slate-800">{s.nama}</span>
                    <span className="block text-[9px] text-slate-400">
                      {s.nomorInduk}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-center text-slate-600">
                    {s.skorPG ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 text-center text-slate-600">
                    {s.skorEsai ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span className="font-black text-slate-900">
                      {s.nilaiAkhir ?? "—"}
                    </span>
                    {info.passingScore !== null && s.nilaiAkhir !== null && (
                      <span
                        className={`block text-[9px] font-bold ${
                          s.nilaiAkhir >= info.passingScore
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {keterangan(s.nilaiAkhir, info.passingScore)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${
                        WARNA_STATUS[s.status] ?? WARNA_STATUS.belum
                      }`}
                    >
                      {LABEL_STATUS[s.status]}
                    </span>
                    {s.pelanggaran > 0 && (
                      <span className="block text-[9px] text-rose-600 font-bold mt-0.5">
                        {s.pelanggaran}x terdeteksi
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-slate-500 text-[10px]">
                    {waktuWIB(s.kumpul) || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
