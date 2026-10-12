"use client"

import React, { useState } from "react"
import {
  FileText,
  FileSpreadsheet,
  Folder,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Maximize2,
  Minimize2,
  Paperclip,
} from "lucide-react"
import { ImageWithZoom } from "@/components/ImageWithZoom"

export type EmbedItem = {
  type:
    | "drive-file"
    | "google-doc"
    | "google-sheet"
    | "google-slide"
    | "google-form"
    | "drive-folder"
    | "youtube"
    | "image"
    | "generic"
  label: string
  embedUrl: string
  originalUrl: string
  color: string
}

const URL_REGEX =
  /(?:https?:\/\/|www\.|drive\.google\.com\/|docs\.google\.com\/|youtu\.be\/|youtube\.com\/)[^\s<>'")]+/gi

export function parseEmbeds(text: string | null | undefined): {
  embeds: EmbedItem[]
  hasOnlyUrl: boolean
} {
  if (!text) return { embeds: [], hasOnlyUrl: false }

  const matches = (text.match(URL_REGEX) || []).map((u) =>
    u.replace(/[.,;:)\]]+$/, "")
  )

  const embeds: EmbedItem[] = []
  const seen = new Set<string>()

  for (let rawUrl of matches) {
    let cleanUrl = rawUrl.trim()
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl
    }

    if (seen.has(cleanUrl)) continue
    seen.add(cleanUrl)

    let embed: EmbedItem | null = null

    // Google Docs
    const mDoc = cleanUrl.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i)
    if (mDoc) {
      embed = {
        type: "google-doc",
        label: "Google Dokumen (Docs)",
        embedUrl: `https://docs.google.com/document/d/${mDoc[1]}/preview`,
        originalUrl: cleanUrl,
        color: "text-blue-600 bg-blue-50 border-blue-200",
      }
    }

    // Google Sheets
    const mSheet = cleanUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i)
    if (!embed && mSheet) {
      embed = {
        type: "google-sheet",
        label: "Google Spreadsheet (Sheets)",
        embedUrl: `https://docs.google.com/spreadsheets/d/${mSheet[1]}/preview`,
        originalUrl: cleanUrl,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      }
    }

    // Google Slides
    const mSlide = cleanUrl.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i)
    if (!embed && mSlide) {
      embed = {
        type: "google-slide",
        label: "Google Presentasi (Slides)",
        embedUrl: `https://docs.google.com/presentation/d/${mSlide[1]}/preview`,
        originalUrl: cleanUrl,
        color: "text-amber-600 bg-amber-50 border-amber-200",
      }
    }

    // Google Forms
    const mFormE = cleanUrl.match(/docs\.google\.com\/forms\/d\/e\/([a-zA-Z0-9_-]+)/i)
    const mForm = cleanUrl.match(/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)/i)
    if (!embed && (mFormE || mForm)) {
      const id = (mFormE || mForm)![1]
      const path = mFormE ? `d/e/${id}` : `d/${id}`
      embed = {
        type: "google-form",
        label: "Google Formulir (Forms)",
        embedUrl: `https://docs.google.com/forms/${path}/viewform?embedded=true`,
        originalUrl: cleanUrl,
        color: "text-purple-600 bg-purple-50 border-purple-200",
      }
    }

    // Google Drive Folder
    const mFolder = cleanUrl.match(
      /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i
    )
    if (!embed && mFolder) {
      embed = {
        type: "drive-folder",
        label: "Folder Google Drive",
        embedUrl: `https://drive.google.com/embeddedfolderview?id=${mFolder[1]}#list`,
        originalUrl: cleanUrl,
        color: "text-sky-600 bg-sky-50 border-sky-200",
      }
    }

    // Google Drive File
    const mDriveFile = cleanUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i)
    const mDriveOpen = cleanUrl.match(
      /drive\.google\.com\/(?:open|uc)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i
    )
    if (!embed && (mDriveFile || mDriveOpen)) {
      const id = (mDriveFile || mDriveOpen)![1]
      embed = {
        type: "drive-file",
        label: "Berkas Tugas (Google Drive)",
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        originalUrl: cleanUrl,
        color: "text-blue-600 bg-blue-50 border-blue-200",
      }
    }

    // YouTube
    const mYtShort = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i)
    const mYtWatch = cleanUrl.match(
      /youtube\.com\/watch\?[^#]*\bv=([a-zA-Z0-9_-]+)/i
    )
    const mYtEmbed = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i)
    const mYtShorts = cleanUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i)
    if (!embed && (mYtShort || mYtWatch || mYtEmbed || mYtShorts)) {
      const id = (mYtShort || mYtWatch || mYtEmbed || mYtShorts)![1]
      embed = {
        type: "youtube",
        label: "Video YouTube",
        embedUrl: `https://www.youtube.com/embed/${id}`,
        originalUrl: cleanUrl,
        color: "text-rose-600 bg-rose-50 border-rose-200",
      }
    }

    // Image URL
    if (!embed && /\.(?:jpe?g|png|webp|gif|svg)(?:\?.*)?$/i.test(cleanUrl)) {
      embed = {
        type: "image",
        label: "Gambar Tugas",
        embedUrl: cleanUrl,
        originalUrl: cleanUrl,
        color: "text-teal-600 bg-teal-50 border-teal-200",
      }
    }

    if (embed) {
      embeds.push(embed)
    }
  }

  const trimmed = text.trim()
  const hasOnlyUrl =
    embeds.length === 1 &&
    (trimmed === embeds[0].originalUrl ||
      trimmed === embeds[0].originalUrl.replace(/^https?:\/\//i, ""))

  return { embeds, hasOnlyUrl }
}

function renderTextWithLinks(text: string) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  const regex = new RegExp(URL_REGEX.source, "gi")
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const rawUrl = match[0]
    const cleanUrl = rawUrl.replace(/[.,;:)\]]+$/, "")
    const fullUrl =
      cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")
        ? cleanUrl
        : "https://" + cleanUrl

    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    parts.push(
      <a
        key={match.index}
        href={fullUrl}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:text-blue-800 underline font-semibold break-all inline-flex items-center gap-0.5 mx-0.5"
      >
        <span>{cleanUrl}</span>
        <ExternalLink className="w-3 h-3 inline-block shrink-0" />
      </a>
    )

    lastIndex = match.index + rawUrl.length
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts
}

function EmbedCard({ embed }: { embed: EmbedItem }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getIcon = () => {
    switch (embed.type) {
      case "google-sheet":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
      case "drive-folder":
        return <Folder className="w-4 h-4 text-sky-600" />
      case "youtube":
        return <Video className="w-4 h-4 text-rose-600" />
      case "image":
        return <ImageIcon className="w-4 h-4 text-teal-600" />
      default:
        return <FileText className="w-4 h-4 text-blue-600" />
    }
  }

  if (embed.type === "image") {
    return (
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-xs font-bold text-slate-800">{embed.label}</span>
          </div>
          <a
            href={embed.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 rounded-lg flex items-center gap-1 shadow-2xs hover:bg-slate-50 transition"
          >
            <span>Buka Gambar</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="p-3 flex justify-center bg-slate-900/5">
          <ImageWithZoom
            src={embed.embedUrl}
            className="max-h-[480px] w-auto object-contain rounded-xl shadow-xs"
          />
        </div>
      </div>
    )
  }

  if (embed.type === "youtube") {
    return (
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col">
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="text-xs font-bold text-slate-800">{embed.label}</span>
          </div>
          <a
            href={embed.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 rounded-lg flex items-center gap-1 shadow-2xs hover:bg-slate-50 transition"
          >
            <span>Tonton di YouTube</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="w-full aspect-video bg-black">
          <iframe
            src={embed.embedUrl}
            title={embed.label}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    )
  }

  // Google Drive & Docs/Sheets/Slides/Forms/Folder iframe embed
  return (
    <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-sm flex flex-col">
      <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {getIcon()}
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              {embed.label}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Pratinjau Dokumen Tugas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg flex items-center gap-1 hover:bg-slate-50 transition"
            title={isExpanded ? "Kecilkan Tampilan" : "Perbesar Tampilan"}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Kecilkan</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Perbesar</span>
              </>
            )}
          </button>

          <a
            href={embed.originalUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 rounded-lg flex items-center gap-1 shadow-2xs hover:bg-blue-50 transition"
            title="Buka dokumen di tab baru (Google Drive)"
          >
            <span>Buka Dokumen</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="w-full relative bg-slate-100 flex items-center justify-center">
        <iframe
          src={embed.embedUrl}
          title={embed.label}
          className={`w-full ${
            isExpanded ? "h-[750px]" : "h-[450px] sm:h-[550px]"
          } border-0 bg-white transition-all`}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

      <div className="px-3.5 py-2 bg-slate-50/70 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between gap-2">
        <span>
          💡 Dokumen tidak tampil? Pastikan akses tautan diatur ke <strong>"Siapa saja yang memiliki link"</strong>.
        </span>
        <a
          href={embed.originalUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline font-semibold shrink-0"
        >
          Buka Tab Baru ↗
        </a>
      </div>
    </div>
  )
}

export function TampilanDeskripsiTugas({
  description,
}: {
  description: string | null | undefined
}) {
  if (!description || !description.trim()) return null

  const { embeds, hasOnlyUrl } = parseEmbeds(description)

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Jika ada instruksi teks (selain tautan tunggal yang di-embed) */}
      {!hasOnlyUrl && (
        <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 whitespace-pre-wrap">
          {renderTextWithLinks(description)}
        </div>
      )}

      {/* Render setiap dokumen / media yang di-embed */}
      {embeds.map((embed, idx) => (
        <EmbedCard key={idx} embed={embed} />
      ))}
    </div>
  )
}
