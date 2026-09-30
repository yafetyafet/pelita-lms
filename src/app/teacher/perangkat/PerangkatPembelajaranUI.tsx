"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, Wand2, Copy, FileText, Check, Settings2 } from "lucide-react"
import { generateModulAjar } from "@/app/actions/ai"

export function PerangkatPembelajaranUI() {
  const [mapel, setMapel] = useState("")
  const [kelas, setKelas] = useState("")
  const [topik, setTopik] = useState("")
  const [alokasi, setAlokasi] = useState("2 x 45 Menit (1 Pertemuan)")
  const [catatan, setCatatan] = useState("")
  
  const [endpoint, setEndpoint] = useState("")
  const [modelId, setModelId] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showConfig, setShowConfig] = useState(false)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    // Coba ambil config tersimpan dari localStorage supaya tidak perlu input terus
    const savedEp = localStorage.getItem("ai_endpoint")
    const savedMod = localStorage.getItem("ai_model")
    const savedKey = localStorage.getItem("ai_key")
    if (savedEp) setEndpoint(savedEp)
    if (savedMod) setModelId(savedMod)
    if (savedKey) setApiKey(savedKey)
  }, [])

  const handleSaveConfig = () => {
    localStorage.setItem("ai_endpoint", endpoint)
    localStorage.setItem("ai_model", modelId)
    localStorage.setItem("ai_key", apiKey)
    setShowConfig(false)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!endpoint || !modelId || !apiKey) {
      setShowConfig(true)
      setErrorMsg("Mohon isi konfigurasi AI (Endpoint, Model, API Key) terlebih dahulu.")
      return
    }
    if (!mapel || !kelas || !topik) {
      setErrorMsg("Mata Pelajaran, Fase/Kelas, dan Topik wajib diisi.")
      return
    }

    setErrorMsg("")
    setLoading(true)
    setResult("")

    const res = await generateModulAjar({
      mapel, kelas, topik, alokasi, catatan,
      endpoint, modelId, apiKey
    })

    setLoading(false)
    if (res.error) {
      setErrorMsg(res.error)
    } else if (res.content) {
      setResult(res.content)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link href="/teacher" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-fuchsia-600" /> Modul Ajar AI
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Generate Perangkat Pembelajaran Kurikulum Merdeka</p>
          </div>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${showConfig ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
        >
          <Settings2 className="w-3.5 h-3.5" /> {showConfig ? "Tutup Config" : "Config AI"}
        </button>
      </div>

      {showConfig && (
        <div className="bg-fuchsia-50/50 border border-fuchsia-200/60 rounded-3xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-fuchsia-900">Konfigurasi Endpoint AI (OpenAI Compatible)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Endpoint (cth: https://api.openai.com/v1/chat/completions)" value={endpoint} onChange={e=>setEndpoint(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-fuchsia-200 bg-white focus:outline-none focus:border-fuchsia-400" />
            <input type="text" placeholder="Model ID (cth: gpt-4o-mini)" value={modelId} onChange={e=>setModelId(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-fuchsia-200 bg-white focus:outline-none focus:border-fuchsia-400" />
            <input type="password" placeholder="API Key" value={apiKey} onChange={e=>setApiKey(e.target.value)} className="px-3 py-2 text-xs rounded-xl border border-fuchsia-200 bg-white focus:outline-none focus:border-fuchsia-400 md:col-span-2" />
          </div>
          <button onClick={handleSaveConfig} className="bg-fuchsia-600 text-white px-4 py-2 rounded-xl text-xs font-bold w-max shadow hover:bg-fuchsia-700 transition">Simpan Konfigurasi</button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-xs border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Kolom Kiri: Form */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" /> Parameter Materi
          </h3>
          <form onSubmit={handleGenerate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600">Mata Pelajaran <span className="text-red-500">*</span></label>
              <input type="text" required value={mapel} onChange={e=>setMapel(e.target.value)} placeholder="Contoh: Matematika" className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600">Fase / Kelas <span className="text-red-500">*</span></label>
              <input type="text" required value={kelas} onChange={e=>setKelas(e.target.value)} placeholder="Contoh: Fase E / X SMK" className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600">Topik / Materi Pokok <span className="text-red-500">*</span></label>
              <textarea required value={topik} onChange={e=>setTopik(e.target.value)} placeholder="Contoh: Eksponen dan Logaritma" rows={2} className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600">Alokasi Waktu</label>
              <input type="text" value={alokasi} onChange={e=>setAlokasi(e.target.value)} placeholder="Contoh: 2 x 45 Menit" className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600">Catatan Khusus (Opsional)</label>
              <textarea value={catatan} onChange={e=>setCatatan(e.target.value)} placeholder="Contoh: Gunakan metode Problem Based Learning dengan studi kasus nyata." rows={3} className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none" />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-fuchsia-200 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Meracik Modul...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Generate Modul Ajar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Hasil Generate</h3>
            {result && (
              <button 
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Tersalin!" : "Salin Teks"}
              </button>
            )}
          </div>
          <div className="p-4 flex-1 bg-slate-50/50 rounded-b-3xl">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-8 h-8 border-4 border-fuchsia-100 border-t-fuchsia-600 rounded-full animate-spin" />
                <p className="text-xs font-medium animate-pulse">Menghubungi AI... Mohon tunggu.</p>
              </div>
            ) : result ? (
              <div className="prose prose-sm prose-slate max-w-none text-xs whitespace-pre-wrap">
                {result}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <Sparkles className="w-8 h-8 opacity-20" />
                <p className="text-[11px] font-medium max-w-xs text-center leading-relaxed">
                  Isi form di sebelah kiri untuk otomatis membuat Modul Ajar Kurikulum Merdeka yang siap dicetak.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
