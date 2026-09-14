"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  CalendarDays, 
  ClipboardCheck, 
  FileCheck2, 
  UserRound 
} from "lucide-react"

export function StudentBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { name: "Beranda", href: "/student", icon: Home, badge: null },
    { name: "Jadwal", href: "/student/schedule", icon: CalendarDays, badge: null },
    { name: "Tugas", href: "/student/assignments", icon: ClipboardCheck, badge: null },
    { name: "Ujian", href: "/student/exams", icon: FileCheck2, badge: null },
    { name: "Profil", href: "/student/profile", icon: UserRound, badge: null },
  ]

  return (
    <nav aria-label="Navigasi Siswa" className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 group ${
                isActive 
                  ? "text-blue-600 font-bold" 
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              {/* Active Pill Background Accent */}
              {isActive && (
                <span className="absolute -top-1.5 w-7 h-1 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50"></span>
              )}

              <div className="relative p-1">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "stroke-[2.5px] stroke-blue-600" : "stroke-[1.8px]"
                }`} />

                {item.badge && (
                  <span className={`absolute -top-0.5 -right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-white leading-tight ${
                    item.badge === "UTS" 
                      ? "bg-amber-500 text-white animate-pulse" 
                      : "bg-red-500 text-white"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] tracking-tight ${isActive ? "text-blue-600 font-bold" : "text-slate-500"}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
