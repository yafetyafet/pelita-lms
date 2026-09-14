"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Wifi, 
  BatteryMedium, 
  Smartphone, 
  Monitor,
  GraduationCap, 
  Briefcase, 
  ShieldAlert, 
  Layers
} from "lucide-react"

interface MobileShellProps {
  children: React.ReactNode
  currentRole?: "student" | "teacher" | "dudi" | "admin"
}

export function MobileShell({ children, currentRole = "student" }: MobileShellProps) {
  const pathname = usePathname()
  const [isDesktopFrame, setIsDesktopFrame] = useState(true)

  const roles = [
    { id: "student", label: "Siswa", href: "/student", icon: GraduationCap, color: "from-blue-600 to-indigo-600" },
    { id: "teacher", label: "Guru", href: "/teacher", icon: Layers, color: "from-emerald-600 to-teal-700" },
    { id: "dudi", label: "Mitra DUDI", href: "/dudi", icon: Briefcase, color: "from-purple-600 to-violet-700" },
    { id: "admin", label: "Admin", href: "/admin", icon: ShieldAlert, color: "from-slate-800 to-slate-900" },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Interactive Bar for Reviewer / Teacher / Developer */}
      <aside aria-label="Simulator and Role Switcher Bar" className="w-full bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-50 sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/20">
            P
          </div>
          <div>
            <span className="font-bold text-white tracking-wide">PELITA LMS</span>
            <span className="hidden sm:inline text-slate-400 text-[11px] ml-1.5 font-normal">
              SMKN 1 Kemangkon
            </span>
          </div>
        </div>

        {/* Role Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-full border border-slate-800/90 shadow-inner">
          <span className="text-[10px] text-slate-400 font-semibold px-2 hidden md:inline">Mode Role:</span>
          {roles.map((r) => {
            const Icon = r.icon
            const active = (pathname.startsWith(r.href) && r.href !== "/") || 
                           (r.id === currentRole)

            return (
              <Link
                key={r.id}
                href={r.href}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
                  active 
                    ? `bg-gradient-to-r ${r.color} text-white shadow-md shadow-blue-500/20 font-semibold` 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{r.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Device Frame Toggle for Desktop Viewers */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1 rounded-full border border-slate-800/80">
          <button
            onClick={() => setIsDesktopFrame(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              isDesktopFrame ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"
            }`}
            title="Tampilan Smartphone (Mockup)"
          >
            <Smartphone className="w-3 h-3" />
            <span>Smartphone View</span>
          </button>
          <button
            onClick={() => setIsDesktopFrame(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              !isDesktopFrame ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"
            }`}
            title="Tampilan Responsif Penuh"
          >
            <Monitor className="w-3 h-3" />
            <span>Layar Penuh</span>
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <div className={`w-full flex justify-center items-start ${isDesktopFrame ? "py-4 md:py-8" : "p-0"}`}>
        <div 
          className={`w-full bg-slate-50 text-slate-900 flex flex-col relative transition-all duration-300 ${
            isDesktopFrame 
              ? "max-w-[420px] min-h-[840px] rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_12px_#1e293b,0_0_0_14px_#334155] border-[2px] border-slate-700/40 overflow-hidden" 
              : "max-w-4xl min-h-screen rounded-none md:rounded-2xl shadow-xl overflow-hidden"
          }`}
        >
          {/* Simulated Smartphone Status Bar (Only in smartphone frame or on mobile) */}
          <div className="bg-slate-900 text-white px-7 pt-3 pb-2 flex items-center justify-between text-xs select-none sticky top-0 z-50">
            <span className="font-semibold text-[13px] tracking-tight">07:15</span>
            {/* Dynamic Island / Speaker Pill */}
            <div className="h-4 w-24 bg-black/60 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-blue-500/80 animate-ping mr-1"></div>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider">LTE</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <BatteryMedium className="w-4 h-4 text-slate-300" />
                <span className="text-[10px] font-semibold">92%</span>
              </div>
            </div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 flex flex-col pb-20 overflow-y-auto no-scrollbar bg-slate-50">
            {children}
          </div>

          {/* Android / iOS Navigation Indicator Bar */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300/80 rounded-full pointer-events-none z-50"></div>
        </div>
      </div>
    </div>
  )
}
