"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Printer,
  Loader2,
  AlertTriangle,
  FileText,
  Award,
  ClipboardCheck,
} from "lucide-react"
import {
  getTeacherClasses,
  getLaporanJurnal,
  getLaporanNilai,
  getLaporanKehadiran,
} from "@/app/actions/teacher"
import { getSchoolProfile, type ProfilSekolah } from "@/app/actions/sekolah"
import {
  KopSurat,
  JudulLaporan,
  BlokTandaTangan,
  PeringatanProfil,
} from "@/components/cetak/KopSurat"

type Jenis = "jurnal" | "nilai" | "kehadiran"

/** Tanggal hari ini menurut WIB, untuk nilai awal input tanggal. */
function hariIniWIB(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

const tgl = (d: string | Date) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

export default function TeacherCetakPage() {
  const [profil, setProfil] = useState<ProfilSekolah | null>(null)
  const [kelasSaya, setKelasSaya] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [jenis, setJenis] = useState<Jenis>("jurnal")
  const [pilihan, setPilihan] = useState("") // "classId|subjectId"
  const [from, setFrom] = useState(hariIniWIB().slice(0, 8) + "01")
  const [to, setTo] = useState(hariIniWIB())
  const [perMapel, setPerMapel] = useState(true)

  const [data, setData] = useState<any>(null)
  const [memuat, setMemuat] = useState(false)
  const [error, setError] = useState("")

  const [classId, subjectId] = pilihan ? pilihan.split("|") : ["", ""]

  useEffect(() => {
    async function load() {
      const [p, cls] = await Promise.all([getSchoolProfile(), getTeacherClasses()])
      setProfil(p)
      setKelasSaya(cls)
      if (cls.length > 0) setPilihan(`${cls[0].classId}|${cls[0].subjectId}`)
      setIsLoading(false)
    }
    load()
  }, [])

  const buat = async () => {
    if (!classId) return
    setError("")
    setMemuat(true)
    setData(null)

    let hasil: any = null
    if (jenis === "jurnal") {
      hasil = await getLaporanJurnal({ classId, subjectId, from, to })
    } else if (jenis === "nilai") {
      hasil = await getLaporanNilai({ classId, subjectId })
    } else {
      hasil = await getLaporanKehadiran({
        classId,
        subjectId: perMapel ? subjectId : null,
        from,
        to,
      })
    }

    setMemuat(false)
    if (!hasil) {
      setError("Gagal menyusun laporan. Pastikan kamu mengampu kelas ini.")
      return
    }
    setData({ jenis, ...hasil })
  }

  if (isLoading || !profil) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs text-slate-500">Menyiapkan laporan...</span>
      </div>
    )
  }

  const JENIS = [
    { key: "jurnal" as const, label: "Jurnal", icon: FileText },
    { key: "nilai" as const, label: "Nilai", icon: Award },
    { key: "kehadiran" as const, label: "Kehadiran", icon: ClipboardCheck },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* ---------- Panel pengaturan (tidak ikut tercetak) ---------- */}
      <div data-no-cetak className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 pt-1">
          <Link
            href="/teacher"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Cetak Laporan
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Jurnal, nilai, dan kehadiran dengan kop sekolah
            </p>
          </div>
        </div>

        <PeringatanProfil profil={profil} />

        {kelasSaya.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">Belum Ada Kelas</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Ambil dulu rombel dan mapel yang Anda ampu lewat menu{" "}
              <strong>Kelas → Atur Mapel</strong>.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
            <div className="flex gap-1.5">
              {JENIS.map((j) => {
                const Icon = j.icon
                return (
                  <button
                    key={j.key}
                    onClick={() => {
                      setJenis(j.key)
                      setData(null)
                    }}
                    className={`flex-1 px-2 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                      jenis === j.key
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {j.label}
                  </button>
                )
              })}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Kelas &amp; Mata Pelajaran
              </span>
              <select
                value={pilihan}
                onChange={(e) => {
                  setPilihan(e.target.value)
                  setData(null)
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                {kelasSaya.map((tc: any) => (
                  <option
                    key={`${tc.classId}|${tc.subjectId}`}
                    value={`${tc.classId}|${tc.subjectId}`}
                  >
                    {tc.classInfo.name} — {tc.subject.name}
                  </option>
                ))}
              </select>
            </label>

            {jenis !== "nilai" && (
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Dari tanggal
                  </span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Sampai tanggal
                  </span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </label>
              </div>
            )}

            {jenis === "kehadiran" && (
              <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={perMapel}
                  onChange={(e) => setPerMapel(e.target.checked)}
                />
                <span>
                  Kehadiran per mata pelajaran (hapus centang untuk presensi
                  harian sekolah)
                </span>
              </label>
            )}

            {error && (
              <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={buat}
                disabled={memuat}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {memuat ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>{memuat ? "Menyusun..." : "Susun Laporan"}</span>
              </button>

              {data && (
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak
                </button>
              )}
            </div>

            {data && (
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Pratinjau di bawah sudah berukuran A4. Saat mencetak, pilih
                ukuran kertas <strong>A4</strong> dan aktifkan{" "}
                <strong>Background graphics</strong> agar garis tabel ikut
                tercetak. Untuk menyimpan sebagai PDF, pilih tujuan{" "}
                <strong>Save as PDF</strong>.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---------- Dokumen yang dicetak ---------- */}
      {data && (
        <div
          data-cetak
          className="kertas-a4 bg-white text-black p-6 border border-slate-200 rounded-lg print:border-0 print:rounded-none print:p-0"
        >
          <KopSurat profil={profil} />

          {data.jenis === "jurnal" && (
            <LaporanJurnal data={data} profil={profil} from={from} to={to} />
          )}
          {data.jenis === "nilai" && <LaporanNilai data={data} profil={profil} />}
          {data.jenis === "kehadiran" && (
            <LaporanKehadiran data={data} profil={profil} from={from} to={to} />
          )}
        </div>
      )}
    </div>
  )
}

/* ===================== JURNAL ===================== */
function LaporanJurnal({
  data,
  profil,
  from,
  to,
}: {
  data: any
  profil: ProfilSekolah
  from: string
  to: string
}) {
  return (
    <>
      <JudulLaporan
        judul="Jurnal Pembelajaran"
        baris={[
          { label: "Mata Pelajaran", nilai: data.mapel?.name ?? "" },
          { label: "Kelas / Rombel", nilai: data.kelas?.name ?? "" },
          { label: "Guru Pengampu", nilai: data.guru?.name ?? "" },
          { label: "Tahun Ajaran", nilai: profil.tahunAjaran },
          { label: "Semester", nilai: profil.semester },
          { label: "Periode", nilai: `${tgl(from)} s.d. ${tgl(to)}` },
        ]}
      />

      {data.jurnal.length === 0 ? (
        <p className="text-[12px] italic text-center py-6 border border-black">
          Tidak ada jurnal pada periode ini.
        </p>
      ) : (
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black p-1.5 w-8">No</th>
              <th className="border border-black p-1.5 w-24">Hari / Tanggal</th>
              <th className="border border-black p-1.5 w-14">Jam Ke</th>
              <th className="border border-black p-1.5">Materi Pokok / Kompetensi</th>
              <th className="border border-black p-1.5">Uraian Kegiatan</th>
              <th className="border border-black p-1.5 w-14">Hadir</th>
            </tr>
          </thead>
          <tbody>
            {data.jurnal.map((j: any, i: number) => (
              <tr key={j.id}>
                <td className="border border-black p-1.5 text-center align-top">
                  {i + 1}
                </td>
                <td className="border border-black p-1.5 align-top">
                  {new Date(j.tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="border border-black p-1.5 text-center align-top">
                  {j.jamKe || "—"}
                </td>
                <td className="border border-black p-1.5 align-top font-semibold">
                  {j.title}
                </td>
                <td className="border border-black p-1.5 align-top whitespace-pre-wrap">
                  {j.content}
                </td>
                <td className="border border-black p-1.5 text-center align-top">
                  {j.hadir != null
                    ? `${j.hadir}${data.kelas?._count?.students ? `/${data.kelas._count.students}` : ""}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-[11px] mt-2">
        Jumlah pertemuan tercatat: <strong>{data.jurnal.length}</strong>
      </p>

      <BlokTandaTangan
        profil={profil}
        namaGuru={data.guru?.name ?? ""}
        nipGuru={data.guru?.nomorInduk}
        jabatanKanan="Guru Mata Pelajaran"
      />
    </>
  )
}

/* ===================== NILAI ===================== */
function LaporanNilai({ data, profil }: { data: any; profil: ProfilSekolah }) {
  return (
    <>
      <JudulLaporan
        judul="Daftar Nilai Siswa"
        baris={[
          { label: "Mata Pelajaran", nilai: data.mapel?.name ?? "" },
          { label: "Kelas / Rombel", nilai: data.kelas?.name ?? "" },
          { label: "Guru Pengampu", nilai: data.guru?.name ?? "" },
          { label: "Tahun Ajaran", nilai: profil.tahunAjaran },
          { label: "Semester", nilai: profil.semester },
        ]}
      />

      {data.rows.length === 0 ? (
        <p className="text-[12px] italic text-center py-6 border border-black">
          Belum ada siswa di rombel ini.
        </p>
      ) : (
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black p-1.5 w-8">No</th>
              <th className="border border-black p-1.5 w-24">NIS</th>
              <th className="border border-black p-1.5 text-left">Nama Siswa</th>
              {data.tugas.map((t: any, i: number) => (
                <th
                  key={t.id}
                  className="border border-black p-1.5 w-12"
                  title={t.title}
                >
                  N{i + 1}
                </th>
              ))}
              <th className="border border-black p-1.5 w-14">Rata-rata</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any, i: number) => (
              <tr key={r.siswa.id}>
                <td className="border border-black p-1.5 text-center">{i + 1}</td>
                <td className="border border-black p-1.5 text-center">
                  {r.siswa.nomorInduk || r.siswa.username}
                </td>
                <td className="border border-black p-1.5">{r.siswa.name}</td>
                {r.nilai.map((n: number | null, j: number) => (
                  <td key={j} className="border border-black p-1.5 text-center">
                    {n ?? "—"}
                  </td>
                ))}
                <td className="border border-black p-1.5 text-center font-bold">
                  {r.rata ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Nama penilaian tidak muat di kepala tabel, jadi didaftar di bawah. */}
      {data.tugas.length > 0 && (
        <div className="mt-3 text-[10px]">
          <p className="font-semibold mb-1">Keterangan kolom penilaian:</p>
          <div className="grid grid-cols-2 gap-x-6">
            {data.tugas.map((t: any, i: number) => (
              <p key={t.id}>
                <strong>N{i + 1}</strong> — {t.title} (maks {t.maxScore})
              </p>
            ))}
          </div>
        </div>
      )}

      <BlokTandaTangan
        profil={profil}
        namaGuru={data.guru?.name ?? ""}
        nipGuru={data.guru?.nomorInduk}
        jabatanKanan="Guru Mata Pelajaran"
      />
    </>
  )
}

/* ===================== KEHADIRAN ===================== */
function LaporanKehadiran({
  data,
  profil,
  from,
  to,
}: {
  data: any
  profil: ProfilSekolah
  from: string
  to: string
}) {
  return (
    <>
      <JudulLaporan
        judul="Rekapitulasi Kehadiran Siswa"
        baris={[
          {
            label: "Mata Pelajaran",
            nilai: data.mapel?.name ?? "Presensi Harian Sekolah",
          },
          { label: "Kelas / Rombel", nilai: data.kelas?.name ?? "" },
          { label: "Wali Kelas", nilai: data.kelas?.wali?.name ?? "" },
          { label: "Tahun Ajaran", nilai: profil.tahunAjaran },
          { label: "Periode", nilai: `${tgl(from)} s.d. ${tgl(to)}` },
        ]}
      />

      {data.rows.length === 0 ? (
        <p className="text-[12px] italic text-center py-6 border border-black">
          Belum ada siswa di rombel ini.
        </p>
      ) : (
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black p-1.5 w-8">No</th>
              <th className="border border-black p-1.5 w-24">NIS</th>
              <th className="border border-black p-1.5 text-left">Nama Siswa</th>
              <th className="border border-black p-1.5 w-10">H</th>
              <th className="border border-black p-1.5 w-10">T</th>
              <th className="border border-black p-1.5 w-10">S</th>
              <th className="border border-black p-1.5 w-10">I</th>
              <th className="border border-black p-1.5 w-10">A</th>
              <th className="border border-black p-1.5 w-14">Total</th>
              <th className="border border-black p-1.5 w-14">%</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any, i: number) => {
              const efektif = r.hadir + r.terlambat
              const persen = r.total > 0 ? Math.round((efektif / r.total) * 100) : 0
              return (
                <tr key={r.student.id}>
                  <td className="border border-black p-1.5 text-center">{i + 1}</td>
                  <td className="border border-black p-1.5 text-center">
                    {r.student.nomorInduk || r.student.username}
                  </td>
                  <td className="border border-black p-1.5">{r.student.name}</td>
                  <td className="border border-black p-1.5 text-center">{r.hadir}</td>
                  <td className="border border-black p-1.5 text-center">
                    {r.terlambat}
                  </td>
                  <td className="border border-black p-1.5 text-center">{r.sakit}</td>
                  <td className="border border-black p-1.5 text-center">{r.izin}</td>
                  <td className="border border-black p-1.5 text-center">{r.alfa}</td>
                  <td className="border border-black p-1.5 text-center">{r.total}</td>
                  <td className="border border-black p-1.5 text-center font-bold">
                    {r.total > 0 ? `${persen}%` : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <p className="text-[10px] mt-2 leading-relaxed">
        Keterangan: H = Hadir, T = Terlambat, S = Sakit, I = Izin, A = Alfa.
        Persentase dihitung dari (Hadir + Terlambat) terhadap total pertemuan
        yang tercatat.
      </p>

      <BlokTandaTangan
        profil={profil}
        namaGuru={data.guru?.name ?? ""}
        nipGuru={data.guru?.nomorInduk}
        jabatanKanan={data.mapel ? "Guru Mata Pelajaran" : "Wali Kelas"}
      />
    </>
  )
}
