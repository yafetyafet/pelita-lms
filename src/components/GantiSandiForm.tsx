"use client"

import React, { useState } from "react"
import { CheckCircle2, Loader2, Lock } from "lucide-react"

import { changeMyPassword } from "@/app/actions/auth"

/**
 * Form ganti kata sandi yang benar-benar menyimpan.
 *
 * Versi sebelumnya (inline di halaman profil siswa) hanya memanggil
 * `setSavedPassword(true)` lalu menghapusnya setelah 1,5 detik — input
 * bahkan tidak punya `value`/`onChange`, jadi tidak ada apa pun yang
 * dikirim ke server meski pesan "berhasil diperbarui" muncul.
 */
export function GantiSandiForm({
  accent = "blue",
}: {
  accent?: "blue" | "emerald"
}) {
  const [terbuka, setTerbuka] = useState(false)
  const [lama, setLama] = useState("")
  const [baru, setBaru] = useState("")
  const [ulang, setUlang] = useState("")
  const [proses, setProses] = useState(false)
  const [galat, setGalat] = useState("")
  const [sukses, setSukses] = useState(false)

  const warna =
    accent === "emerald"
      ? { text: "text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700", bg: "bg-emerald-50" }
      : { text: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700", bg: "bg-blue-50" }

  const reset = () => {
    setLama("")
    setBaru("")
    setUlang("")
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGalat("")

    if (baru.length < 6) {
      setGalat("Kata sandi baru minimal 6 karakter.")
      return
    }
    if (baru !== ulang) {
      setGalat("Konfirmasi kata sandi tidak sama.")
      return
    }

    setProses(true)
    const res = await changeMyPassword({ currentPassword: lama, newPassword: baru })
    setProses(false)

    if (res.error) {
      setGalat(res.error)
      return
    }

    reset()
    setTerbuka(false)
    setSukses(true)
    setTimeout(() => setSukses(false), 4000)
  }

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl ${warna.bg} ${warna.text}`}>
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Keamanan Akun</h3>
            <p className="text-[10px] text-slate-500">Kelola kata sandi akun LMS</p>
          </div>
        </div>
        <button
          onClick={() => {
            setTerbuka(!terbuka)
            setGalat("")
            reset()
          }}
          className={`text-xs font-bold ${warna.text} hover:underline`}
        >
          {terbuka ? "Tutup Form" : "Ubah Sandi"}
        </button>
      </div>

      {terbuka && (
        <form onSubmit={submit} className="flex flex-col gap-2 pt-1 border-t border-slate-100">
          <input
            type="password"
            value={lama}
            onChange={(e) => setLama(e.target.value)}
            placeholder="Kata sandi saat ini"
            autoComplete="current-password"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            required
          />
          <input
            type="password"
            value={baru}
            onChange={(e) => setBaru(e.target.value)}
            placeholder="Kata sandi baru (min. 6 karakter)"
            autoComplete="new-password"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            required
          />
          <input
            type="password"
            value={ulang}
            onChange={(e) => setUlang(e.target.value)}
            placeholder="Ulangi kata sandi baru"
            autoComplete="new-password"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            required
          />

          {galat && (
            <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {galat}
            </p>
          )}

          <button
            type="submit"
            disabled={proses}
            className={`py-2.5 ${warna.btn} text-white font-bold text-xs rounded-xl transition shadow-sm mt-1 flex items-center justify-center gap-2 disabled:opacity-60`}
          >
            {proses && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{proses ? "Menyimpan..." : "Simpan Kata Sandi Baru"}</span>
          </button>
        </form>
      )}

      {sukses && (
        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Kata sandi berhasil diperbarui.</span>
        </div>
      )}
    </div>
  )
}
