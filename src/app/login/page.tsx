"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { login } from "@/app/actions/auth"
import {
  User,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  MapPin,
  Timer,
  BookOpen,
  ShieldCheck,
} from "lucide-react"

/**
 * Halaman masuk sekaligus laman muka.
 *
 * Versi sebelumnya mewarisi tema gelap dari template awal: kartu hitam di
 * atas latar hitam, dengan logo terpaksa diberi kotak putih agar terbaca.
 * Sekarang seluruh halaman terang dan memakai dua warna lambang sekolah -
 * biru tua dan jingga - sehingga logo lengkap bisa tampil apa adanya.
 *
 * Tata letak: di layar lebar, kiri identitas PELITA dan kanan formulir;
 * di ponsel keduanya bertumpuk dengan formulir tetap terlihat tanpa
 * menggulir. Logika masuknya tidak berubah.
 */

const FITUR = [
  {
    icon: MapPin,
    judul: "Presensi GPS",
    keterangan: "Hadir dan pulang tercatat dari lokasi sekolah",
  },
  {
    icon: Timer,
    judul: "Ujian CBT",
    keterangan: "Soal teracak, jawaban tersimpan otomatis",
  },
  {
    icon: BookOpen,
    judul: "Materi & Tugas",
    keterangan: "Semua mata pelajaran dalam satu tempat",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [catatan, setCatatan] = useState("")

  // Penjaga perangkat mengarahkan ke sini dengan ?alasan=perangkat-lain.
  // Tanpa keterangan, pengguna yang tiba-tiba terlempar keluar akan mengira
  // aplikasinya rusak - padahal akunnya memang baru dipakai di tempat lain.
  useEffect(() => {
    const alasan = new URLSearchParams(window.location.search).get("alasan")
    if (alasan === "perangkat-lain") {
      setCatatan(
        "Kamu keluar otomatis karena akun ini baru dipakai masuk di perangkat lain. Satu akun hanya boleh aktif di satu perangkat."
      )
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) {
      setError("Username dan Password harus diisi")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const res = await login(identifier, password)
      if (res?.error) {
        setError(res.error)
        setIsLoading(false)
        return
      }

      // Akun ternyata masih aktif di tempat lain saat kita masuk. Sesi itu
      // sudah dibatalkan, tapi pemiliknya perlu tahu - ini sinyal paling awal
      // kalau sandinya dipakai orang lain.
      if (res?.perangkatSebelumnya) {
        try {
          sessionStorage.setItem("pelita_sesi_tergeser", res.perangkatSebelumnya)
        } catch {
          // Mode penyamaran memblokir sessionStorage; bukan alasan gagal masuk.
        }
      }

      // Kembalikan ke halaman yang tadi dijaga proxy, kalau ada.
      const next = new URLSearchParams(window.location.search).get("next")
      router.replace(next && next.startsWith("/") ? next : res?.redirectTo || "/")
      router.refresh()
    } catch {
      setError("Terjadi kesalahan jaringan.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50/40 text-slate-800 selection:bg-blue-700 selection:text-white">
      {/* Hiasan latar: dua lingkaran lembut dengan warna lambang */}
      <div className="pointer-events-none fixed -top-32 -left-32 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-200/40 blur-3xl" />

      <main className="relative min-h-screen flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 md:gap-12 items-center">
          {/* ================= KIRI: identitas ================= */}
          <section className="flex flex-col items-center md:items-start text-center md:text-left">
            {/* Logo lengkap di layar lebar, lambang saja di ponsel supaya
                formulir tetap terlihat tanpa menggulir. */}
            <div className="hidden md:block">
                // Lambang sekolah adalah PNG statis 45 KB yang dilihat setiap
                // pengunjung. Melewatkannya ke pengoptimal gambar Next tidak
                // menghemat apa pun - ia justru memaksa satu penyandian ulang
                // per permintaan. Terukur pada ujian 122 siswa: 282 kegagalan
                // tulis cache dan satu sambungan putus tepat pada berkas ini.
              <Image
                src="/logo-pelita-full.png"
                alt="PELITA — Platform Edukasi, Layanan Informasi, dan Tata Kelola Akademik"
                width={420}
                height={389}
                priority
                unoptimized
                className="w-[380px] lg:w-[420px] h-auto"
              />
            </div>
            <div className="md:hidden flex items-center gap-3">
              <Image
                src="/logo-pelita.png"
                alt="Logo PELITA"
                width={64}
                height={64}
                priority
                unoptimized
              />
              <div className="text-left">
                <h1 className="text-2xl font-black text-blue-900 leading-none tracking-tight">
                  PELITA
                </h1>
                <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                  Platform Edukasi, Layanan Informasi,
                  <br />
                  dan Tata Kelola Akademik
                </p>
              </div>
            </div>

            <div className="mt-4 md:mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-blue-100 shadow-sm text-[11px] font-semibold text-blue-900">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              SMK Negeri 1 Kemangkon
            </div>

            {/* Tiga hal yang bisa dilakukan - hanya di layar lebar */}
            <ul className="hidden md:flex flex-col gap-3 mt-8">
              {FITUR.map((f) => {
                const Icon = f.icon
                return (
                  <li key={f.judul} className="flex items-start gap-3">
                    <span className="mt-0.5 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {f.judul}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{f.keterangan}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* ================= KANAN: formulir ================= */}
          <section className="w-full max-w-md mx-auto md:mx-0 md:ml-auto">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-blue-900/5 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Masuk
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gunakan akun yang diberikan sekolah.
                </p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {catatan && !error && (
                  <div
                    role="status"
                    className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center font-medium"
                  >
                    {catatan}
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium"
                  >
                    {error}
                  </div>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-600">Username</span>
                  <span className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="NIS / NIP / username"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all placeholder:text-slate-400"
                      autoComplete="username"
                      autoCapitalize="none"
                    />
                  </span>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-600">Password</span>
                  <span className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl pl-10 pr-12 py-3.5 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all placeholder:text-slate-400"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span>{isLoading ? "Memproses..." : "Masuk"}</span>
                  {!isLoading && (
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  )}
                </button>
              </form>

              <p className="text-[11px] text-slate-500 text-center mt-6 leading-relaxed">
                Lupa password? Hubungi wali kelas atau admin sekolah.
              </p>
            </div>

            {/* Fitur versi ponsel: ringkas, di bawah formulir */}
            <ul className="md:hidden grid grid-cols-3 gap-2 mt-5">
              {FITUR.map((f) => {
                const Icon = f.icon
                return (
                  <li
                    key={f.judul}
                    className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl bg-white/80 border border-slate-200/70"
                  >
                    <Icon className="w-4 h-4 text-blue-800" />
                    <span className="text-[10px] font-bold text-slate-700 leading-tight">
                      {f.judul}
                    </span>
                  </li>
                )
              })}
            </ul>

            <p className="text-center text-[10px] text-slate-400 font-medium mt-6">
              © 2026 TIM IT SMK Negeri 1 Kemangkon ·{" "}
              <span className="italic">Menerangi Jalan Pendidikan</span>
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
