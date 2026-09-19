"use client"

import React from "react"

interface MobileShellProps {
  children: React.ReactNode
  currentRole?: "student" | "teacher" | "dudi" | "admin"
}

export function MobileShell({ children, currentRole }: MobileShellProps) {
  // Jika role adalah student, tetap paksa tampilan mobile (max-w-md).
  // Jika role lain (teacher, admin, dudi), izinkan melebar hingga max-w-5xl di layar besar.
  const isDesktopEnabled = currentRole && currentRole !== "student"

  return (
    // `print:` melepas tinggi tetap dan batas lebar saat mencetak; tanpa itu
    // hasil cetak hanya berupa satu layar terpotong selebar ponsel.
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-start antialiased selection:bg-blue-600 selection:text-white print:min-h-0 print:bg-white print:block">
      <div className={`w-full h-[100dvh] bg-white text-slate-900 shadow-2xl flex flex-col relative sm:border-x sm:border-slate-200 print:h-auto print:max-w-none print:shadow-none print:border-0 print:block ${
        isDesktopEnabled ? "max-w-md md:max-w-5xl md:mx-auto md:border-x md:shadow-slate-300/30" : "max-w-md"
      }`}>
        {children}
      </div>
    </div>
  )
}
