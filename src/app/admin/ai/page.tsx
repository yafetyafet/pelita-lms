"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save, Sparkles, CheckCircle2, Loader2 } from "lucide-react"
import { getAppSetting, setAppSettings } from "@/app/actions/admin"

export default function AIConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [endpoint, setEndpoint] = useState("")
  const [modelId, setModelId] = useState("")
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    async function load() {
      const ep = await getAppSetting("AI_ENDPOINT")
      const mod = await getAppSetting("AI_MODEL")
      const key = await getAppSetting("AI_API_KEY")
      
      setEndpoint(ep || "http://192.100.1.10:20128/v1/chat/completions")
      setModelId(mod || "oc/muse-spark-1.3-contributor-free")
      setApiKey(key || "sk-d7c04fe4ad11505d-qhe2co-0cbda760")
      
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    
    await setAppSettings({
      "AI_ENDPOINT": endpoint,
      "AI_MODEL": modelId,
      "AI_API_KEY": apiKey
    })
    
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 gap-2 text-sm font-bold">
        <Loader2 className="w-5 h-5 animate-spin" /> Memuat konfigurasi...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 mb-2">
        <Link href="/admin" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fuchsia-600" /> Konfigurasi AI
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">Pengaturan Modul Ajar AI untuk Guru</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col gap-4">
        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
          Konfigurasi ini digunakan secara global (untuk seluruh guru) setiap kali mereka menekan tombol "Generate Modul Ajar" di perangkat pembelajaran. Parameter di bawah ini harus sesuai dengan spesifikasi endpoint yang meniru pola OpenAI API.
        </p>
        
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Endpoint URL</label>
            <input 
              type="text" 
              required
              value={endpoint} 
              onChange={e => setEndpoint(e.target.value)} 
              placeholder="cth: http://192.100.1.10:20128/v1/chat/completions" 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500" 
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Model ID</label>
            <input 
              type="text" 
              required
              value={modelId} 
              onChange={e => setModelId(e.target.value)} 
              placeholder="cth: oc/muse-spark-1.3-contributor-free" 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500" 
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">API Key</label>
            <input 
              type="password" 
              required
              value={apiKey} 
              onChange={e => setApiKey(e.target.value)} 
              placeholder="Token rahasia akses AI" 
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500" 
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button 
              type="submit" 
              disabled={saving}
              className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Pengaturan
            </button>
            {saved && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
