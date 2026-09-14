"use client"

import React from "react"

interface MobileShellProps {
  children: React.ReactNode
  currentRole?: "student" | "teacher" | "dudi" | "admin"
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-start antialiased selection:bg-blue-600 selection:text-white">
      {/* Mobile-first centered container */}
      <div className="w-full h-screen max-w-md bg-white text-slate-900 shadow-2xl overflow-hidden flex flex-col relative sm:border-x sm:border-slate-200">
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
