"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Sprout,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  Search,
} from "lucide-react"
import { getPembiasaanWali } from "@/app/actions/teacher"

/**
 * Pantauan jurnal pembiasaan untuk wali kelas.
 *
 * Jurnal ini sebelumnya tidak bisa dibaca siapa pun selain penulisnya, jadi
 * siswa menulis ke ruang kosong. Aksesnya sengaja dibatasi wali kelas: isinya
 * catatan pribadi siswa, bukan nilai.
 */

const WARNA: Record<string, string> = {
  Ibadah: "bg-emerald-100 text-emerald-800",
  Literasi: "bg-sky-100 text-sky-800",
  Kebersihan: "bg-amber-100 text-amber-800",
  Sosial: "bg-violet-100 text-violet-800",
}

export default function TeacherPembiasaanPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [buka, setBuka] = useState<string | null>(null)
  const [cari, setCari] = useState("")
  const [kelasAktif, setKelasAktif] = useState<string>("")

  useEffect(() => {
    getPembiasaanWali().then((d) => {
      setData(d)
      if (d.kelas.length > 0) setKelasAktif(d.kelas[0].id)
      setIsLoading(false)
    })
  }, [])

  const siswa = useMemo(() => {
    if (!data) return []
    const q = cari.trim().toLowerCase()
    return data.siswa.filter(
      (s: any) =>
        (!kelasAktif || s.classId === kelasAktif) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          s.username.toLowerCase().includes(q))
    )
  }, [data, cari, kelasAktif])

  const ringkas = useMemo(() => {
    const total = siswa.reduce((n: number, s: any) => n + s.jumlah, 0)
    const aktif = siswa.filter((s: any) => s.jumlah > 0).length
    return { total, aktif }
  }, [siswa])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-500">Memuat pembiasaan kelas...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center gap-2.5 pt-1">
        <Link
          href="/teacher"
          className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            Pembiasaan Kelas
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Jurnal pembiasaan anak wali
          </p>
        </div>
      </div>

      {data?.bukanWali ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center flex flex-col items-center gap-2">
          <Info className="w-8 h-8 text-slate-300" />
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
            Halaman ini hanya untuk <strong>wali kelas</strong>. Kamu belum
            ditetapkan sebagai wali kelas mana pun, jadi belum ada jurnal yang
            bisa ditampilkan. Penetapan wali kelas dilakukan admin lewat menu
            Rombel.
          </p>
        </div>
      ) : (
        <>
          {data.kelas.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {data.kelas.map((k: any) => (
                <button
                  key={k.id}
                  onClick={() => setKelasAktif(k.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition border ${
                    kelasAktif === k.id
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {k.name}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Siswa", value: siswa.length },
              { label: "Sudah Mengisi", value: ringkas.aktif },
              { label: "Total Catatan", value: ringkas.total },
            ].map((k) => (
              <div
                key={k.label}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm"
              >
                <div className="text-lg font-black text-slate-900 leading-none">
                  {k.value}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  {k.label}
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" />
              Daftar Siswa ({siswa.length})
            </h3>

            {siswa.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                Tidak ada siswa yang cocok.
              </p>
            ) : (
              siswa.map((s: any) => {
                const terbuka = buka === s.id
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    <button
                      onClick={() => setBuka(terbuka ? null : s.id)}
                      disabled={s.jumlah === 0}
                      className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left transition ${
                        s.jumlah === 0
                          ? "bg-white cursor-default"
                          : "bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          @{s.username}
                          {s.terakhir &&
                            ` • terakhir ${new Date(s.terakhir).toLocaleDateString("id-ID")}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.jumlah === 0
                              ? "bg-slate-100 text-slate-400"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {s.jumlah === 0 ? "belum mengisi" : `${s.jumlah} catatan`}
                        </span>
                        {s.jumlah > 0 &&
                          (terbuka ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ))}
                      </div>
                    </button>

                    {terbuka && (
                      <div className="p-3 flex flex-col gap-2 bg-white">
                        {s.entri.map((e: any) => (
                          <div
                            key={e.id}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  WARNA[e.category] || "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {e.category}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(e.createdAt).toLocaleDateString("id-ID")}
                              </span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-800 mt-1.5">
                              {e.activity}
                            </p>
                            {e.notes && (
                              <p className="text-[11px] text-slate-600 italic mt-1 border-l-2 border-emerald-200 pl-2 leading-relaxed">
                                {e.notes}
                              </p>
                            )}
                          </div>
                        ))}
                        {s.jumlah > s.entri.length && (
                          <p className="text-[10px] text-slate-400 text-center">
                            Menampilkan {s.entri.length} catatan terbaru dari{" "}
                            {s.jumlah}.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
