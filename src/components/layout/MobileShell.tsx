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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-start antialiased selection:bg-blue-600 selection:text-white">
      <div className={`w-full h-[100dvh] bg-white text-slate-900 shadow-2xl flex flex-col relative sm:border-x sm:border-slate-200 ${
        isDesktopEnabled ? "max-w-md md:max-w-5xl md:mx-auto md:border-x md:shadow-slate-300/30" : "max-w-md"
      }`}>
        {children}
      </div>
    </div>
  )
}
