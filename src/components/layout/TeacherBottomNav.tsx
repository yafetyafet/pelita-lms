"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  UsersRound, 
  BookCheck, 
  ClipboardCheck,
  UserCog 
} from "lucide-react"

export function TeacherBottomNav() {
  const pathname = usePathname()

  // Presensi adalah pekerjaan harian guru, jadi diberi slot tetap di sini.
  // Jurnal mengajar tetap dapat dibuka dari beranda guru.
  const navItems = [
    { name: "Beranda", href: "/teacher", icon: Home, badge: null },
    { name: "Kelas", href: "/teacher/classes", icon: UsersRound, badge: null },
    { name: "Presensi", href: "/teacher/attendance", icon: ClipboardCheck, badge: null },
    { name: "Penilaian", href: "/teacher/grades", icon: BookCheck, badge: null },
    { name: "Profil", href: "/teacher/profile", icon: UserCog, badge: null },
  ]

  return (
    <nav aria-label="Navigasi Guru" className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
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
                  ? "text-emerald-600 font-bold" 
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-7 h-1 rounded-full bg-emerald-600 shadow-sm shadow-emerald-500/50"></span>
              )}

              <div className="relative p-1">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "stroke-[2.5px] stroke-emerald-600" : "stroke-[1.8px]"
                }`} />

                {item.badge && (
                  <span className={`absolute -top-0.5 -right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-white leading-tight ${
                    item.badge === "!" 
                      ? "bg-amber-500 text-white animate-pulse" 
                      : "bg-emerald-600 text-white"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] tracking-tight ${isActive ? "text-emerald-600 font-bold" : "text-slate-500"}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
