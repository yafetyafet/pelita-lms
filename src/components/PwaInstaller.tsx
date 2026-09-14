"use client"
import React, { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Update UI notify the user they can install the PWA
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    // Show the install prompt
    deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setShowInstall(false)
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-xl border border-blue-100 p-4 flex items-center justify-between z-50 animate-in slide-in-from-bottom-5">
      <div>
        <h4 className="text-sm font-bold text-slate-800">Install Aplikasi PELITA</h4>
        <p className="text-[11px] text-slate-500 font-medium">Akses lebih cepat & hemat kuota</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleInstallClick} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-transform">
          Install
        </button>
        <button onClick={() => setShowInstall(false)} className="p-2 text-slate-400 bg-slate-100 rounded-xl hover:bg-slate-200">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
