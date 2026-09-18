"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/app/actions/auth"
import { 
  User, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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
      
      // Kembalikan ke halaman yang tadi dijaga proxy, kalau ada.
      const next = new URLSearchParams(window.location.search).get("next")
      router.replace(next && next.startsWith("/") ? next : res?.redirectTo || "/")
      router.refresh()
      
    } catch (err) {
      setError("Terjadi kesalahan jaringan.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Container */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[36px] p-6 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20 mb-3">
            P
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
            PELITA <span className="text-blue-500">LMS</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Pusat Ekselensi, Literasi, Iman, Teknologi dan Akademik
          </p>
          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] text-blue-300 font-semibold">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>SMKN 1 Kemangkon</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>Username</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 text-sm rounded-2xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300">Password</label>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-800 text-slate-100 text-sm rounded-2xl pl-10 pr-12 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            <span>{isLoading ? "Memproses..." : "Masuk ke Sistem"}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-500 font-medium mt-8">
          Sistem Informasi Manajemen Pembelajaran<br/>
          © 2026 TIM IT SMK Negeri 1 Kemangkon
        </p>
      </div>
    </div>
  )
}
