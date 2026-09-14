"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "@/app/actions/auth"
import { 
  GraduationCap, 
  Layers, 
  Briefcase, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<"student" | "teacher" | "dudi" | "admin">("student")
  const [identifier, setIdentifier] = useState("fajar@smkn1kemangkon.sch.id")
  const [password, setPassword] = useState("••••••••")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const roles = [
    { id: "student", label: "Siswa", icon: GraduationCap, placeholder: "Email Siswa", defaultId: "fajar@smkn1kemangkon.sch.id", target: "/student" },
    { id: "teacher", label: "Guru", icon: Layers, placeholder: "Email Guru", defaultId: "kurniawan@smkn1kemangkon.sch.id", target: "/teacher" },
    { id: "dudi", label: "Mitra DUDI", icon: Briefcase, placeholder: "Email Pembimbing", defaultId: "dudi.telkom@smkn1kemangkon.sch.id", target: "/dudi" },
    { id: "admin", label: "Admin", icon: ShieldCheck, placeholder: "Email Admin", defaultId: "admin@smkn1kemangkon.sch.id", target: "/admin" },
  ]

  const currentRoleConfig = roles.find((r) => r.id === role) || roles[0]

  const handleSelectRole = (roleId: "student" | "teacher" | "dudi" | "admin") => {
    setRole(roleId)
    const target = roles.find((r) => r.id === roleId)
    if (target) {
      setIdentifier(target.defaultId)
      setError("")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const res = await login(identifier)
      if (res?.error) {
        setError(res.error)
        setIsLoading(false)
        return
      }
      
      router.push(currentRoleConfig.target)
    } catch (err) {
      setError("Terjadi kesalahan jaringan.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Smartphone Container Mockup on Desktop, Full on Mobile */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[36px] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_8px_#1e293b] flex flex-col relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
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

        {/* Role Switcher Tabs (Segmented Control) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5">
          {roles.map((r) => {
            const Icon = r.icon
            const isActive = role === r.id

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRole(r.id as any)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-[10px] font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate w-full text-center">{r.label}</span>
              </button>
            )
          })}
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
              <span>Identitas Akun</span>
              <span className="text-[10px] text-blue-400 font-normal capitalize">{role}</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={currentRoleConfig.placeholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <label>Kata Sandi</label>
              <a href="#forgot" className="text-[10px] text-blue-400 hover:underline">
                Lupa Sandi?
              </a>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <span>Masuk sebagai {currentRoleConfig.label}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Access Pills */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
            <span>Akses Cepat Demo:</span>
            <span className="text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Siap Uji Coba
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  handleSelectRole(r.id as any)
                  router.push(r.target)
                }}
                className="py-1.5 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-[10px] text-slate-300 text-left flex items-center justify-between group transition"
              >
                <span className="font-medium">{r.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
