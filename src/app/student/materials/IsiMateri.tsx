"use client"

import React, { useState } from "react"
import { PemuatData } from "@/components/PemuatData"
import Link from "next/link"
import { getStudentMaterials } from "@/app/actions/student"
import { 
  ArrowLeft, 
  Video, 
  FileText, 
  ExternalLink, 
  Play, 
  Sparkles,
  BookOpen,
  Clock,
} from "lucide-react"

export function IsiMateri({ awal }: { awal: Awaited<ReturnType<typeof getStudentMaterials>> }) {
  const [materials, setMaterials] = useState<any[]>(awal)
  const [isLoading, setIsLoading] = useState(false)
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(awal[0]?.id ?? null)


  if (isLoading) {
    return (
      <PemuatData pesan="Memuat materi..." />
    )
  }

  const activeMaterial = materials.find(m => m.id === activeMaterialId)

  const isYouTube = (url: string) => url?.includes("youtube") || url?.includes("youtu.be")
  const isDrive = (url: string) => url?.includes("drive.google")

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link href="/student" className="p-2 rounded-2xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">Materi Pembelajaran</h2>
            <p className="text-[11px] text-slate-500 font-medium">Embed YouTube & Google Drive</p>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-600" />
          {materials.length} Modul
        </span>
      </div>

      {materials.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Materi</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Guru belum mengunggah materi untuk kelas Anda. Materi yang diunggah oleh guru pengampu akan muncul di sini secara otomatis.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Active Material Player */}
          {activeMaterial && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col">
              <div className="w-full bg-slate-950 relative aspect-video flex items-center justify-center text-white">
                {activeMaterial.url && isYouTube(activeMaterial.url) ? (
                  <iframe
                    className="w-full h-full"
                    src={activeMaterial.url.replace("watch?v=", "embed/")}
                    title={activeMaterial.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : activeMaterial.url && isDrive(activeMaterial.url) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900">
                    <FileText className="w-10 h-10 text-blue-400 mb-2" />
                    <p className="text-xs font-bold text-white mb-1">Modul Google Drive</p>
                    <a
                      href={activeMaterial.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md mt-2"
                    >
                      <span>Buka Dokumen</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : activeMaterial.url ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900">
                    <FileText className="w-10 h-10 text-blue-400 mb-2" />
                    <a
                      href={activeMaterial.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md mt-2"
                    >
                      <span>Buka Link Materi</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-tr from-teal-900 to-slate-900">
                    <BookOpen className="w-10 h-10 text-emerald-400 mb-2" />
                    <p className="text-xs font-bold text-white mb-1">Materi Teks</p>
                    <p className="text-[11px] text-emerald-200 max-w-xs">{activeMaterial.description}</p>
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-md">
                    {activeMaterial.subject?.name || "Umum"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{activeMaterial.title}</h3>
                <p className="text-[11px] text-slate-500">Pengampu: {activeMaterial.author?.name || "-"}</p>
                {activeMaterial.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    {activeMaterial.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Material List */}
          <div className="flex flex-col gap-2.5 mt-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Daftar Modul ({materials.length})
            </h3>

            <div className="flex flex-col gap-2">
              {materials.map((mat: any) => {
                const isCurrent = mat.id === activeMaterialId
                return (
                  <button
                    key={mat.id}
                    onClick={() => setActiveMaterialId(mat.id)}
                    className={`p-3 rounded-2xl text-left transition flex items-center justify-between border ${
                      isCurrent
                        ? "bg-blue-50/70 border-blue-400 shadow-sm"
                        : "bg-white border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        mat.url && isYouTube(mat.url)
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        {mat.url && isYouTube(mat.url) ? <Play className="w-4 h-4 fill-red-600" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{mat.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">{mat.subject?.name || "Umum"} • {mat.author?.name || "-"}</p>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                        Aktif
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
