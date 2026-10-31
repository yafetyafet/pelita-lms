"use client"

import React from "react"

interface MobileShellProps {
  children: React.ReactNode
  currentRole?: "student" | "teacher" | "dudi" | "admin"
}

/**
 * Kerangka tata letak adaptif:
 * - Di ponsel (<md): tampilan aplikasi seluler yang rapi dan pas layar.
 * - Di laptop / desktop (>=md): aplikasi web desktop penuh (w-full, melebar luas
 *   tanpa kungkungan bingkai HP di tengah layar).
 */
export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white print:min-h-0 print:bg-white print:block">
      <div className="w-full flex-1 flex flex-col min-h-[100dvh] md:min-h-screen bg-white md:bg-transparent text-slate-900 relative print:h-auto print:overflow-visible print:max-w-none print:shadow-none print:border-0 print:block">
        {children}
      </div>
    </div>
  )
}
