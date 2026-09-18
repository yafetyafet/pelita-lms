"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Database, Download, RefreshCw, CheckCircle2, ShieldCheck, Server, Loader2 } from "lucide-react"
import { downloadBackupData } from "@/app/actions/admin"

export default function AdminBackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleDownloadBackup = async () => {
    setIsBackingUp(true)
    const res = await downloadBackupData()
    
    if (res.error) {
      alert("Error: " + res.error)
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
        JSON.stringify(res.data, null, 2)
      )
      const downloadAnchor = document.createElement("a")
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `backup_pelita_${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()

      setToast("Snapshot backup database (Real Data) berhasil diunduh!")
      setTimeout(() => setToast(null), 3500)
    }
    
    setIsBackingUp(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {toast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-1 mb-2">
        <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">Backup & Ekspor Data</h2>
          <p className="text-[11px] text-slate-500 font-medium">Unduh snapshot seluruh data aplikasi sebagai JSON</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
            <Server className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ekspor Data Aplikasi</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Snapshot seluruh tabel aplikasi dalam satu berkas JSON
            </p>
          </div>
        </div>

        {/*
          Kartu ini sebelumnya memajang angka yang ditulis mati di kode —
          status "Terhubung (Healthy)", host pooler, "Otomatis Tiap Hari",
          dan "Latency ~24 ms" — padahal tidak ada satu pun yang diukur.
          Diganti dengan keterangan yang memang benar tentang fitur ini.
        */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
          <strong className="block text-slate-800 mb-1">Isi snapshot</strong>
          Pengguna (tanpa kata sandi), rombel, mapel, penempatan siswa &amp; guru,
          jam pelajaran, jadwal, materi, tugas &amp; pengumpulannya, jurnal,
          presensi, pelanggaran, ujian beserta soal dan hasilnya, perpustakaan,
          pengumuman, pengaturan aplikasi, serta data PKL.
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
          Berkas ini untuk arsip dan pemindahan data, bukan pengganti backup
          basis data. Untuk pemulihan penuh (point-in-time recovery), gunakan
          fitur backup pada dasbor Supabase proyek Anda.
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button 
            onClick={handleDownloadBackup}
            disabled={isBackingUp}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {isBackingUp ? (
              <><Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> Mengemas Data Server...</>
            ) : (
              <><Download className="w-4 h-4 text-emerald-400" /> Unduh Snapshot Data Real (JSON)</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
